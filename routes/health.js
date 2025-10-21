// 健康检查和状态监控
const router = require('express').Router();
const mongoose = require('mongoose');

// MongoDB连接状态映射
const readyStateMap = {
  0: 'disconnected',
  1: 'connected',
  2: 'connecting',
  3: 'disconnecting'
};

// 健康检查端点
router.get('/', async (req, res) => {
  try {
    const mongoState = mongoose.connection.readyState;
    const isConnected = mongoState === 1;

    // 尝试执行一个简单的数据库操作来验证连接
    let dbOperational = false;
    let dbResponseTime = null;

    if (isConnected) {
      const startTime = Date.now();
      try {
        // 使用admin命令ping数据库
        await mongoose.connection.db.admin().ping();
        dbOperational = true;
        dbResponseTime = Date.now() - startTime;
      } catch (error) {
        console.error('Database ping failed:', error.message);
      }
    }

    const status = {
      success: isConnected && dbOperational,
      timestamp: new Date().toISOString(),
      environment: process.env.NODE_ENV || 'development',
      mongodb: {
        status: readyStateMap[mongoState],
        connected: isConnected,
        operational: dbOperational,
        responseTime: dbResponseTime ? `${dbResponseTime}ms` : null,
        uri: process.env.MONGODB_URI ? 'Configured' : 'Not configured',
        host: mongoose.connection.host || 'Not connected',
        database: mongoose.connection.name || 'Not connected'
      },
      uptime: `${Math.floor(process.uptime())}s`,
      memory: {
        used: `${Math.round(process.memoryUsage().heapUsed / 1024 / 1024)}MB`,
        total: `${Math.round(process.memoryUsage().heapTotal / 1024 / 1024)}MB`
      }
    };

    // 如果数据库不正常，返回503状态码
    const statusCode = isConnected && dbOperational ? 200 : 503;

    res.status(statusCode).json(status);
  } catch (error) {
    res.status(500).json({
      success: false,
      error: error.message,
      timestamp: new Date().toISOString()
    });
  }
});

// 详细的MongoDB状态
router.get('/mongodb', async (req, res) => {
  try {
    const state = mongoose.connection.readyState;

    let collections = [];
    let dbStats = null;

    if (state === 1) {
      try {
        // 获取所有集合
        const cols = await mongoose.connection.db.listCollections().toArray();
        collections = cols.map(c => c.name);

        // 获取数据库统计信息
        dbStats = await mongoose.connection.db.stats();
      } catch (error) {
        console.error('Failed to get DB stats:', error);
      }
    }

    res.json({
      success: state === 1,
      connection: {
        state: readyStateMap[state],
        stateCode: state,
        host: mongoose.connection.host,
        port: mongoose.connection.port,
        database: mongoose.connection.name,
        uri: process.env.MONGODB_URI ? 'Configured (hidden for security)' : 'Not configured'
      },
      collections: collections,
      stats: dbStats ? {
        collections: dbStats.collections,
        documents: dbStats.objects,
        dataSize: `${Math.round(dbStats.dataSize / 1024 / 1024)}MB`,
        indexSize: `${Math.round(dbStats.indexSize / 1024 / 1024)}MB`
      } : null,
      error: state !== 1 ? 'Database not connected' : null
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      error: error.message
    });
  }
});

module.exports = router;