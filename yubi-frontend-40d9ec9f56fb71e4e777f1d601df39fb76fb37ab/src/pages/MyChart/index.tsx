import { listMyChartByPageUsingPOST, deleteChartUsingPOST } from '@/services/yubi/chartController';
import { DeleteOutlined, FullscreenOutlined } from '@ant-design/icons';
import { useModel } from '@umijs/max';
import { Avatar, Button, Input, List, message } from 'antd';
import ReactECharts from 'echarts-for-react';
import React, { useEffect, useState } from 'react';
import ReactMarkdown from 'react-markdown';

/**
 * 我的图表页面
 * @constructor
 */
const MyChartPage: React.FC = () => {
  const initSearchParams = {
    pageSize: 12,
  };

  const [searchParams, setSearchParams] = useState<API.ChartQueryRequest>({ ...initSearchParams });
  const [chartList, setChartList] = useState<API.Chart[]>([]); // 初始化为空数组
  const [total, setTotal] = useState<number>(0);
  const [loading, setLoading] = useState<boolean>(false); // 新增：加载状态
  const { initialState } = useModel('@@initialState'); //用于获取用户头像
  const { currentUser } = initialState ?? {};

  // 全屏状态管理
  const [fullscreenChart, setFullscreenChart] = useState<number | null>(null);

  // 加载数据函数
  const loadData = async () => {
    // 添加加载状态管理
    setLoading(true);
    try {
      const res = await listMyChartByPageUsingPOST(searchParams);
      if (res.data) {
        setChartList(res.data.records ?? []);
        setTotal(res.data.total ?? 0);
      } else {
        message.error('获取图表失败');
      }
    } catch (e: any) {
      message.error('获取我的图表失败: ' + e.message);
    } finally {
      // 确保加载状态被关闭
      setLoading(false);
    }
  };

  // 实现全屏切换功能
  const toggleFullscreen = (chartId: number) => {
    if (fullscreenChart === chartId) {
      setFullscreenChart(null);
    } else {
      setFullscreenChart(chartId);
    }
  };

  // 实现删除图表功能
  const handleDeleteChart = async (chartId: any) => {
    console.log('删除图表 ID:', chartId);
    console.log('删除图表 ID 类型:', typeof chartId);
    
    // 检查chartId是否有效
    if (!chartId || Number(chartId) <= 0) {
      console.error('无效的图表ID:', chartId);
      message.error('删除失败: 无效的图表ID');
      return;
    }
    
    try {
      // 直接传递字符串类型的ID，避免Number类型截断大整数
      const deleteParams = { id: chartId };
      console.log('删除接口参数:', deleteParams);
      
      const res = await deleteChartUsingPOST(deleteParams);
      console.log('删除接口返回:', res);
      
      // 检查返回格式
      if (res) {
        if (res.code === 0) {
          message.success('删除成功');
          // 使用函数式更新确保获取最新的状态
          setChartList(prevCharts => {
            console.log('当前图表列表（函数式更新）:', prevCharts);
            const updatedCharts = prevCharts.filter(chart => chart.id !== chartId);
            console.log('更新后图表列表:', updatedCharts);
            // 同时更新总数
            setTotal(updatedCharts.length);
            return updatedCharts;
          });
          // 延迟一秒后重新加载，确保用户能看到实时更新
          setTimeout(() => {
            loadData();
          }, 1000);
        } else {
          console.log('删除失败原因:', res);
          message.error('删除失败: ' + (res.message || '未知错误'));
        }
      } else {
        console.log('删除接口返回格式错误:', res);
        message.error('删除失败: 接口返回格式错误');
      }
    } catch (e: any) {
      console.error('删除出错:', e);
      console.error('错误堆栈:', e.stack);
      // 检查是否是业务错误
      if (e.name === 'BizError' && e.info) {
        message.error('删除失败: ' + (e.info.errorMessage || '操作失败'));
      } else if (e.response && e.response.data) {
        // 处理Axios响应错误
        message.error('删除失败: ' + (e.response.data.message || '服务器错误'));
      } else {
        message.error('删除失败: ' + (e.message || '网络错误'));
      }
    }
  };

  // =========== 新增：genChart 解析函数 ===========
  /**
   * 解析 genChart 字符串为 ECharts 配置对象
   * 处理类似 "{\n  \"title\": {\n    \"text\": \"图表标题\"\n  }\n}" 这样的双层转义字符串
   */
  const parseGenChartToOption = (genChartStr: string | undefined): any => {
    if (!genChartStr) {
      return {}; // 返回空对象作为默认图表配置
    }

    try {
      console.log('原始 genChart 字符串:', genChartStr);

      // 第一步：去除首尾空白字符
      let chartConfig = genChartStr.trim();

      // 第二步：检查是否为双层转义的 JSON 字符串
      // 格式判断：以 { 开头，但内容中可能包含转义字符
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
          myFullScreen: {
            show: true,
            title: '全屏',
            icon: 'path://M10,0 L10,10 L0,10 L0,0 Z',
            onclick: (params: any) => {
              const chartId = params.chart._dom.id.split('-')[1];
              toggleFullscreen(parseInt(chartId));
            },
          },
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
  // =========== 新增代码结束 ===========

  // =========== 新增：genResult 清理函数 ===========
  /**
   * 清理 genResult 字符串，移除多余转义字符和JSON元数据
   */
  const cleanGenResult = (genResultStr: string | undefined): string => {
    if (!genResultStr) {
      return '';
    }

    let cleaned = genResultStr;

    // 移除转义字符
    cleaned = cleaned.replace(/\\n/g, '\n').trim();

    // 移除可能的 JSON 格式额外内容（如 role、finish_reason 等）
    const jsonEndIndex = cleaned.indexOf('"role":"assistant"');
    if (jsonEndIndex > -1) {
      cleaned = cleaned.substring(0, jsonEndIndex).trim();
    }

    return cleaned;
  };
  // =========== 新增代码结束 ===========

  useEffect(() => {
    loadData();
  }, [searchParams]);

  return (
    <div className="my-chart-page">
      <div style={{ marginBottom: 16, textAlign: 'center' }}>
        <h2>我的图表列表</h2>
        <p>共 {total} 个图表</p>
      </div>

      <div style={{ marginBottom: 24, maxWidth: 600, marginLeft: 'auto', marginRight: 'auto' }}>
        <Input.Search
          placeholder="输入图表名称进行搜索"
          allowClear
          enterButton="搜索"
          size="large"
          value={searchParams.name}
          onChange={(e) => setSearchParams({ ...searchParams, name: e.target.value, current: 1 })}
          onSearch={(value) => setSearchParams({ ...searchParams, name: value, current: 1 })}
          style={{ width: '100%' }}
        />
      </div>

      <List
        loading={loading} // 新增：添加加载状态
        itemLayout="vertical"
        size="large"
        pagination={{
          onChange: (page, pageSize) => {
            console.log('页码变化:', page, '每页大小:', pageSize);
            // =========== 新增：更新查询参数以触发重新加载 ===========
            setSearchParams({
              ...searchParams,
              current: page,
              pageSize: pageSize || searchParams.pageSize,
            });
          },
          pageSize: searchParams.pageSize, // 使用 searchParams 中的 pageSize
          total: total,
          current: searchParams.current || 1, // 当前页码
          showSizeChanger: true,
          showQuickJumper: true,
        }}
        dataSource={chartList}
        // =========== 修改：移除 footer，添加空状态提示 ===========
        locale={{ emptyText: '暂无图表数据' }}
        renderItem={(item) => {
          // 检查item结构
          console.log('图表项数据:', item);
          console.log('图表ID:', item.id);
          // =========== 新增：处理每个图表的 genChart 和 genResult ===========
          const chartOption = parseGenChartToOption(item.genChart);
          const cleanedGenResult = cleanGenResult(item.genResult);

          return (
            <List.Item
              key={item.id}
              extra={
                <div>
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
                        <ReactECharts
                          option={chartOption}
                          style={{ width: '100%', height: '100%' }}
                          opts={{ renderer: 'canvas' }}
                        />
                      </div>
                    </div>
                  ) : (
                    <div style={{ width: 500, height: 300, position: 'relative' }}>
                      <Button
                        type="link"
                        icon={<FullscreenOutlined />}
                        onClick={(e) => {
                          e.stopPropagation();
                          toggleFullscreen(item.id);
                        }}
                        size="small"
                        style={{ position: 'absolute', bottom: 8, right: 8, zIndex: 1 }}
                      />
                      <ReactECharts
                        id={`chart-${item.id}`}
                        option={chartOption}
                        style={{ width: '100%', height: '100%' }}
                        opts={{ renderer: 'canvas' }}
                      />
                    </div>
                  )}
                </div>
              }
            >
              <List.Item.Meta
                // avatar={<Avatar src={`https://api.dicebear.com/7.x/miniavs/svg?seed=${item.id || 0}`} />}
                avatar={<Avatar src={currentUser && currentUser.userAvatar} />}
                title={
                  <div style={{ fontSize: 18, fontWeight: 'bold', display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                    {item.name || '未命名图表'}
                    <Button
                      type="text"
                      danger
                      icon={<DeleteOutlined />}
                      onClick={() => handleDeleteChart(item.id)}
                      style={{ fontSize: 14 }}
                    >
                      删除
                    </Button>
                  </div>
                }
                description={
                  <div>
                    {item.chartType && <div>图表类型：{item.chartType}</div>}
                    {item.createTime && (
                      <div>创建时间：{new Date(item.createTime).toLocaleString()}</div>
                    )}
                  </div>
                }
              />

              <div style={{ marginTop: 16 }}>
                <div style={{ marginBottom: 8 }}>
                  <strong>分析目标：</strong>
                  <div style={{ marginLeft: 8, color: '#666' }}>
                    {item.goal || '未提供分析目标'}
                  </div>
                </div>

                <div>
                  <strong>分析结论：</strong>
                  <div
                    style={{
                      marginLeft: 8,
                      marginTop: 4,
                      color: '#333',
                      maxHeight: 150,
                      overflow: 'auto',
                      padding: 8,
                      backgroundColor: '#f9f9f9',
                      borderRadius: 4,
                    }}
                  >
                    {cleanedGenResult ? (
                      <ReactMarkdown>{cleanedGenResult}</ReactMarkdown>
                    ) : (
                      '暂无分析结论'
                    )}
                  </div>
                </div>
              </div>
            </List.Item>
          );
        }}
      />
    </div>
  );
};

export default MyChartPage;
