const redis = require('redis');

let client = null;

/**
 * 初始化Redis客户端
 */
async function initRedis() {
  if (!process.env.REDIS_HOST) {
    console.log('⚠️  Redis未配置，使用内存缓存');
    return null;
  }

  try {
    client = redis.createClient({
      socket: {
        host: process.env.REDIS_HOST || 'localhost',
        port: process.env.REDIS_PORT || 6379
      },
      password: process.env.REDIS_PASSWORD || undefined
    });

    client.on('error', (err) => {
      console.error('Redis错误:', err);
    });

    await client.connect();
    console.log('✅ Redis连接成功');

    return client;
  } catch (error) {
    console.error('❌ Redis连接失败:', error);
    return null;
  }
}

// 内存缓存（当Redis不可用时使用）
const memoryCache = new Map();

/**
 * 缓存session_key
 * @param {string} openId
 * @param {string} sessionKey
 * @param {number} ttl - 过期时间（秒），默认2小时
 */
async function cacheSessionKey(openId, sessionKey, ttl = 7200) {
  const key = `session:${openId}`;

  if (client && client.isOpen) {
    try {
      await client.setEx(key, ttl, sessionKey);
      console.log(`Session缓存到Redis: ${openId}`);
    } catch (error) {
      console.error('Redis缓存失败:', error);
      // 降级到内存缓存
      memoryCache.set(key, {
        value: sessionKey,
        expires: Date.now() + ttl * 1000
      });
    }
  } else {
    // 使用内存缓存
    memoryCache.set(key, {
      value: sessionKey,
      expires: Date.now() + ttl * 1000
    });
    console.log(`Session缓存到内存: ${openId}`);
  }
}

/**
 * 获取session_key
 * @param {string} openId
 * @returns {Promise<string|null>}
 */
async function getSessionKey(openId) {
  const key = `session:${openId}`;

  if (client && client.isOpen) {
    try {
      const value = await client.get(key);
      return value;
    } catch (error) {
      console.error('Redis读取失败:', error);
      // 降级到内存缓存
      const cached = memoryCache.get(key);
      if (cached && cached.expires > Date.now()) {
        return cached.value;
      }
    }
  } else {
    // 从内存缓存读取
    const cached = memoryCache.get(key);
    if (cached && cached.expires > Date.now()) {
      return cached.value;
    }
  }

  return null;
}

/**
 * 删除session_key
 * @param {string} openId
 */
async function deleteSessionKey(openId) {
  const key = `session:${openId}`;

  if (client && client.isOpen) {
    try {
      await client.del(key);
    } catch (error) {
      console.error('Redis删除失败:', error);
    }
  }

  memoryCache.delete(key);
}

/**
 * 清理过期的内存缓存
 */
function cleanupMemoryCache() {
  const now = Date.now();
  for (const [key, value] of memoryCache.entries()) {
    if (value.expires < now) {
      memoryCache.delete(key);
    }
  }
}

// 定期清理内存缓存（每10分钟）
setInterval(cleanupMemoryCache, 10 * 60 * 1000);

// 初始化Redis（如果配置了的话）
initRedis().catch(console.error);

module.exports = {
  cacheSessionKey,
  getSessionKey,
  deleteSessionKey,
  initRedis
};