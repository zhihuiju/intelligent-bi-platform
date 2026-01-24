import { GithubOutlined } from '@ant-design/icons';
import { DefaultFooter } from '@ant-design/pro-components';
import '@umijs/max';
import React from 'react';
const Footer: React.FC = () => {
  const defaultMessage = '计算222CNT出品';
  const currentYear = new Date().getFullYear();
  return (
    <DefaultFooter
      style={{
        background: 'none',
      }}
      copyright={`${currentYear} ${defaultMessage}`}
      links={[
        {
          key: '韬智能 BI',
          title: '韬智能 BI',
          href: 'https://github.com/zhihuiju/SpringAll',
          blankTarget: true,
        },
        {
          key: 'github',
          title: <GithubOutlined />,
          href: 'https://github.com/zhihuiju/SpringAll',
          blankTarget: true,
        },
        {
          key: '韬智能 BI',
          title: '韬智能 BI',
          href: 'https://github.com/zhihuiju/SpringAll',
          blankTarget: true,
        },
      ]}
    />
  );
};
export default Footer;
