const router = require('express').Router();
const Review = require('../models/Review');
const Appointment = require('../models/Appointment');
const Clinic = require('../models/Clinic');
const { verifyToken } = require('../middleware/auth');

/**
 * 创建评价
 * POST /api/reviews
 */
router.post('/', verifyToken, async (req, res) => {
  try {
    const {
      appointmentId,
      clinicId,
      serviceType,
      rating,
      content,
      images,
      isAnonymous,
      tags
    } = req.body;

    // 验证预约是否存在且已完成
    const appointment = await Appointment.findById(appointmentId);
    if (!appointment) {
      return res.status(404).json({
        success: false,
        message: '预约不存在'
      });
    }

    if (appointment.openId !== req.user.openId) {
      return res.status(403).json({
        success: false,
        message: '只能评价自己的预约'
      });
    }

    if (appointment.status !== 'completed') {
      return res.status(400).json({
        success: false,
        message: '只能评价已完成的预约'
      });
    }

    if (appointment.hasReviewed) {
      return res.status(400).json({
        success: false,
        message: '该预约已评价'
      });
    }

    // 创建评价
    const review = new Review({
      userId: req.user.userId,
      clinicId: clinicId || appointment.clinicId,
      appointmentId,
      serviceType: serviceType || appointment.serviceType,
      rating,
      content,
      images: images || [],
      isAnonymous: isAnonymous || false,
      isVerified: true, // 因为是真实预约后的评价
      tags: tags || [],
      status: 'pending' // 需要审核
    });

    await review.save();

    // 更新预约的评价状态
    appointment.hasReviewed = true;
    appointment.reviewId = review._id;
    await appointment.save();

    res.json({
      success: true,
      message: '评价提交成功，等待审核',
      data: review
    });
  } catch (error) {
    console.error('创建评价失败:', error);
    res.status(500).json({
      success: false,
      message: '提交评价失败'
    });
  }
});

/**
 * 获取我的评价列表
 * GET /api/reviews/my
 */
router.get('/my', verifyToken, async (req, res) => {
  try {
    const { page = 1, limit = 10 } = req.query;

    const skip = (page - 1) * limit;

    const reviews = await Review
      .find({ userId: req.user.userId })
      .populate('clinicId', 'name address logo')
      .populate('appointmentId', 'serviceType appointmentDate')
      .sort({ createdAt: -1 })
      .skip(skip)
      .limit(parseInt(limit));

    const total = await Review.countDocuments({ userId: req.user.userId });

    res.json({
      success: true,
      data: {
        reviews,
        pagination: {
          page: parseInt(page),
          limit: parseInt(limit),
          total,
          pages: Math.ceil(total / limit)
        }
      }
    });
  } catch (error) {
    console.error('获取我的评价失败:', error);
    res.status(500).json({
      success: false,
      message: '获取评价列表失败'
    });
  }
});

/**
 * 获取评价详情
 * GET /api/reviews/:id
 */
router.get('/:id', async (req, res) => {
  try {
    const review = await Review
      .findById(req.params.id)
      .populate('userId', 'nickName avatarUrl')
      .populate('clinicId', 'name address')
      .populate('appointmentId', 'serviceType');

    if (!review) {
      return res.status(404).json({
        success: false,
        message: '评价不存在'
      });
    }

    res.json({
      success: true,
      data: review
    });
  } catch (error) {
    console.error('获取评价详情失败:', error);
    res.status(500).json({
      success: false,
      message: '获取评价详情失败'
    });
  }
});

/**
 * 标记评价有用
 * PUT /api/reviews/:id/helpful
 */
router.put('/:id/helpful', verifyToken, async (req, res) => {
  try {
    const review = await Review.findById(req.params.id);

    if (!review) {
      return res.status(404).json({
        success: false,
        message: '评价不存在'
      });
    }

    await review.markHelpful(req.user.userId);

    res.json({
      success: true,
      message: '已标记为有用'
    });
  } catch (error) {
    console.error('标记有用失败:', error);
    res.status(500).json({
      success: false,
      message: '操作失败'
    });
  }
});

/**
 * 管理员审核评价
 * PUT /api/reviews/admin/:id/review
 */
