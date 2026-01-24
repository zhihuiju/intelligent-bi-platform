import { genChartByAiUsingPOST } from '@/services/yubi/chartController';
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
 * 添加图表页面
 * @constructor
 */
const AddChart: React.FC = () => {
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
      const res = await genChartByAiUsingPOST({}, formData, values.file?.file?.originFileObj);
      if (!res?.data) {
        message.error('分析失败');
      } else {
        message.success('分析成功');
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
      style={{ padding: 24, minHeight: '100vh', backgroundColor: '#f5f5f5' }}
    >
      <Typography.Title
        level={2}
        style={{ marginBottom: 32, textAlign: 'center', color: '#1890ff' }}
      >
        智能图表生成
      </Typography.Title>

      <Row gutter={32}>
        <Col span={12}>
          <Card
            title="智能分析"
            style={{
              boxShadow: '0 4px 12px rgba(0, 0, 0, 0.1)',
              borderRadius: 8,
              overflow: 'hidden',
            }}
            bodyStyle={{ padding: 24 }}
          >
            <Form
              name="addChart"
              labelAlign="right"
              labelCol={{ span: 5 }}
              wrapperCol={{ span: 19 }}
              onFinish={onFinish}
              initialValues={{}}
              layout="vertical"
            >
              <Form.Item
                name="goal"
                label="分析目标"
                rules={[{ required: true, message: '请输入分析目标' }]}
                style={{ marginBottom: 20 }}
              >
                <TextArea
                  placeholder="请输入你的分析需求，比如：分析网站用户的增长情况"
                  rows={4}
                  style={{
                    borderRadius: 4,
                    borderColor: '#d9d9d9',
                    transition: 'all 0.3s',
                  }}
                />
              </Form.Item>

              <Form.Item name="name" label="图表名称" style={{ marginBottom: 20 }}>
                <Input
                  placeholder="请输入图表名称"
                  style={{
                    borderRadius: 4,
                    borderColor: '#d9d9d9',
                    transition: 'all 0.3s',
                  }}
                />
              </Form.Item>

              <Form.Item name="chartType" label="图表类型" style={{ marginBottom: 20 }}>
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
                    borderRadius: 4,
                    borderColor: '#d9d9d9',
                    transition: 'all 0.3s',
                  }}
                />
              </Form.Item>

              <Form.Item name="file" label="原始数据" style={{ marginBottom: 32 }}>
                <Upload name="file" maxCount={1} style={{ width: '100%' }}>
                  <Button
                    icon={<UploadOutlined />}
                    style={{
                      width: '100%',
                      borderRadius: 4,
                      backgroundColor: '#f0f0f0',
                      borderColor: '#d9d9d9',
                      transition: 'all 0.3s',
                      '&:hover': {
                        backgroundColor: '#e6f7ff',
                        borderColor: '#1890ff',
                      },
                    }}
                  >
                    上传 CSV 文件
                  </Button>
                </Upload>
              </Form.Item>

              <Form.Item>
                <Space size="middle" style={{ width: '100%', justifyContent: 'center' }}>
                  <Button
                    type="primary"
                    htmlType="submit"
                    loading={submitting}
                    disabled={submitting}
                    size="large"
                    style={{
                      padding: '0 40px',
                      borderRadius: 4,
                      boxShadow: '0 2px 8px rgba(24, 144, 255, 0.3)',
                      transition: 'all 0.3s',
                    }}
                  >
                    生成图表
                  </Button>
                  <Button
                    htmlType="reset"
                    size="large"
                    style={{
                      padding: '0 40px',
                      borderRadius: 4,
                      transition: 'all 0.3s',
                    }}
                  >
                    重置
                  </Button>
                </Space>
              </Form.Item>
            </Form>
          </Card>
        </Col>

        <Col span={12}>
          <Card
            title="分析结论"
            style={{
              boxShadow: '0 4px 12px rgba(0, 0, 0, 0.1)',
              borderRadius: 8,
              marginBottom: 24,
              overflow: 'hidden',
            }}
            bodyStyle={{ padding: 24 }}
          >
            <Spin spinning={submitting} tip="正在分析数据...">
              {chart?.genResult ? (
                <div
                  style={{
                    color: '#333',
                    maxHeight: 220,
                    overflow: 'auto',
                    padding: 16,
                    backgroundColor: '#f0f9ff',
                    borderRadius: 6,
                    border: '1px solid #e6f7ff',
                    lineHeight: 1.6,
                    fontFamily:
                      ' -apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, "Helvetica Neue", Arial, sans-serif',
                  }}
                >
                  <ReactMarkdown
                    components={{
                      h1: ({ children }) => (
                        <h1 style={{ fontSize: '1.5em', margin: '0.67em 0' }}>{children}</h1>
                      ),
                      h2: ({ children }) => (
                        <h2 style={{ fontSize: '1.3em', margin: '0.75em 0' }}>{children}</h2>
                      ),
                      h3: ({ children }) => (
                        <h3 style={{ fontSize: '1.17em', margin: '0.83em 0' }}>{children}</h3>
                      ),
                      p: ({ children }) => <p style={{ margin: '1em 0' }}>{children}</p>,
                      ul: ({ children }) => (
                        <ul style={{ margin: '1em 0', paddingLeft: '2em' }}>{children}</ul>
                      ),
                      ol: ({ children }) => (
                        <ol style={{ margin: '1em 0', paddingLeft: '2em' }}>{children}</ol>
                      ),
                      li: ({ children }) => <li style={{ margin: '0.5em 0' }}>{children}</li>,
                      code: ({ children }) => (
                        <code
                          style={{
                            backgroundColor: '#f5f5f5',
                            padding: '0.2em 0.4em',
                            borderRadius: '3px',
                            fontSize: '0.9em',
                          }}
                        >
                          {children}
                        </code>
                      ),
                      pre: ({ children }) => (
                        <pre
                          style={{
                            backgroundColor: '#f5f5f5',
                            padding: '1em',
                            borderRadius: '4px',
                            overflow: 'auto',
                            fontSize: '0.9em',
                          }}
                        >
                          {children}
                        </pre>
                      ),
                      blockquote: ({ children }) => (
                        <blockquote
                          style={{
                            borderLeft: '4px solid #1890ff',
                            paddingLeft: '1em',
                            margin: '1em 0',
                            color: '#666',
                          }}
                        >
                          {children}
                        </blockquote>
                      ),
                      strong: ({ children }) => (
                        <strong style={{ fontWeight: 'bold' }}>{children}</strong>
                      ),
                      em: ({ children }) => <em style={{ fontStyle: 'italic' }}>{children}</em>,
                      a: ({ children, href }) => (
                        <a href={href} style={{ color: '#1890ff', textDecoration: 'none' }}>
                          {children}
                        </a>
                      ),
                    }}
                  >
                    {chart.genResult}
                  </ReactMarkdown>
                </div>
              ) : (
                <div
                  style={{
                    textAlign: 'center',
                    padding: 40,
                    color: '#999',
                    backgroundColor: '#fafafa',
                    borderRadius: 6,
                  }}
                >
                  请在左侧填写分析需求并上传数据
                </div>
              )}
            </Spin>
          </Card>

          <Card
            title="可视化图表"
            style={{
              boxShadow: '0 4px 12px rgba(0, 0, 0, 0.1)',
              borderRadius: 8,
              overflow: 'hidden',
            }}
            bodyStyle={{ padding: 24 }}
          >
            <Spin spinning={submitting} tip="正在生成图表...">
              {isFullscreen ? (
                <div
                  style={{
                    position: 'fixed',
                    top: 0,
                    left: 0,
                    width: '100vw',
                    height: '100vh',
                    zIndex: 9999,
                    backgroundColor: '#fff',
                    padding: 32,
                  }}
                >
                  <Button
                    type="primary"
                    icon={<FullscreenOutlined />}
                    onClick={toggleFullscreen}
                    style={{
                      marginBottom: 24,
                      boxShadow: '0 2px 8px rgba(24, 144, 255, 0.3)',
                      borderRadius: 4,
                    }}
                  >
                    退出全屏
                  </Button>
                  <div
                    style={{ height: 'calc(100vh - 120px)', borderRadius: 8, overflow: 'hidden' }}
                  >
                    <ReactECharts option={option} style={{ height: '100%', width: '100%' }} />
                  </div>
                </div>
              ) : (
                <div style={{ position: 'relative' }}>
                  {option && (
                    <Button
                      type="link"
                      icon={<FullscreenOutlined />}
                      onClick={toggleFullscreen}
                      size="small"
                      style={{
                        position: 'absolute',
                        bottom: 16,
                        right: 16,
                        zIndex: 1,
                        backgroundColor: 'rgba(255, 255, 255, 0.8)',
                        borderRadius: 4,
                        boxShadow: '0 2px 8px rgba(0, 0, 0, 0.1)',
                        transition: 'all 0.3s',
                        '&:hover': {
                          backgroundColor: '#fff',
                          boxShadow: '0 4px 12px rgba(0, 0, 0, 0.15)',
                        },
                      }}
                    />
                  )}
                  {option ? (
                    <div
                      style={{
                        height: 450,
                        borderRadius: 8,
                        overflow: 'hidden',
                        boxShadow: '0 2px 8px rgba(0, 0, 0, 0.08)',
                      }}
                    >
                      <ReactECharts option={option} style={{ height: '100%', width: '100%' }} />
                    </div>
                  ) : (
                    <div
                      style={{
                        textAlign: 'center',
                        padding: 80,
                        color: '#999',
                        backgroundColor: '#fafafa',
                        borderRadius: 8,
                        border: '1px dashed #d9d9d9',
                      }}
                    >
                      请先在左侧填写分析需求并上传数据
                    </div>
                  )}
                </div>
              )}
            </Spin>
          </Card>
        </Col>
      </Row>
    </div>
  );
};

export default AddChart;
