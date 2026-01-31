package com.yupi.springbootinit.bizmq;

import com.rabbitmq.client.Channel;
import com.yupi.springbootinit.api.OpenAiApi;
import com.yupi.springbootinit.common.ErrorCode;
import com.yupi.springbootinit.exception.BusinessException;
import com.yupi.springbootinit.model.entity.Chart;
import com.yupi.springbootinit.service.ChartService;
import com.yupi.springbootinit.utils.ExcelUtils;
import lombok.SneakyThrows;
import lombok.extern.slf4j.Slf4j;
import org.apache.commons.lang3.StringUtils;
import org.springframework.amqp.rabbit.annotation.RabbitListener;
import org.springframework.amqp.support.AmqpHeaders;
import org.springframework.messaging.handler.annotation.Header;
import org.springframework.stereotype.Component;

import javax.annotation.Resource;

@Component
@Slf4j
public class BiMessageConsumer {

    @Resource
    ChartService chartService;

    @Resource
    OpenAiApi openAiApi;

    //指定程序监听的消息队列和确认机制
    @SneakyThrows
    @RabbitListener(queues = {BiMqConstant.BI_QUEUE_NAME},ackMode = "MANUAL")
    public void receiveMessage(String message, Channel channel, @Header(AmqpHeaders.DELIVERY_TAG) long deliveryTag) {

        if (StringUtils.isBlank(message)) {
            //任务失败拒绝
            channel.basicNack(deliveryTag,false,false);
            throw new BusinessException(ErrorCode.SYSTEM_ERROR,"消息为空");
        }
        long chartId = Long.parseLong(message);
        Chart chart = chartService.getById(chartId);
        if(chart == null){
            throw new BusinessException(ErrorCode.NOT_FOUND_ERROR,"图表为空");
        }

        //先修改图标任务状态为“执行中”，等执行完成后，修改为“已完成”，保存执行结果；执行失败后，状态修改为“失败”，记录任务状态信息
        Chart updateChart = new Chart();
        updateChart.setId(chart.getId());
        updateChart.setStatus("running");
        boolean b = chartService.updateById(updateChart);
        if(!b){
            channel.basicNack(deliveryTag,false,false);
            hadleChartUpdateError(chart.getId(), "图标状态running更新失败");
            return;
        }

        //调用大模型
        String response = openAiApi.doChat(buildUserInput(chart));
        // 分割字符串
        String[] parts = response.split("【】【】【】【】");
        // 提取图表配置和分析结论
        String genChart = parts[1].trim();
        String genResult = parts[2].trim();

        Chart updateChartResult = new Chart();
        updateChartResult.setId(chart.getId());
        updateChartResult.setGenChart(genChart);
        updateChartResult.setGenResult(genResult);
        updateChartResult.setStatus("success");
        boolean updateResult = chartService.updateById(updateChartResult);
        if(!updateResult){
            channel.basicNack(deliveryTag,false,false);
            hadleChartUpdateError(chart.getId(), "图表状态success更新失败");
        }

        //任务成功确认
        channel.basicAck(deliveryTag,false);
    }

    /**
     * 构造用户输入
     * @param chart
     * @return
     */
    private String buildUserInput(Chart chart){
        String goal = chart.getGoal();
        String chartType = chart.getChartType();
        String csvresult = chart.getChartData();

        //系统提示词
        final String prompt = "你是一个数据分析师和前端开发专家，接下来我会按照以下固定格式给你提供内容：\n" +
                "\n" +
                "分析需求：\n" +
                "(数据分析的需求或者目标)\n" +
                "原始数据：\n" +
                "(csv格式的原始数据，用,作为分隔符)\n" +
                "\n" +
                "请根据这两部分内容，按照以下指定格式生成内容（此外不要输出任何多余的开头、结尾、注释）\n" +
                "【】【】【】【】\n" +
                "{前端Echarts V5 的 option 配置对象格式化的JSON代码，合理地将数据进行可视化，不要生成任何多余的内容，比如注释}\n" +
                "【】【】【】【】\n" +
                "{明确的数据分析结论、越详细越好，不要生成多余的注释}";

        //用户输入
        StringBuilder userInput = new StringBuilder();
        userInput.append(prompt).append("\n");
        //拼接分析目标
        String usergoal = goal;
        if(StringUtils.isNotBlank(chartType)) {
            usergoal += "，请使用" + chartType + "图表";
        }
        userInput.append("分析目标").append(usergoal).append("\n");

        //拼接数据
        userInput.append("数据：").append(csvresult).append("\n");

        return userInput.toString();
    }

    private void hadleChartUpdateError(long chartId,String execMessage){

        Chart updateChartResult = new Chart();
        updateChartResult.setId(chartId);
        updateChartResult.setStatus("failed");
        updateChartResult.setExecMessage("execMessage");
        boolean updateResult = chartService.updateById(updateChartResult);
        if(!updateResult){
            log.error("更新图表失败状态失败"+chartId+","+execMessage);
        }
    }

}
