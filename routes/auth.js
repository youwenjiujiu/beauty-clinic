const router = require('express').Router();
const axios = require('axios');
const jwt = require('jsonwebtoken');
const User = require('../models/User');
const { cacheSessionKey, getSessionKey } = require('../utils/redis');
const { isAdmin } = require('../config/admin');

/**
 * Web管理员登录
 * POST /api/auth/admin-login
 */
router.post('/admin-login', async (req, res) => {
  const { password } = req.body;

  // 简单的密码验证
  if (password !== 'admin2025') {
    return res.status(401).json({
      success: false,
      message: '密码错误'
    });
  }

  try {
    // 在没有数据库的情况下，直接生成管理员信息
    const adminUser = {
      _id: 'admin_web_user_id',
      openId: 'admin_web_user',
      nickName: 'Web管理员',
      isAdmin: true,
      memberType: 'normal',
      status: 'active'
    };

    // 生成JWT token
    const token = jwt.sign(
      {
        userId: adminUser._id,
        openId: adminUser.openId,
        isAdmin: true
      },
      process.env.JWT_SECRET || 'default_jwt_secret_2025',
      { expiresIn: '7d' }
    );

    res.json({
      success: true,
      data: {
        token,
        userInfo: {
          openId: adminUser.openId,
          nickName: adminUser.nickName,
          isAdmin: adminUser.isAdmin
        }
      }
    });
  } catch (error) {
    console.error('管理员登录错误:', error);
    res.status(500).json({
      success: false,
      message: '登录失败'
    });
  }
});

/**
 * 微信登录
 * POST /api/auth/login
 */
router.post('/login', async (req, res) => {
  const { code, appType = 'beauty' } = req.body;

  if (!code) {
    return res.status(400).json({
      success: false,
      message: 'code参数缺失'
    });
  }

  try {
    // 调试：打印环境变量
    console.log('=== 环境变量调试 ===');
    console.log('WX_APP_ID:', process.env.WX_APP_ID ? '已设置' : '未设置');
    console.log('WX_APP_SECRET:', process.env.WX_APP_SECRET ? '已设置' : '未设置');
    console.log('AppID 值:', process.env.WX_APP_ID);
    console.log('Secret 前8位:', process.env.WX_APP_SECRET ? process.env.WX_APP_SECRET.substring(0, 8) + '...' : '未设置');
    console.log('===================');

    // 1. 调用微信API获取openid和session_key
    const appid = process.env.WX_APP_ID;
    const secret = process.env.WX_APP_SECRET;

    if (!appid || !secret) {
      console.error('错误: 缺少必要的环境变量');
      console.error('WX_APP_ID:', appid);
      console.error('WX_APP_SECRET:', secret ? '已设置' : '未设置');
      return res.status(500).json({
        success: false,
        message: '服务器配置错误：缺少微信配置'
      });
    }

    const wxResponse = await axios.get('https://api.weixin.qq.com/sns/jscode2session', {
      params: {
        appid: appid,
        secret: secret,
        js_code: code,
        grant_type: 'authorization_code'
      }
    });

    if (wxResponse.data.errcode) {
      console.error('微信API错误:', wxResponse.data);
      return res.status(400).json({
        success: false,
        message: '微信登录失败',
        error: wxResponse.data.errmsg
      });
    }

    const { openid, session_key, unionid } = wxResponse.data;

    // 2. 保存session_key到Redis（不返回给前端）
    await cacheSessionKey(openid, session_key);

    // 3. 查找或创建用户
    let user;

    // 临时方案：如果数据库不可用，使用模拟数据
    try {
      user = await User.findOne({ openId: openid });

      if (!user) {
        // 创建新用户
        user = new User({
          openId: openid,
          unionId: unionid,
          appType: appType,
          isAdmin: isAdmin(openid), // 检查是否是管理员
          memberType: 'normal',
          createTime: new Date(),
          lastLoginTime: new Date()
        });
        await user.save();
        console.log('创建新用户:', openid);
      } else {
        // 更新最后登录时间
        user.lastLoginTime = new Date();
        // 更新管理员状态（可能配置有变化）
        user.isAdmin = isAdmin(openid);
        await user.save();
        console.log('用户登录:', openid);
      }
    } catch (dbError) {
      console.log('数据库不可用，使用模拟数据');
      console.log('\n========================================');
      console.log('🎉 用户 OpenID:', openid);
      console.log('👤 是否管理员:', isAdmin(openid));
      console.log('========================================\n');

      // 模拟用户对象
      user = {
        _id: 'mock_' + openid,
        openId: openid,
        unionId: unionid,
        isAdmin: isAdmin(openid),
        memberType: 'normal',
        nickName: '',
        avatarUrl: '',
        phone: ''
      };
    }

    // 4. 生成JWT token
    const token = jwt.sign(
      {
        userId: user._id,
        openId: openid,
        isAdmin: user.isAdmin
      },
      process.env.JWT_SECRET,
      {
        expiresIn: process.env.JWT_EXPIRES_IN || '7d'
      }
    );

    // 5. 返回登录信息
    res.json({
      success: true,
      data: {
        token: token,
        userInfo: {
          userId: user._id,
          nickName: user.nickName || '',
          avatarUrl: user.avatarUrl || '',
          phone: user.phone || '',
          memberType: user.memberType
        },
        isAdmin: user.isAdmin
      }
    });

  } catch (error) {
    console.error('登录错误:', error);
    res.status(500).json({
      success: false,
      message: '服务器错误，请稍后再试'
    });
  }
});