router.put('/admin/:id/review', verifyToken, async (req, res) => {
  if (!req.user.isAdmin) {
    return res.status(403).json({
      success: false,
      message: '需要管理员权限'
    });
  }

  try {
    const { status, rejectReason } = req.body;

    if (!['approved', 'rejected'].includes(status)) {
      return res.status(400).json({
        success: false,
        message: '无效的审核状态'
      });
    }

    const review = await Review.findById(req.params.id);

    if (!review) {
      return res.status(404).json({
        success: false,
        message: '评价不存在'
      });
    }

    review.status = status;
    review.reviewedBy = req.user.userId;
    review.reviewedAt = new Date();

    if (status === 'rejected' && rejectReason) {
      review.rejectReason = rejectReason;
    }

    await review.save();

    // 如果审核通过，更新诊所评分
    if (status === 'approved') {
      const reviews = await Review.find({
        clinicId: review.clinicId,
        status: 'approved'
      });

      if (reviews.length > 0) {
        const avgRating = reviews.reduce((sum, r) => sum + r.rating.overall, 0) / reviews.length;

        await Clinic.findByIdAndUpdate(review.clinicId, {
          rating: Math.round(avgRating * 10) / 10,
          reviewCount: reviews.length
        });
      }
    }

    res.json({
      success: true,
      message: `评价已${status === 'approved' ? '通过' : '拒绝'}`,
      data: review
    });
  } catch (error) {
    console.error('审核评价失败:', error);
    res.status(500).json({
      success: false,
      message: '审核失败'
    });
  }
});

/**
 * 管理员回复评价
 * PUT /api/reviews/admin/:id/reply
 */
router.put('/admin/:id/reply', verifyToken, async (req, res) => {
  if (!req.user.isAdmin) {
    return res.status(403).json({
      success: false,
      message: '需要管理员权限'
    });
  }

  try {
    const { content } = req.body;

    if (!content) {
      return res.status(400).json({
        success: false,
        message: '回复内容不能为空'
      });
    }

    const review = await Review.findById(req.params.id);

    if (!review) {
      return res.status(404).json({
        success: false,
        message: '评价不存在'
      });
    }

    review.reply = {
      content,
      repliedBy: req.user.userId,
      repliedAt: new Date()
    };

    await review.save();

    res.json({
      success: true,
      message: '回复成功',
      data: review
    });
  } catch (error) {
    console.error('回复评价失败:', error);
    res.status(500).json({
      success: false,
      message: '回复失败'
    });
  }
});

/**
 * 管理员获取待审核评价
 * GET /api/reviews/admin/pending
 */
router.get('/admin/pending', verifyToken, async (req, res) => {
  if (!req.user.isAdmin) {
    return res.status(403).json({
      success: false,
      message: '需要管理员权限'
    });
  }

  try {
    const { page = 1, limit = 20 } = req.query;

    const skip = (page - 1) * limit;

    const reviews = await Review
      .find({ status: 'pending' })
      .populate('userId', 'nickName phone')
      .populate('clinicId', 'name')
      .populate('appointmentId', 'serviceType appointmentDate')
      .sort({ createdAt: -1 })
      .skip(skip)
      .limit(parseInt(limit));

    const total = await Review.countDocuments({ status: 'pending' });

    res.json({
      success: true,
      data: {
        reviews,
        pagination: {
          page: parseInt(page),
          limit: parseInt(limit),
          total,
          pages: Math.ceil(total / limit)
        }
      }
    });
  } catch (error) {
    console.error('获取待审核评价失败:', error);
    res.status(500).json({
      success: false,
      message: '获取失败'
    });
  }
});

/**
 * 管理员删除评价
 * DELETE /api/reviews/admin/:id
 */
router.delete('/admin/:id', verifyToken, async (req, res) => {
  if (!req.user.isAdmin) {
    return res.status(403).json({
      success: false,
      message: '需要管理员权限'
    });
  }

  try {
    const review = await Review.findById(req.params.id);

    if (!review) {
      return res.status(404).json({
        success: false,
        message: '评价不存在'
      });
    }

    // 软删除，改变状态为hidden
    review.status = 'hidden';
    await review.save();

    // 更新相关预约的评价状态
    if (review.appointmentId) {
      await Appointment.findByIdAndUpdate(review.appointmentId, {
        hasReviewed: false,
        reviewId: null
      });
    }

    // 更新诊所评分
    const reviews = await Review.find({
      clinicId: review.clinicId,
      status: 'approved'
    });

    if (reviews.length > 0) {
      const avgRating = reviews.reduce((sum, r) => sum + r.rating.overall, 0) / reviews.length;

      await Clinic.findByIdAndUpdate(review.clinicId, {
        rating: Math.round(avgRating * 10) / 10,
        reviewCount: reviews.length
      });
    } else {
      await Clinic.findByIdAndUpdate(review.clinicId, {
        rating: 0,
        reviewCount: 0
      });
    }

    res.json({
      success: true,
      message: '评价已删除'
    });
  } catch (error) {
    console.error('删除评价失败:', error);
    res.status(500).json({
      success: false,
      message: '删除失败'
    });
  }
});

module.exports = router;