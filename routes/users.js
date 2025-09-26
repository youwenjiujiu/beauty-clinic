const router = require('express').Router();
const User = require('../models/User');
const { verifyToken } = require('../middleware/auth');

/**
 * 获取当前用户信息
 * GET /api/users/me
 */
router.get('/me', verifyToken, async (req, res) => {
  try {
    const user = await User.findById(req.user.id);

    if (!user) {
      return res.status(404).json({
        success: false,
        message: '用户不存在'
      });
    }

    res.json({
      success: true,
      data: user
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      message: '获取用户信息失败'
    });
  }
});

/**
 * 更新用户信息
 * PUT /api/users/me
 */
router.put('/me', verifyToken, async (req, res) => {
  const allowedFields = ['nickName', 'avatarUrl', 'phone', 'realName', 'gender'];
  const updateData = {};

  // 只允许更新特定字段
  allowedFields.forEach(field => {
    if (req.body[field] !== undefined) {
      updateData[field] = req.body[field];
    }
  });

  try {
    const user = await User.findByIdAndUpdate(
      req.user.id,
      updateData,
      { new: true, runValidators: true }
    );

    res.json({
      success: true,
      data: user
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      message: '更新用户信息失败'
    });
  }
});

/**
 * 获取用户统计信息
 * GET /api/users/stats
 */
router.get('/stats', verifyToken, async (req, res) => {
  try {
    const user = await User.findById(req.user.id);

    const stats = {
      appointmentCount: user.appointmentCount || 0,
      consultationCount: user.consultationCount || 0,
      totalSpent: user.totalSpent || 0,
      memberType: user.memberType,
      joinDays: Math.floor((Date.now() - user.createTime) / (1000 * 60 * 60 * 24))
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