/**
 * 验证Token
 * GET /api/auth/validate
 */
router.get('/validate', async (req, res) => {
  const authHeader = req.headers.authorization;

  if (!authHeader || !authHeader.startsWith('Bearer ')) {
    return res.status(401).json({
      success: false,
      message: 'Token缺失'
    });
  }

  const token = authHeader.substring(7);

  try {
    // 验证token
    const decoded = jwt.verify(token, process.env.JWT_SECRET);

    // 查询用户最新信息
    const user = await User.findById(decoded.userId);

    if (!user) {
      return res.status(401).json({
        success: false,
        message: '用户不存在'
      });
    }

    res.json({
      success: true,
      data: {
        userId: user._id,
        isAdmin: user.isAdmin,
        expiresAt: new Date(decoded.exp * 1000).toISOString()
      }
    });

  } catch (error) {
    if (error.name === 'TokenExpiredError') {
      return res.status(401).json({
        success: false,
        message: 'Token已过期'
      });
    }

    if (error.name === 'JsonWebTokenError') {
      return res.status(401).json({
        success: false,
        message: 'Token无效'
      });
    }

    res.status(500).json({
      success: false,
      message: '服务器错误'
    });
  }
});

/**
 * 刷新Token
 * POST /api/auth/refresh
 */
router.post('/refresh', async (req, res) => {
  const { refreshToken } = req.body;

  if (!refreshToken) {
    return res.status(400).json({
      success: false,
      message: 'refreshToken缺失'
    });
  }

  try {
    // 验证refresh token
    const decoded = jwt.verify(refreshToken, process.env.JWT_SECRET);

    // 查询用户
    const user = await User.findById(decoded.userId);

    if (!user) {
      return res.status(401).json({
        success: false,
        message: '用户不存在'
      });
    }

    // 生成新的access token
    const newToken = jwt.sign(
      {
        userId: user._id,
        openId: user.openId,
        isAdmin: user.isAdmin
      },
      process.env.JWT_SECRET,
      {
        expiresIn: process.env.JWT_EXPIRES_IN || '7d'
      }
    );

    res.json({
      success: true,
      data: {
        token: newToken
      }
    });

  } catch (error) {
    res.status(401).json({
      success: false,
      message: 'refreshToken无效或已过期'
    });
  }
});

/**
 * 退出登录
 * POST /api/auth/logout
 */
router.post('/logout', async (req, res) => {
  // 这里可以将token加入黑名单（如果实现了的话）
  res.json({
    success: true,
    message: '退出成功'
  });
});

module.exports = router;