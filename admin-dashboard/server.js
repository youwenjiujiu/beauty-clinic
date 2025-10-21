// 简单的静态文件服务器，用于运行管理后台
const express = require('express');
const path = require('path');
const { createProxyMiddleware } = require('http-proxy-middleware');

const app = express();
const PORT = 3001;

// 静态文件服务
app.use(express.static(__dirname));

// 代理API请求到后端
app.use('/api', createProxyMiddleware({
  target: 'https://beauty-clinic-backend.vercel.app',
  changeOrigin: true,
  logLevel: 'debug',
  onProxyReq: (proxyReq, req, res) => {
    console.log(`[代理] ${req.method} ${req.path} -> https://beauty-clinic-backend.vercel.app${req.path}`);
  },
  onProxyRes: (proxyRes, req, res) => {
    console.log(`[响应] ${proxyRes.statusCode} ${req.path}`);
  }
}));

// 默认路由
app.get('/', (req, res) => {
  res.sendFile(path.join(__dirname, 'index.html'));
});

app.listen(PORT, () => {
  console.log(`
╔════════════════════════════════════════════════╗
║                                                ║
║   🚀 管理后台服务器已启动！                    ║
║                                                ║
║   访问地址: http://localhost:${PORT}              ║
║                                                ║
║   页面列表:                                    ║
║   - 首页: http://localhost:${PORT}/              ║
║   - 顾问管理: http://localhost:${PORT}/consultants.html ║
║                                                ║
║   API已自动代理到:                             ║
║   https://beauty-clinic-backend.vercel.app    ║
║                                                ║
╚════════════════════════════════════════════════╝
  `);
});