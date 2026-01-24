package com.yupi.springbootinit.api;

import cn.hutool.http.HttpRequest;
import cn.hutool.http.HttpUtil;
import cn.hutool.json.JSONUtil;
import org.springframework.stereotype.Service;

import java.util.ArrayList;
import java.util.HashMap;
import java.util.List;
import java.util.Map;

@Service
public class OpenAiApi {


    /**
     * 调用OpenAI API进行聊天
     *
     * @param userInput 用户输入的消息
     * @return API返回的响应结果
     */
    public String doChat(String userInput) {
        String url = "https://dashscope.aliyuncs.com/compatible-mode/v1/chat/completions";
        // 注意：请替换为您在阿里云DashScope控制台获取的真实API密钥
        String apiKey = "sk-eba0ed4dd2b94982a25d1d6a4fb4bed6";

        // 1. 构建符合官方文档的请求参数
        Map<String, Object> requestMap = new HashMap<>();
        requestMap.put("model", "deepseek-v3.2"); // 指定模型
        // 构建消息列表
        List<Map<String, String>> messages = new ArrayList<>();
        Map<String, String> message = new HashMap<>();
        message.put("role", "user");
        message.put("content", userInput);
        messages.add(message);
        requestMap.put("messages", messages);
        // 其他可选参数
        requestMap.put("stream", false); // 是否使用流式输出

        // 2. 将参数转换为JSON字符串
        String jsonBody = JSONUtil.toJsonStr(requestMap);
        System.out.println("发送的请求体：" + jsonBody);

        // 3. 发送请求
        String result = HttpRequest.post(url)
                .header("Authorization", "Bearer " + apiKey) // 填入有效密钥
                .header("Content-Type", "application/json")  // 添加必要请求头
                .body(jsonBody)  // 发送JSON请求体
                .timeout(60000) // 设置超时时间（毫秒）
                .execute()  // 执行请求
                .body();  // 获取响应体

        // 4. 打印结果
//        System.out.println("API响应结果：" + result);
        return result;
    }
}