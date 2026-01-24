import { listMyChartByPageUsingPOST } from '@/services/yubi/chartController';
import {
  DashboardOutlined,
  FullscreenOutlined,
  PlusOutlined,
  SaveOutlined,
  SyncOutlined,
} from '@ant-design/icons';
import { Button, Card, Col, Pagination, Row, Space, Spin, Typography } from 'antd';
import ReactECharts from 'echarts-for-react';
import { useEffect, useState } from 'react';

const { Title, Paragraph } = Typography;

const Dashboard = () => {
  const [dashboardItems, setDashboardItems] = useState<any[]>([]);
  const [isEditing, setIsEditing] = useState(false);
  const [charts, setCharts] = useState<any[]>([]);
  const [loading, setLoading] = useState(false);
  const [pagination, setPagination] = useState({
    current: 1,
    pageSize: 12,
    total: 0,
  });

  // 全屏状态管理
  const [fullscreenChart, setFullscreenChart] = useState<number | null>(null);

  // 获取用户的图表列表
  useEffect(() => {
    const fetchCharts = async () => {
      setLoading(true);
      try {
        console.log('Fetching charts with pagination:', pagination);
        const response = await listMyChartByPageUsingPOST({
          current: pagination.current,
          pageSize: pagination.pageSize,
          name: '',
          chartType: '',
        });
        console.log('API Response:', response);
        if (response && response.data) {
          // 检查返回的数据结构
          if (response.data.records) {
            console.log('Charts from API:', response.data.records);
            console.log('Total charts:', response.data.total);
            setCharts(response.data.records);
            // 更新分页信息
            setPagination((prev) => ({
              ...prev,
              total: response.data.total || 0,
            }));
          } else if (response.data.list) {
            console.log('Charts from API (list):', response.data.list);
            console.log('Total charts:', response.data.total);
            setCharts(response.data.list);
            // 更新分页信息
            setPagination((prev) => ({
              ...prev,
              total: response.data.total || 0,
            }));
          } else {
            console.error('Unexpected data structure:', response.data);
            setCharts([]);
          }
        }
      } catch (error) {
        console.error('获取图表列表失败:', error);
      } finally {
        setLoading(false);
      }
    };

    fetchCharts();
  }, [pagination.current, pagination.pageSize]);

  const addChartToDashboard = (chart: any) => {
    console.log('Adding chart to dashboard:', chart);
    // 检查图表对象的结构
    // 根据图表类型设置默认大小
    let defaultWidth = 6;
    let defaultHeight = 2;

    if (chart.chartType === 'pie') {
      // 饼图需要方形
      defaultWidth = 6;
      defaultHeight = 3;
    } else if (chart.chartType === 'line' || chart.chartType === 'bar') {
      // 折线图和柱状图需要更长的宽度
      defaultWidth = 8;
      defaultHeight = 2;
    }

    const dashboardItem = {
      id: Date.now(),
      chartId: chart.id,
      title: chart.name || chart.title || '未命名图表',
      type: chart.chartType || chart.type || '未知类型',
      genChart: chart.genChart, // 保存genChart字段
      position: { x: 0, y: 0, width: defaultWidth, height: Math.max(defaultHeight, 3) }, // 确保最小高度为3
    };
    console.log('Dashboard item:', dashboardItem);
    setDashboardItems([...dashboardItems, dashboardItem]);
  };

  const removeChartFromDashboard = (itemId: number) => {
    setDashboardItems(dashboardItems.filter((item) => item.id !== itemId));
  };

  const saveDashboard = () => {
    // 保存仪表盘配置到后端
    console.log('Saving dashboard:', dashboardItems);
    setIsEditing(false);
  };

  const refreshDashboard = () => {
    // 刷新仪表盘数据
    console.log('Refreshing dashboard data');
  };

  // 实现全屏切换功能
  const toggleFullscreen = (chartId: number) => {
    if (fullscreenChart === chartId) {
      setFullscreenChart(null);
    } else {
      setFullscreenChart(chartId);
    }
  };

  // 解析 genChart 字符串为 ECharts 配置对象
  const parseGenChartToOption = (genChartStr: string | undefined): any => {
    if (!genChartStr) {
      return {};
    }

    try {
      console.log('原始 genChart 字符串:', genChartStr);

      // 第一步：去除首尾空白字符
      let chartConfig = genChartStr.trim();

      // 第二步：检查是否为双层转义的 JSON 字符串
      if (chartConfig.startsWith('"') && chartConfig.endsWith('"')) {
        // 情况1：字符串被引号包裹，需要先解析出实际JSON字符串
        try {
          const parsedOnce = JSON.parse(chartConfig);
          console.log('第一次解析结果（去除外层引号）:', parsedOnce);

          // 检查解析后是否还是字符串（表示是双层转义）
          if (typeof parsedOnce === 'string') {
            // 进行第二次解析
            const chartOption = JSON.parse(parsedOnce);
            console.log('第二次解析结果（最终图表配置）:', chartOption);
            // 添加toolbox工具
            chartOption.toolbox = {
              feature: {
                dataZoom: {
                  yAxisIndex: 'none',
                },
                saveAsImage: {
                  name: 'chart',
                },
                restore: {},
              },
            };
            return chartOption;
          } else if (typeof parsedOnce === 'object') {
            // 如果第一次解析直接得到了对象，直接返回
            console.log('直接解析为对象:', parsedOnce);
            // 添加toolbox工具
            parsedOnce.toolbox = {
              feature: {
                dataZoom: {
                  yAxisIndex: 'none',
                },
                saveAsImage: {
                  name: 'chart',
                },
                restore: {},
              },
            };
            return parsedOnce;
          }
        } catch (firstParseError) {
          console.error('第一次解析失败:', firstParseError);
          // 如果第一次解析失败，尝试直接解析
        }
      }

      // 情况2：尝试AddChart页面使用的特殊解析方式（在字符串两边添加引号后解析）
      try {
        const parsedOnce = JSON.parse('"' + chartConfig + '"');
        console.log('特殊解析方式 - 第一次解析结果:', parsedOnce);

        if (typeof parsedOnce === 'string') {
          const chartOption = JSON.parse(parsedOnce);
          console.log('特殊解析方式 - 第二次解析结果:', chartOption);
          // 添加toolbox工具
          chartOption.toolbox = {
            feature: {
              dataZoom: {
                yAxisIndex: 'none',
              },
              saveAsImage: {
                name: 'chart',
              },
              restore: {},
            },
          };
          return chartOption;
        }
      } catch (specialParseError) {
        console.error('特殊解析方式失败:', specialParseError);
        // 如果特殊解析方式失败，尝试直接解析
      }

      // 情况3：直接尝试解析为JSON对象
      const chartOption = JSON.parse(chartConfig);
      console.log('直接解析结果:', chartOption);
      // 添加toolbox工具
      chartOption.toolbox = {
        feature: {
          dataZoom: {
            yAxisIndex: 'none',
          },
          saveAsImage: {
            name: 'chart',
          },
          restore: {},
        },
      };
      return chartOption;
    } catch (e: any) {
      console.error('解析 genChart 失败:', e.message);
      console.error('失败字符串内容:', genChartStr);

      // 返回一个错误提示的图表配置
      return {
        title: {
          text: '图表解析失败',
          subtext: '数据格式异常',
          left: 'center',
          textStyle: {
            color: '#ff4d4f',
            fontSize: 18,
          },
          subtextStyle: {
            color: '#999',
            fontSize: 14,
          },
        },
        graphic: {
          type: 'text',
          left: 'center',
          top: 'middle',
          style: {
            text: '无法加载图表配置',
            fill: '#ccc',
            fontSize: 16,
          },
        },
      };
    }
  };

  // 根据图表类型生成图表配置
  const getChartOption = (chart: any) => {
    // 首先尝试使用genChart字段
    if (chart.genChart) {
      try {
        const chartOption = parseGenChartToOption(chart.genChart);
        return <ReactECharts option={chartOption} style={{ height: '100%', width: '100%' }} />;
      } catch (error) {
        console.error('渲染图表失败:', error);
        return <div style={{ textAlign: 'center', padding: 40, color: '#999' }}>图表渲染失败</div>;
      }
    }

    // 如果没有genChart字段，使用模拟数据
    const xAxisData = ['周一', '周二', '周三', '周四', '周五', '周六', '周日'];
    const seriesData = [120, 132, 101, 134, 90, 230, 210];

    // 根据图表类型返回不同的配置
    const chartType = chart.type || '未知类型';
    try {
      switch (chartType) {
        case '折线图':
        case 'line':
          return (
            <ReactECharts
              option={{
                tooltip: {
                  trigger: 'axis',
                },
                xAxis: {
                  data: xAxisData,
                },
                yAxis: {},
                series: [
                  {
                    data: seriesData,
                    type: 'line',
                  },
                ],
              }}
              style={{ height: '100%', width: '100%' }}
            />
          );
        case '柱状图':
        case 'bar':
          return (
            <ReactECharts
              option={{
                tooltip: {
                  trigger: 'axis',
                },
                xAxis: {
                  data: xAxisData,
                },
                yAxis: {},
                series: [
                  {
                    data: seriesData,
                    type: 'bar',
                  },
                ],
              }}
              style={{ height: '100%', width: '100%' }}
            />
          );
        case '饼图':
        case 'pie':
          return (
            <ReactECharts
              option={{
                tooltip: {
                  trigger: 'item',
                },
                series: [
                  {
                    data: [
                      { value: 335, name: '直接访问' },
                      { value: 310, name: '邮件营销' },
                      { value: 234, name: '联盟广告' },
                      { value: 135, name: '视频广告' },
                      { value: 1548, name: '搜索引擎' },
                    ],
                    type: 'pie',
                  },
                ],
              }}
              style={{ height: '100%', width: '100%' }}
            />
          );
        default:
          return (
            <div style={{ textAlign: 'center', padding: 40, color: '#999' }}>
              不支持的图表类型: {chartType}
            </div>
          );
      }
    } catch (error) {
      console.error('渲染图表失败:', error);
      return <div style={{ textAlign: 'center', padding: 40, color: '#999' }}>图表渲染失败</div>;
    }
  };

  return (
    <div style={{ padding: 24 }}>
      <Space style={{ marginBottom: 24 }}>
        <Title level={2}>
          <DashboardOutlined /> 仪表盘
        </Title>
        <Button
          key="edit"
          type="primary"
          icon={<PlusOutlined />}
          onClick={() => setIsEditing(!isEditing)}
        >
          {isEditing ? '取消编辑' : '编辑仪表盘'}
        </Button>
        {isEditing && (
          <Button key="save" icon={<SaveOutlined />} onClick={saveDashboard}>
            保存配置
          </Button>
        )}
        <Button key="refresh" icon={<SyncOutlined />} onClick={refreshDashboard}>
          刷新数据
        </Button>
      </Space>

      {isEditing ? (
        <div style={{ marginBottom: 24 }}>
          <Title level={4}>可选图表</Title>
          <Spin spinning={loading} tip="加载图表中...">
            <Row gutter={[16, 16]}>
              {charts.length > 0 ? (
                charts.map((chart: any, index: number) => (
                  <Col key={chart.id || index} span={8}>
                    <Card
                      title={chart.name || chart.title || '未命名图表'}
                      extra={
                        <Button type="link" onClick={() => addChartToDashboard(chart)}>
                          添加到仪表盘
                        </Button>
                      }
                    >
                      <Paragraph>类型: {chart.chartType || chart.type || '未知类型'}</Paragraph>
                      <Paragraph>创建时间: {chart.createTime || '未知时间'}</Paragraph>
                    </Card>
                  </Col>
                ))
              ) : (
                <div style={{ textAlign: 'center', padding: 64 }}>
                  <Paragraph style={{ color: '#999' }}>
                    您还没有创建任何图表，请先创建图表
                  </Paragraph>
                </div>
              )}
            </Row>
            {/* 添加分页组件 */}
            {charts.length > 0 && (
              <div style={{ marginTop: 24, textAlign: 'center' }}>
                <Pagination
                  current={pagination.current}
                  pageSize={pagination.pageSize}
                  total={pagination.total}
                  onChange={(page, pageSize) => {
                    setPagination((prev) => ({
                      ...prev,
                      current: page,
                      pageSize,
                    }));
                  }}
                  showSizeChanger
                  pageSizeOptions={['6', '12', '24', '36']}
                  showTotal={(total) => `共 ${total} 个图表`}
                />
              </div>
            )}
          </Spin>
        </div>
      ) : null}

      <Title level={4}>当前仪表盘</Title>
      <div
        style={{
          minHeight: 600,
          border: '1px dashed #d9d9d9',
          padding: 16,
          borderRadius: 4,
        }}
      >
        {dashboardItems.length > 0 ? (
          <div style={{ width: '100%', overflow: 'auto' }}>
            <Row gutter={[16, 16]} wrap>
              {dashboardItems.map((item) => (
                <Col key={item.id} span={item.position?.width || 6}>
                  <div style={{ padding: 8, overflow: 'visible' }}>
                    <Card
                      title={
                        <div
                          style={{
                            display: 'flex',
                            justifyContent: 'space-between',
                            alignItems: 'center',
                          }}
                        >
                          <span
                            style={{
                              whiteSpace: 'nowrap',
                              overflow: 'hidden',
                              textOverflow: 'ellipsis',
                              flex: 1,
                              marginRight: 8,
                            }}
                          >
                            {item.title}
                          </span>
                          <Space size="small">
                            <Button
                              type="link"
                              icon={<FullscreenOutlined />}
                              onClick={(e) => {
                                e.stopPropagation();
                                toggleFullscreen(item.id);
                              }}
                              size="small"
                            />
                            {isEditing && (
                              <Button
                                danger
                                type="link"
                                onClick={(e) => {
                                  e.stopPropagation();
                                  removeChartFromDashboard(item.id);
                                }}
                                size="small"
                              >
                                移除
                              </Button>
                            )}
                          </Space>
                        </div>
                      }
                      style={{ width: '100%' }}
                      styles={{ body: { padding: 0 } }}
                    >
                      {fullscreenChart === item.id ? (
                        <div
                          style={{
                            position: 'fixed',
                            top: 0,
                            left: 0,
                            width: '100vw',
                            height: '100vh',
                            zIndex: 9999,
                            backgroundColor: '#fff',
                            padding: 24,
                          }}
                        >
                          <Button
                            type="primary"
                            icon={<FullscreenOutlined />}
                            onClick={(e) => {
                              e.stopPropagation();
                              toggleFullscreen(item.id);
                            }}
                            style={{ marginBottom: 24 }}
                          >
                            退出全屏
                          </Button>
                          <div style={{ height: 'calc(100vh - 100px)' }}>
                            {getChartOption(item)}
                          </div>
                        </div>
                      ) : (
                        <div
                          style={{
                            width: '100%',
                            height: (item.position?.height || 3) * 120,
                            minHeight: 250,
                          }}
                        >
                          {getChartOption(item)}
                        </div>
                      )}
                    </Card>
                  </div>
                </Col>
              ))}
            </Row>
          </div>
        ) : (
          <div style={{ textAlign: 'center', padding: 64 }}>
            <DashboardOutlined style={{ fontSize: 48, color: '#d9d9d9' }} />
            <Paragraph style={{ marginTop: 16, color: '#999' }}>
              {isEditing ? '从左侧选择图表添加到仪表盘' : '仪表盘为空，请点击编辑按钮添加图表'}
            </Paragraph>
          </div>
        )}
      </div>
    </div>
  );
};

export default Dashboard;
