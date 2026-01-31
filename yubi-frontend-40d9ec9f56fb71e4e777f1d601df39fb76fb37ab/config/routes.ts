export default [
  {
    path: '/user',
    layout: false,
    routes: [
      { path: '/user/login', component: './User/Login' },
      { path: '/user/register', component: './User/Register' },
    ],
  },
  { path: '/', redirect: '/add_chart' },
  { path: '/add_chart', name: '智能分析', icon: 'barChart', component: './AddChart' },
  {
    path: '/add_chart_async',
    name: '智能分析(异步)',
    icon: 'barChart',
    component: './AddChartAsync',
  },
  {
    path: '/add_chart_async_mq',
    name: '智能分析(异步消息队列)',
    icon: 'barChart',
    component: './AddChartAsyncMq',
  },
  { path: '/my_chart', name: '我的图表', icon: 'pieChart', component: './MyChart' },
  {
    path: '/my_chart_async',
    name: '我的图表(异步)',
    icon: 'pieChart',
    component: './MyChartAsync',
  },
  { path: '/dashboard', name: '仪表盘', icon: 'dashboard', component: './Dashboard' },
  { path: '/ai_chat', name: '智能对话', icon: 'message', component: './AiChat' },
  {
    path: '/admin',
    icon: 'crown',
    access: 'canAdmin',
    routes: [
      { path: '/admin', name: '管理页面', redirect: '/admin/sub-page' },
      { path: '/admin/sub-page', name: '管理页面2', component: './Admin' },
    ],
  },
  { path: '/', redirect: '/welcome' },
  { path: '*', layout: false, component: './404' },
];
