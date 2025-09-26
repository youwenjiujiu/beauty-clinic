const jwt = require('jsonwebtoken');
const User = require('../models/User');

/**
 * 验证JWT Token中间件
 */
async function verifyToken(req, res, next) {
  const authHeader = req.headers.authorization;

  if (!authHeader || !authHeader.startsWith('Bearer ')) {
    return res.status(401).json({
      success: false,
      message: '请先登录'
    });
  }

  const token = authHeader.substring(7);

  try {
    // 验证token
    const decoded = jwt.verify(token, process.env.JWT_SECRET);

    // 查询用户信息
    const user = await User.findById(decoded.userId);

    if (!user) {
      return res.status(401).json({
        success: false,
        message: '用户不存在'
      });
    }

    if (user.status === 'banned') {
      return res.status(403).json({
        success: false,
        message: '账号已被禁用'
      });
    }

    // 将用户信息添加到请求对象
    req.user = {
      id: user._id,
      openId: user.openId,
      isAdmin: user.isAdmin,
      memberType: user.memberType
    };

    next();
  } catch (error) {
    if (error.name === 'TokenExpiredError') {
      return res.status(401).json({
        success: false,
        message: 'Token已过期，请重新登录'
      });
    }

    if (error.name === 'JsonWebTokenError') {
      return res.status(401).json({
        success: false,
        message: 'Token无效'
      });
    }

    return res.status(500).json({
      success: false,
      message: '认证失败'
    });
  }
}

/**
 * 验证管理员权限中间件
 */
async function requireAdmin(req, res, next) {
  // 先验证token
  await verifyToken(req, res, async () => {
    if (!req.user.isAdmin) {
      return res.status(403).json({
        success: false,
        message: '需要管理员权限'
      });
    }
    next();
  });
}

/**
 * 可选的token验证（有token就验证，没有也放行）
 */
async function optionalAuth(req, res, next) {
  const authHeader = req.headers.authorization;

  if (!authHeader || !authHeader.startsWith('Bearer ')) {
    // 没有token，继续执行
    req.user = null;
    return next();
  }

  const token = authHeader.substring(7);

  try {
    const decoded = jwt.verify(token, process.env.JWT_SECRET);
    const user = await User.findById(decoded.userId);

    if (user && user.status !== 'banned') {
      req.user = {
        id: user._id,
        openId: user.openId,
        isAdmin: user.isAdmin,
        memberType: user.memberType
      };
    }
  } catch (error) {
    // Token无效，但不阻止请求
    req.user = null;
  }

  next();
}

module.exports = {
  verifyToken,
  requireAdmin,
  optionalAuth
};