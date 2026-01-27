import { genChartByAiAsyncUsingPOST } from '@/services/yubi/chartController';
import { FullscreenOutlined, UploadOutlined } from '@ant-design/icons';
import {
  Button,
  Card,
  Col,
  Form,
  Input,
  message,
  Row,
  Select,
  Space,
  Spin,
  Typography,
  Upload,
} from 'antd';
import TextArea from 'antd/es/input/TextArea';
import ReactECharts from 'echarts-for-react';
import React, { useState } from 'react';
import ReactMarkdown from 'react-markdown';

/**
 * 添加图表(异步)页面
 * @constructor
 */
const AddChartAsync: React.FC = () => {
  const [chart, setChart] = useState<API.BiResponse>();
  const [option, setOption] = useState<any>();
  const [submitting, setSubmitting] = useState<boolean>(false);
  const [isFullscreen, setIsFullscreen] = useState<boolean>(false);

  // 实现全屏切换功能
  const toggleFullscreen = () => {
    setIsFullscreen(!isFullscreen);
  };

  /**
   * 提交
   * @param values
   */
  const onFinish = async (values: any) => {
    // 避免重复提交
    if (submitting) {
      return;
    }
    setSubmitting(true);
    setChart(undefined);
    setOption(undefined);
    // 对接后端，上传数据
    const formData = {
      goal: values.goal,
      name: values.name,
      chartType: values.chartType,
    };
    try {
      const res = await genChartByAiAsyncUsingPOST({}, formData, values.file?.file?.originFileObj);
      if (!res?.data) {
        message.error('分析失败');
      } else {
        message.success('分析任务提交成功，请稍后在我的图表页面查看。');
        console.log('后端返回数据:', res.data);

        // 处理 genResult 字段
        if (res.data.genResult) {
          let genResult = res.data.genResult;
          // 移除多余的转义字符和换行符
          genResult = genResult.replace(/\\n/g, '\n').trim();
          // 移除可能的 JSON 格式的额外内容（如 role、finish_reason 等）
          const jsonEndIndex = genResult.indexOf('"role":"assistant"');
          if (jsonEndIndex > -1) {
            genResult = genResult.substring(0, jsonEndIndex).trim();
          }
          // 更新 chart 对象
          setChart({ ...res.data, genResult });
        }

        // 处理 genChart 字段
        if (res.data.genChart) {
          try {
            let chartConfig = res.data.genChart;
            console.log('原始图表配置:', chartConfig);

            // 第一步：移除首尾的换行符和空白字符
            chartConfig = chartConfig.trim();

            console.log('处理后的图表配置:', chartConfig);

            // 第二步：进行两次 JSON 解析
            // 第一次解析会将转义的字符串转换为实际的 JSON 文本字符串
            // 第二次解析会将 JSON 文本字符串转换为 JavaScript 对象
            const parsedOnce = JSON.parse('"' + chartConfig + '"');
            console.log('第一次解析结果:', parsedOnce);
            const chartOption = JSON.parse(parsedOnce);
            console.log('第二次解析结果:', chartOption);

            if (chartOption) {
              // 添加toolbox工具（放大缩小和下载功能）
              chartOption.toolbox = {
                feature: {
                  dataZoom: {
                    yAxisIndex: 'none',
                  },
                  saveAsImage: {
                    name: chart?.name || 'chart',
                  },
                  restore: {},
                },
              };
              setOption(chartOption);
            } else {
              message.error('图表配置为空');
            }
          } catch (e: any) {
            message.error('图表代码解析错误: ' + e.message);
            console.error('图表代码解析错误:', e);
            console.error('原始图表配置:', res.data.genChart);
          }
        }
      }
    } catch (e: any) {
      message.error('分析失败，' + e.message);
      console.error('分析失败:', e);
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <div
      className="add-chart"
      style={{ padding: 24, minHeight: '100vh', backgroundColor: '#f0f2f5' }}
    >
      <Typography.Title
        level={2}
        style={{ marginBottom: 32, textAlign: 'center', color: '#1890ff', fontWeight: 600 }}
      >
        智能图表生成
      </Typography.Title>

      <Row gutter={[24, 24]} justify="center">
        <Col xs={24} lg={16}>
          <Card
            title={
              <span style={{ fontSize: 18, fontWeight: 500, color: '#262626' }}>
                智能分析
              </span>
            }
            style={{
              boxShadow: '0 2px 8px rgba(0, 0, 0, 0.08)',
              borderRadius: 8,
              height: '100%',
            }}
            headStyle={{
              borderBottom: '2px solid #f0f0f0',
              padding: '16px 24px',
            }}
            bodyStyle={{ padding: '24px' }}
          >
            <Form
              name="addChart"
              onFinish={onFinish}
              initialValues={{}}
              layout="vertical"
              requiredMark={false}
            >
              <Form.Item
                name="goal"
                label={
                  <span style={{ fontWeight: 500, color: '#595959' }}>
                    分析目标
                  </span>
                }
                rules={[{ required: true, message: '请输入分析目标' }]}
              >
                <TextArea
                  placeholder="请输入你的分析需求，比如：分析网站用户的增长情况"
                  rows={4}
                  style={{
                    borderRadius: 6,
                  }}
                />
              </Form.Item>

              <Form.Item
                name="name"
                label={
                  <span style={{ fontWeight: 500, color: '#595959' }}>
                    图表名称
                  </span>
                }
              >
                <Input
                  placeholder="请输入图表名称"
                  style={{
                    borderRadius: 6,
                  }}
                />
              </Form.Item>

              <Form.Item
                name="chartType"
                label={
                  <span style={{ fontWeight: 500, color: '#595959' }}>
                    图表类型
                  </span>
                }
              >
                <Select
                  placeholder="请选择图表类型"
                  options={[
                    { value: '折线图', label: '折线图' },
                    { value: '柱状图', label: '柱状图' },
                    { value: '堆叠图', label: '堆叠图' },
                    { value: '饼图', label: '饼图' },
                    { value: '散点图', label: '散点图' },
                    { value: '雷达图', label: '雷达图' },
                    { value: 'K线图', label: 'K线图' },
                    { value: '盒须图', label: '盒须图' },
                    { value: '热力图', label: '热力图' },
                    { value: '漏斗图', label: '漏斗图' },
                    { value: '{根据情况自动选择}', label: '(根据情况自动选择)' },
                  ]}
                  style={{
                    width: '100%',
                    borderRadius: 6,
                  }}
                />
              </Form.Item>

              <Form.Item
                name="file"
                label={
                  <span style={{ fontWeight: 500, color: '#595959' }}>
                    原始数据
                  </span>
                }
              >
                <Upload name="file" maxCount={1} style={{ width: '100%' }}>
                  <Button
                    icon={<UploadOutlined />}
                    style={{
                      width: '100%',
                      borderRadius: 6,
                      height: 40,
                    }}
                  >
                    上传 CSV 文件
                  </Button>
                </Upload>
              </Form.Item>

              <Form.Item style={{ marginBottom: 0, marginTop: 32 }}>
                <Space size="middle" style={{ width: '100%', justifyContent: 'center' }}>
                  <Button
                    type="primary"
                    htmlType="submit"
                    loading={submitting}
                    disabled={submitting}
                    size="large"
                    style={{
                      padding: '0 48px',
                      borderRadius: 6,
                      height: 44,
                      fontWeight: 500,
                    }}
                  >
                    生成图表
                  </Button>
                  <Button
                    htmlType="reset"
                    size="large"
                    style={{
                      padding: '0 48px',
                      borderRadius: 6,
                      height: 44,
                      fontWeight: 500,
                    }}
                  >
                    重置
                  </Button>
                </Space>
              </Form.Item>
            </Form>
          </Card>
        </Col>
      </Row>
    </div>
  );
};

export default AddChartAsync;
