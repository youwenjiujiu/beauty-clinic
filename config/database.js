const mongoose = require('mongoose');

/**
 * 连接MongoDB数据库
 */
async function connectDB() {
  try {
    // 在 Vercel 上，环境变量可能需要特殊处理
    const mongoUri = process.env.MONGODB_URI || process.env.mongodb_uri || 'mongodb://localhost:27017/dudu-appointment';

    console.log('MongoDB 连接配置:');
    console.log('- 使用的URI:', mongoUri.includes('mongodb+srv') ? 'MongoDB Atlas' : 'Local MongoDB');
    console.log('- 环境:', process.env.NODE_ENV);
    console.log('- MONGODB_URI 是否存在:', !!process.env.MONGODB_URI);
    console.log('- URI 前10个字符:', mongoUri.substring(0, 20) + '...');

    await mongoose.connect(mongoUri, {
      serverSelectionTimeoutMS: 5000,
    });

    console.log('✅ MongoDB连接成功');

    // 连接事件监听
    mongoose.connection.on('error', (err) => {
      console.error('MongoDB连接错误:', err);
    });

    mongoose.connection.on('disconnected', () => {
      console.warn('MongoDB连接断开');
    });

    mongoose.connection.on('reconnected', () => {
      console.log('MongoDB重新连接成功');
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