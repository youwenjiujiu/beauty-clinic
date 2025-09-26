const router = require('express').Router();
const User = require('../models/User');
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

module.exports = router;