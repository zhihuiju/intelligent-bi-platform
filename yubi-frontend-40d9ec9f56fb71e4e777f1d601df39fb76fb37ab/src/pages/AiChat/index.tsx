import { Avatar, Button, Input, message, Space, Tag } from 'antd';
import { useEffect, useRef, useState } from 'react';
import ReactMarkdown from 'react-markdown';

import type { InputRef } from 'antd';
import { useModel } from 'umi';

const { TextArea } = Input;

/**
 * AI 对话页面
 */
const AiChat: React.FC = () => {
  const { initialState } = useModel('@@initialState');
  const { currentUser } = initialState || {};

  // 从本地存储初始化消息历史
  const [messages, setMessages] = useState<
    Array<{
      id: string;
      content: string;
      type: 'user' | 'ai';
      timestamp: string;
    }>
  >(() => {
    const storedMessages = localStorage.getItem(`ai_chat_messages_${currentUser?.id || 'guest'}`);
    return storedMessages ? JSON.parse(storedMessages) : [];
  });

  // 当消息变化时，保存到本地存储
  useEffect(() => {
    localStorage.setItem(
      `ai_chat_messages_${currentUser?.id || 'guest'}`,
      JSON.stringify(messages),
    );
  }, [messages, currentUser]);
  const [inputValue, setInputValue] = useState('');
  const [loading, setLoading] = useState(false);
  const inputRef = useRef<InputRef>(null);
  const messagesEndRef = useRef<HTMLDivElement>(null);

  // 滚动到底部
  const scrollToBottom = () => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  };

  useEffect(() => {
    scrollToBottom();
  }, [messages]);

  // 发送消息
  const handleSend = async () => {
    if (!inputValue.trim() || loading) return;

    const userMessage = inputValue.trim();
    setInputValue('');

    // 添加用户消息
    const newUserMessage = {
      id: Date.now().toString(),
      content: userMessage,
      type: 'user' as const,
      timestamp: new Date().toLocaleString('zh-CN', { hour: '2-digit', minute: '2-digit' }),
    };
    setMessages((prev) => [...prev, newUserMessage]);

    setLoading(true);
    try {
      // 调用 AI 对话接口
      const response = await fetch('/api/ai/chat', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          message: userMessage,
        }),
      });

      if (!response.ok) {
        throw new Error('对话失败');
      }

      const data = await response.json();
      if (data.code === 0) {
        // 添加 AI 响应
        const aiMessage = {
          id: (Date.now() + 1).toString(),
          content: data.data,
          type: 'ai' as const,
          timestamp: new Date().toLocaleString('zh-CN', { hour: '2-digit', minute: '2-digit' }),
        };
        setMessages((prev) => [...prev, aiMessage]);
      } else {
        message.error(data.message || '对话失败');
      }
    } catch (error) {
      console.error('对话失败:', error);
      message.error('对话失败，请稍后重试');
    } finally {
      setLoading(false);
    }
  };

  // 处理回车键
  const handleKeyPress = (e: React.KeyboardEvent) => {
    if (e.key === 'Enter' && !e.shiftKey) {
      e.preventDefault();
      handleSend();
    }
  };

  return (
    <div style={{ padding: 20, minHeight: '100vh', backgroundColor: '#f0f2f5' }}>
      <div style={{ maxWidth: 800, margin: '0 auto' }}>
        {/* 顶部欢迎语 */}
        <div style={{ display: 'flex', alignItems: 'center', marginBottom: 20 }}>
          <Avatar
            size={48}
            src="https://trae-api-cn.mchost.guru/api/ide/v1/text_to_image?prompt=professional%20woman%20avatar%20with%20glasses%20friendly%20smile%20blue%20background&image_size=square"
            style={{ marginRight: 12 }}
          />
          <div>
            <h2 style={{ margin: 0, fontSize: 18, color: '#1890ff' }}>
              晚上好，{currentUser?.userName || '用户'}，匀点工作给我吧~
            </h2>
          </div>
        </div>

        {/* 功能标签 */}
        <div style={{ marginBottom: 20 }}>
          <Space size="small">
            <Tag color="blue" style={{ borderRadius: 16, padding: '4px 16px', fontSize: 14 }}>
              小Q问数
            </Tag>
            <Tag color="purple" style={{ borderRadius: 16, padding: '4px 16px', fontSize: 14 }}>
              小Q报告
            </Tag>
            <Tag color="green" style={{ borderRadius: 16, padding: '4px 16px', fontSize: 14 }}>
              小Q搭建
            </Tag>
            <Tag color="orange" style={{ borderRadius: 16, padding: '4px 16px', fontSize: 14 }}>
              小Q搜索
            </Tag>
          </Space>
        </div>

        {/* 聊天历史 */}
        <div style={{ marginBottom: 20 }}>
          {messages.map((msg) => (
            <div key={msg.id} style={{ marginBottom: 24 }}>
              {/* 时间戳 */}
              {msg.type === 'ai' && (
                <div style={{ fontSize: 12, color: '#999', marginBottom: 8 }}>
                  {new Date().toLocaleDateString('zh-CN')} {msg.timestamp}
                </div>
              )}

              {/* 消息内容 */}
              <div
                style={{
                  backgroundColor: msg.type === 'user' ? '#e6f7ff' : 'white',
                  borderRadius: 8,
                  padding: 16,
                  boxShadow: msg.type === 'ai' ? '0 2px 8px rgba(0, 0, 0, 0.08)' : 'none',
                  position: 'relative',
                }}
              >
                {/* 用户消息 */}
                {msg.type === 'user' && (
                  <div style={{ textAlign: 'right', color: '#333', lineHeight: 1.6 }}>
                    {msg.content}
                  </div>
                )}

                {/* AI 消息 */}
                {msg.type === 'ai' && (
                  <div style={{ color: '#333', lineHeight: 1.6 }}>
                    <ReactMarkdown>{msg.content}</ReactMarkdown>

                    {/* AI 生成标记 */}
                    <div style={{ display: 'flex', justifyContent: 'flex-end', marginTop: 12 }}>
                      <Tag size="small" style={{ backgroundColor: '#f0f0f0', color: '#999' }}>
                        AI生成
                      </Tag>
                    </div>

                    {/* 交互按钮 */}
                    <div
                      style={{
                        display: 'flex',
                        alignItems: 'center',
                        marginTop: 12,
                        paddingTop: 12,
                        borderTop: '1px solid #f0f0f0',
                      }}
                    >
                      <Button
                        type="text"
                        style={{ color: '#999', fontSize: 12 }}
                        onClick={() => {
                          navigator.clipboard
                            .writeText(msg.content)
                            .then(() => {
                              message.success('复制成功');
                            })
                            .catch((err) => {
                              message.error('复制失败');
                              console.error('复制失败:', err);
                            });
                        }}
                      >
                        📋 复制
                      </Button>
                    </div>
                  </div>
                )}
              </div>
            </div>
          ))}
          <div ref={messagesEndRef} />
        </div>

        {/* 输入区域 */}
        <div style={{ backgroundColor: 'white', borderRadius: 8, border: '1px solid #e8e8e8' }}>
          <TextArea
            ref={inputRef}
            value={inputValue}
            onChange={(e) => setInputValue(e.target.value)}
            onKeyPress={handleKeyPress}
            placeholder="向小Q提问，输入「/」唤起快捷提示词"
            rows={3}
            style={{
              borderRadius: 8,
              resize: 'none',
              border: 'none',
              padding: 16,
              fontSize: 14,
            }}
          />

          {/* 快捷按钮和发送按钮 */}
          <div
            style={{
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'space-between',
              padding: '0 16px 16px',
            }}
          >
            <Space size="small">
              <Button type="text" style={{ color: '#1890ff' }}>
                ✧
              </Button>
              <Button type="text" style={{ color: '#999' }}>
                📎
              </Button>
              <Button type="text" style={{ color: '#999' }}>
                🌐
              </Button>
              <Button type="text" style={{ color: '#999' }}>
                ⏰
              </Button>
              <Button type="text" style={{ color: '#999' }}>
                •••
              </Button>
            </Space>

            <Button
              type="primary"
              onClick={handleSend}
              loading={loading}
              style={{
                borderRadius: 20,
                padding: '6px 24px',
                backgroundColor: '#1890ff',
                borderColor: '#1890ff',
              }}
            >
              发送 📤
            </Button>
          </div>
        </div>

        {/* 快捷提问 */}
        <div style={{ marginTop: 20 }}>
          <h3 style={{ marginBottom: 12, fontSize: 16, color: '#333' }}>快捷提问</h3>
          <Space wrap>
            <div
              style={{
                backgroundColor: 'white',
                borderRadius: 8,
                padding: 12,
                width: 380,
                boxShadow: '0 2px 8px rgba(0, 0, 0, 0.08)',
                cursor: 'pointer',
                transition: 'box-shadow 0.3s',
              }}
              onMouseEnter={(e) => {
                e.currentTarget.style.boxShadow = '0 4px 12px rgba(0, 0, 0, 0.12)';
              }}
              onMouseLeave={(e) => {
                e.currentTarget.style.boxShadow = '0 2px 8px rgba(0, 0, 0, 0.08)';
              }}
              onClick={() => {
                setInputValue(
                  '帮我分析近两年山东、广东的销售金额月趋势，并进一步计算山东销售额占比',
                );
                inputRef.current?.focus();
              }}
            >
              <div style={{ color: '#1890ff', fontSize: 14, marginBottom: 4 }}>
                ✧ 查多维销售数据
              </div>
              <div style={{ color: '#666', fontSize: 12, lineHeight: 1.4 }}>
                帮我分析近两年山东、广东的销售金额月趋势，并进一步计算山东销售额占比...
              </div>
            </div>

            <div
              style={{
                backgroundColor: 'white',
                borderRadius: 8,
                padding: 12,
                width: 380,
                boxShadow: '0 2px 8px rgba(0, 0, 0, 0.08)',
                cursor: 'pointer',
                transition: 'box-shadow 0.3s',
              }}
              onMouseEnter={(e) => {
                e.currentTarget.style.boxShadow = '0 4px 12px rgba(0, 0, 0, 0.12)';
              }}
              onMouseLeave={(e) => {
                e.currentTarget.style.boxShadow = '0 2px 8px rgba(0, 0, 0, 0.08)';
              }}
              onClick={() => {
                setInputValue(
                  '作为活动运营负责人，请围绕公司上季度各项促销数据，从用户行为角度分析活动效果',
                );
                inputRef.current?.focus();
              }}
            >
              <div style={{ color: '#1890ff', fontSize: 14, marginBottom: 4 }}>
                ✧ 写大促分析报告
              </div>
              <div style={{ color: '#666', fontSize: 12, lineHeight: 1.4 }}>
                作为活动运营负责人，请围绕公司上季度各项促销数据，从用户行为角度分析活动效果...
              </div>
            </div>
          </Space>
        </div>
      </div>
    </div>
  );
};

export default AiChat;
