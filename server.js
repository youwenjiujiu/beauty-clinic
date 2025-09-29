const express = require('express');
const cors = require('cors');
const helmet = require('helmet');
const morgan = require('morgan');
const rateLimit = require('express-rate-limit');
require('dotenv').config();

// 调试：打印所有环境变量
console.log('=== 环境变量检查 ===');
console.log('NODE_ENV:', process.env.NODE_ENV);
console.log('MONGODB_URI exists:', !!process.env.MONGODB_URI);
console.log('WX_APP_ID exists:', !!process.env.WX_APP_ID);
console.log('WX_APP_SECRET exists:', !!process.env.WX_APP_SECRET);
console.log('JWT_SECRET exists:', !!process.env.JWT_SECRET);
console.log('VERCEL:', process.env.VERCEL);
console.log('==================');

const authRoutes = require('./routes/auth');
const userRoutes = require('./routes/users');
const clinicRoutes = require('./routes/clinics');
const appointmentRoutes = require('./routes/appointments-simple'); // 使用简化版本（无数据库）
const adminRoutes = require('./routes/admin');
const { connectDB } = require('./config/database');
const { errorHandler } = require('./middleware/errorHandler');

const app = express();
const PORT = process.env.PORT || 3000;

// Vercel 部署需要信任代理
app.set('trust proxy', true);

// 安全中间件 - 配置CSP允许CDN资源
app.use(helmet({
  contentSecurityPolicy: {
    directives: {
      defaultSrc: ["'self'"],
      scriptSrc: [
        "'self'",
        "'unsafe-inline'",
        "'unsafe-eval'",
        "https://cdn.jsdelivr.net",
        "https://unpkg.com"
      ],
      styleSrc: [
        "'self'",
        "'unsafe-inline'",
        "https://cdn.jsdelivr.net",
        "https://unpkg.com"
      ],
      fontSrc: ["'self'", "data:", "https:"],
      imgSrc: ["'self'", "data:", "https:"],
      connectSrc: ["'self'", "https:"]
    }
  }
}));

// CORS配置
app.use(cors({
  origin: process.env.ALLOWED_ORIGINS?.split(',') || ['*'],
  credentials: true
}));

// 请求日志
app.use(morgan('combined'));

// 请求体解析
app.use(express.json());
app.use(express.urlencoded({ extended: true }));

// 静态文件服务（管理后台）
app.use('/admin', express.static('admin-dashboard'));

// 限流配置（Vercel 上禁用，因为 IP 不可靠）
if (!process.env.VERCEL) {
  const limiter = rateLimit({
    windowMs: 15 * 60 * 1000, // 15分钟
    max: 100, // 限制100个请求
    message: '请求过于频繁，请稍后再试'
  });
  app.use('/api/', limiter);
}

// API路由
app.use('/api/auth', authRoutes);
app.use('/api/users', userRoutes);
app.use('/api/clinics', require('./routes/clinics-simple'));
app.use('/api/appointments', appointmentRoutes);
app.use('/api/reviews', require('./routes/reviews'));
app.use('/api/config', require('./routes/publicConfig-simple'));
app.use('/api/admin', adminRoutes);
app.use('/api/admin/config', require('./routes/admin/config'));

// 健康检查
app.get('/health', (req, res) => {
  res.json({
    status: 'ok',
    timestamp: new Date().toISOString(),
    environment: process.env.NODE_ENV
  });
});

// 环境变量检查（仅用于调试）
app.get('/debug/env', (req, res) => {
  res.json({
    NODE_ENV: process.env.NODE_ENV,
    MONGODB_URI_exists: !!process.env.MONGODB_URI,
    WX_APP_ID_exists: !!process.env.WX_APP_ID,
    WX_APP_SECRET_exists: !!process.env.WX_APP_SECRET,
    JWT_SECRET_exists: !!process.env.JWT_SECRET,
    VERCEL: process.env.VERCEL,
    // 不要暴露实际的值，只显示是否存在
    env_keys: Object.keys(process.env).filter(key =>
      key.includes('MONGO') || key.includes('WX') || key.includes('JWT')
    )
  });
});

// 详细调试环境变量（临时）
app.get('/debug/wx', (req, res) => {
  const appId = process.env.WX_APP_ID || '';
  const secret = process.env.WX_APP_SECRET || '';

  res.json({
    appId_length: appId.length,
    appId_first8: appId.substring(0, 8),
    appId_last4: appId.substring(appId.length - 4),
    secret_length: secret.length,
    secret_first8: secret.substring(0, 8),
    secret_last4: secret.substring(secret.length - 4),
    has_newline_appid: appId.includes('\n'),
    has_space_appid: appId.includes(' '),
    has_newline_secret: secret.includes('\n'),
    has_space_secret: secret.includes(' ')
  });
});

// 错误处理中间件
app.use(errorHandler);

// 404处理
app.use((req, res) => {
  res.status(404).json({
    success: false,
    message: 'API端点不存在'
  });
});

// 启动服务器
async function startServer() {
  try {
    // 连接数据库
    await connectDB();

    // Vercel 部署时不需要 listen
    if (process.env.VERCEL) {
      console.log('🚀 Running on Vercel');
    } else {
      app.listen(PORT, () => {
        console.log(`🚀 服务器运行在端口 ${PORT}`);
        console.log(`📝 环境: ${process.env.NODE_ENV}`);
        console.log(`🔗 健康检查: http://localhost:${PORT}/health`);
      });
    }
  } catch (error) {
    console.error('❌ 启动服务器失败:', error);
    if (!process.env.VERCEL) {
      process.exit(1);
    }
  }
}

startServer();

// 导出给 Vercel
module.exports = app;