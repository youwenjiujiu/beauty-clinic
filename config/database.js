const mongoose = require('mongoose');

// 缓存连接状态
let isConnected = false;

/**
 * 连接MongoDB数据库（优化为Serverless环境）
 */
async function connectDB() {
  try {
    // 如果已经连接，直接返回
    if (isConnected && mongoose.connection.readyState === 1) {
      console.log('♻️ 使用现有MongoDB连接');
      return;
    }

    // 在 Vercel 上，环境变量可能需要特殊处理
    const mongoUri = process.env.MONGODB_URI || process.env.mongodb_uri || 'mongodb://localhost:27017/dudu-appointment';

    console.log('MongoDB 连接配置:');
    console.log('- 使用的URI:', mongoUri.includes('mongodb+srv') ? 'MongoDB Atlas' : 'Local MongoDB');
    console.log('- 环境:', process.env.NODE_ENV);
    console.log('- MONGODB_URI 是否存在:', !!process.env.MONGODB_URI);
    console.log('- URI 前20个字符:', mongoUri.substring(0, 20) + '...');
    console.log('- 连接状态:', mongoose.connection.readyState);

    // Vercel Serverless优化选项
    const options = {
      serverSelectionTimeoutMS: 10000, // 增加超时时间
      maxPoolSize: 1, // Serverless环境使用较小的连接池
    };

    await mongoose.connect(mongoUri, options);

    console.log('✅ MongoDB连接成功');
    isConnected = true;

    // 连接事件监听
    mongoose.connection.on('error', (err) => {
      console.error('MongoDB连接错误:', err);
      isConnected = false;
    });

    mongoose.connection.on('disconnected', () => {
      console.warn('MongoDB连接断开');
      isConnected = false;
    });

    mongoose.connection.on('reconnected', () => {
      console.log('MongoDB重新连接成功');
      isConnected = true;
    });

  } catch (error) {
    console.error('❌ MongoDB连接失败:', error.message);
    // 临时跳过 MongoDB 错误，让登录功能可以工作
    console.log('⚠️  继续运行无数据库模式');
    // if (process.env.NODE_ENV === 'production') {
    //   process.exit(1);
    // }
  }
}

/**
 * 断开数据库连接
 */
async function disconnectDB() {
  try {
    await mongoose.connection.close();
    console.log('MongoDB连接已关闭');
  } catch (error) {
    console.error('关闭MongoDB连接失败:', error);
  }
}

module.exports = {
  connectDB,
  disconnectDB
};