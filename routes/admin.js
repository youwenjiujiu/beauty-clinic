const router = require('express').Router();
const User = require('../models/User');
const Config = require('../models/Config');
const { requireAdmin } = require('../middleware/auth');
const { getAllAdminIds, addAdmin, removeAdmin } = require('../config/admin');

/**
 * 获取所有管理员
 * GET /api/admin/list
 */
router.get('/list', requireAdmin, async (req, res) => {
  try {
    const admins = await User.find({ isAdmin: true })
      .select('openId nickName avatarUrl createTime lastLoginTime');

    res.json({
      success: true,
      data: admins
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      message: '获取管理员列表失败'
    });
  }
});

/**
 * 添加管理员
 * POST /api/admin/add
 */
router.post('/add', requireAdmin, async (req, res) => {
  const { openId } = req.body;

  if (!openId) {
    return res.status(400).json({
      success: false,
      message: 'openId参数缺失'
    });
  }

  try {
    // 查找用户
    const user = await User.findOne({ openId });

    if (!user) {
      return res.status(404).json({
        success: false,
        message: '用户不存在'
      });
    }

    if (user.isAdmin) {
      return res.status(400).json({
        success: false,
        message: '该用户已经是管理员'
      });
    }

    // 更新用户为管理员
    user.isAdmin = true;
    await user.save();

    // 添加到运行时管理员列表
    addAdmin(openId);

    res.json({
      success: true,
      message: '管理员添加成功',
      data: user
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      message: '添加管理员失败'
    });
  }
});

/**
 * 移除管理员
 * DELETE /api/admin/remove
 */
router.delete('/remove', requireAdmin, async (req, res) => {
  const { openId } = req.body;

  if (!openId) {
    return res.status(400).json({
      success: false,
      message: 'openId参数缺失'
    });
  }

  // 不能移除自己的管理员权限
  if (openId === req.user.openId) {
    return res.status(400).json({
      success: false,
      message: '不能移除自己的管理员权限'
    });
  }

  try {
    const user = await User.findOne({ openId });

    if (!user) {
      return res.status(404).json({
        success: false,
        message: '用户不存在'
      });
    }

    if (!user.isAdmin) {
      return res.status(400).json({
        success: false,
        message: '该用户不是管理员'
      });
    }

    // 移除管理员权限
    user.isAdmin = false;
    await user.save();

    // 从运行时管理员列表移除
    removeAdmin(openId);

    res.json({
      success: true,
      message: '管理员权限已移除'
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      message: '移除管理员失败'
    });
  }
});

/**
 * 获取系统统计
 * GET /api/admin/stats
 */
router.get('/stats', requireAdmin, async (req, res) => {
  try {
    const totalUsers = await User.countDocuments();
    const totalAdmins = await User.countDocuments({ isAdmin: true });
    const todayNewUsers = await User.countDocuments({
      createTime: {
        $gte: new Date(new Date().setHours(0, 0, 0, 0))
      }
    });

    const stats = {
      totalUsers,
      totalAdmins,
      todayNewUsers,
      activeUsers: await User.countDocuments({ status: 'active' }),
      vipUsers: await User.countDocuments({ memberType: { $in: ['vip', 'svip'] } })
    };

    res.json({
      success: true,
      data: stats
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      message: '获取统计信息失败'
    });
  }
});

/**
 * 切换应用运行模式（管理员接口）
 * POST /api/admin/switch-mode
 *
 * Body: { mode: 'review' | 'production' }
 */
router.post('/switch-mode', requireAdmin, async (req, res) => {
  const { mode } = req.body;

  // 验证模式值
  if (!mode || !['review', 'production'].includes(mode)) {
    return res.status(400).json({
      success: false,
      message: '无效的模式值，必须是 review 或 production'
    });
  }

  try {
    // 查找或创建模式配置
    let modeConfig = await Config.findOne({
      type: 'app_mode'
    });

    if (!modeConfig) {
      // 创建新配置
      modeConfig = new Config({
        type: 'app_mode',
        name: '应用运行模式',
        description: '控制小程序显示杭州数据(review)还是韩国医美数据(production)',
        content: { mode: mode },
        isActive: true
      });
    } else {
      // 更新现有配置
      modeConfig.content = { mode: mode };
      modeConfig.isActive = true;
      modeConfig.updatedAt = new Date();
    }

    await modeConfig.save();

    console.log(`[模式切换] 管理员 ${req.user?.openId} 切换模式: ${mode}`);

    res.json({
      success: true,
      message: `已切换到${mode === 'review' ? '审核' : '生产'}模式`,
      mode: mode,
      note: mode === 'review'
        ? '小程序将显示杭州本地服务数据'
        : '小程序将显示韩国医美数据（最多10分钟生效）'
    });
  } catch (error) {
    console.error('切换模式失败:', error);
    res.status(500).json({
      success: false,
      message: '切换模式失败: ' + error.message
    });
  }
});

/**
 * 获取当前模式配置（管理员接口）
 * GET /api/admin/current-mode
 */
router.get('/current-mode', requireAdmin, async (req, res) => {
  try {
    const modeConfig = await Config.findOne({
      type: 'app_mode',
      isActive: true
    });

    const mode = modeConfig?.content?.mode || process.env.APP_MODE || 'review';

    res.json({
      success: true,
      mode: mode,
      source: modeConfig ? 'database' : 'environment',
      updatedAt: modeConfig?.updatedAt
    });
  } catch (error) {
    console.error('获取当前模式失败:', error);
    res.status(500).json({
      success: false,
      message: '获取当前模式失败'
    });
  }
});

module.exports = router;