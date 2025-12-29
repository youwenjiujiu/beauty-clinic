const mongoose = require('mongoose');

// 缓存连接Promise（避免并发连接）
let connectionPromise = null;

/**
 * 连接MongoDB数据库（优化为Serverless环境）
 */
async function connectDB() {
  // 检查当前连接状态
  const readyState = mongoose.connection.readyState;

  // 0 = disconnected, 1 = connected, 2 = connecting, 3 = disconnecting
  if (readyState === 1) {
    return; // 已连接
  }

  if (readyState === 2) {
    // 正在连接中，等待连接完成
    if (connectionPromise) {
      await connectionPromise;
      return;
    }
  }

  // 在 Vercel 上，环境变量可能需要特殊处理
  const mongoUri = process.env.MONGODB_URI || process.env.mongodb_uri || 'mongodb://localhost:27017/dudu-appointment';

  console.log('MongoDB 连接配置:');
  console.log('- 使用的URI:', mongoUri.includes('mongodb+srv') ? 'MongoDB Atlas' : 'Local MongoDB');
  console.log('- 连接状态:', readyState);

  // Vercel Serverless优化选项
  const options = {
    serverSelectionTimeoutMS: 30000,
    socketTimeoutMS: 45000,
    maxPoolSize: 10,
    minPoolSize: 1,
    retryWrites: true,
    retryReads: true,
  };

  // 设置 strictQuery
  mongoose.set('strictQuery', false);

  try {
    // 保存连接Promise，避免并发调用
    connectionPromise = mongoose.connect(mongoUri, options);
    await connectionPromise;
    console.log('✅ MongoDB连接成功');
  } catch (error) {
    console.error('❌ MongoDB连接失败:', error.message);
    connectionPromise = null;
    throw error; // 抛出错误让调用者处理
  }
}

/**
 * 确保数据库已连接（用于API路由）
 */
async function ensureConnected() {
  const maxRetries = 3;
  let lastError;

  for (let i = 0; i < maxRetries; i++) {
    try {
      await connectDB();

      // 验证连接确实成功
      if (mongoose.connection.readyState === 1) {
        return true;
      }
    } catch (error) {
      lastError = error;
      console.log(`连接尝试 ${i + 1}/${maxRetries} 失败:`, error.message);
      // 短暂等待后重试
      await new Promise(resolve => setTimeout(resolve, 1000));
    }
  }

  throw lastError || new Error('数据库连接失败');
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
  disconnectDB,
  ensureConnected
};