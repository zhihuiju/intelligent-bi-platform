import { userRegisterUsingPOST } from '@/services/yubi/userController';
import { Button, Checkbox, Form, Input, message, Typography } from 'antd';
import { Link, useNavigate, useRequest } from 'umi';

const { Title } = Typography;
const { Password } = Input;

export default () => {
  const navigate = useNavigate();
  const [form] = Form.useForm();

  const { run: handleRegister } = useRequest(userRegisterUsingPOST, {
    manual: true,
    onSuccess: () => {
      message.success('注册成功！');
      navigate('/user/login');
    },
    onError: (error) => {
      message.error('注册失败：' + (error.message || '请检查输入信息'));
    },
  });

  const onFinish = (values: any) => {
    handleRegister({
      userAccount: values.userAccount,
      userName: values.userName,
      userPassword: values.userPassword,
      checkPassword: values.checkPassword,
    });
  };

  return (
    <div
      style={{
        display: 'flex',
        flexDirection: 'column',
        alignItems: 'center',
        justifyContent: 'center',
        minHeight: '100vh',
        background: '#f0f2f5',
      }}
    >
      <div
        style={{
          width: 400,
          padding: 24,
          background: 'white',
          borderRadius: 8,
          boxShadow: '0 2px 8px rgba(0, 0, 0, 0.1)',
        }}
      >
        <Title level={3} style={{ textAlign: 'center', marginBottom: 24 }}>
          注册账号
        </Title>
        <Form form={form} layout="vertical" onFinish={onFinish}>
          <Form.Item
            name="userAccount"
            label="账号"
            rules={[
              { required: true, message: '请输入账号' },
              { min: 4, message: '账号长度至少为4位' },
              { max: 20, message: '账号长度不能超过20位' },
            ]}
          >
            <Input placeholder="请输入账号" />
          </Form.Item>

          <Form.Item
            name="userName"
            label="用户名"
            rules={[
              { required: true, message: '请输入用户名' },
              { min: 2, message: '用户名长度至少为2位' },
              { max: 20, message: '用户名长度不能超过20位' },
            ]}
          >
            <Input placeholder="请输入用户名" />
          </Form.Item>

          <Form.Item
            name="userPassword"
            label="密码"
            rules={[
              { required: true, message: '请输入密码' },
              { min: 6, message: '密码长度至少为6位' },
            ]}
          >
            <Password placeholder="请输入密码" />
          </Form.Item>

          <Form.Item
            name="checkPassword"
            label="确认密码"
            dependencies={['userPassword']}
            rules={[
              { required: true, message: '请确认密码' },
              (_, value) => {
                if (!value || value === form.getFieldValue('userPassword')) {
                  return Promise.resolve();
                }
                return Promise.reject(new Error('两次输入的密码不一致'));
              },
            ]}
          >
            <Password placeholder="请再次输入密码" />
          </Form.Item>

          <Form.Item
            name="agreement"
            valuePropName="checked"
            rules={[
              {
                validator: (_, value) =>
                  value ? Promise.resolve() : Promise.reject(new Error('请阅读并同意用户协议')),
              },
            ]}
          >
            <Checkbox>
              我已阅读并同意 <a href="#">用户协议</a> 和 <a href="#">隐私政策</a>
            </Checkbox>
          </Form.Item>

          <Form.Item>
            <Button type="primary" htmlType="submit" style={{ width: '100%' }}>
              注册
            </Button>
          </Form.Item>

          <div style={{ textAlign: 'center', marginTop: 16 }}>
            已有账号？ <Link to="/user/login">去登录</Link>
          </div>
        </Form>
      </div>
    </div>
  );
};
