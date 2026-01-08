const router = require('express').Router();
const Review = require('../models/Review');
const Appointment = require('../models/Appointment');
const Clinic = require('../models/Clinic');
const { verifyToken, optionalAuth } = require('../middleware/auth');

/**
 * 创建评价（无门槛版本）
 * POST /api/reviews
 * 任何人都可以提交评价，无需预约
 */
router.post('/', optionalAuth, async (req, res) => {
  try {
    const {
      clinicId,
      clinicName,
      userId,
      userName,
      userAvatar,
      rating,
      content,
      images,
      serviceType
    } = req.body;

    // 基本验证
    if (!content || content.trim().length < 10) {
      return res.status(400).json({
        success: false,
        message: '评价内容至少需要10个字'
      });
    }

    if (!rating || rating < 1 || rating > 5) {
      return res.status(400).json({
        success: false,
        message: '请选择有效的评分'
      });
    }

    // 创建评价
    const review = new Review({
      userId: userId || (req.user ? req.user.userId : 'anonymous'),
      userName: userName || '匿名用户',
      userAvatar: userAvatar || '/images/default-avatar.png',
      clinicId: clinicId || null,
      clinicName: clinicName || '未知机构',
      serviceType: serviceType || '服务体验',
      rating: {
        overall: rating,
        service: rating,
        environment: rating,
        effect: rating
      },
      content: content.trim(),
      images: images || [],
      isAnonymous: !userName || userName === '匿名用户',
      isVerified: false, // 非预约用户的评价标记为未验证
      tags: [],
      status: 'pending' // 待审核
    });

    await review.save();

    res.json({
      success: true,
      message: '评价提交成功，等待审核',
      data: {
        id: review._id,
        status: review.status
      }
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
 * 获取诊所的评价列表
 * GET /api/reviews/clinic/:clinicId
 */
router.get('/clinic/:clinicId', async (req, res) => {
  try {
    const { clinicId } = req.params;
    const { page = 1, limit = 20, status = 'approved' } = req.query;

    const skip = (page - 1) * limit;

    // 查询条件：按clinicId或clinicName匹配
    const query = {
      $or: [
        { clinicId: clinicId },
        { clinicName: { $regex: clinicId, $options: 'i' } }
      ],
      status: status
    };

    const reviews = await Review
      .find(query)
      .sort({ createdAt: -1 })
      .skip(skip)
      .limit(parseInt(limit));

    const total = await Review.countDocuments(query);

    // 格式化返回数据
    const formattedReviews = reviews.map(review => ({
      id: review._id,
      userName: review.userName || '匿名用户',
      userAvatar: review.userAvatar || '/images/default-avatar.png',
      rating: review.rating?.overall || 5,
      content: review.content,
      images: review.images || [],
      date: review.createdAt ? new Date(review.createdAt).toLocaleDateString('zh-CN') : '',
      likes: review.helpfulCount || 0,
      comments: 0,
      isVerified: review.isVerified || false
    }));

    res.json({
      success: true,
      data: {
        reviews: formattedReviews,
        pagination: {
          page: parseInt(page),
          limit: parseInt(limit),
          total,
          pages: Math.ceil(total / limit)
        }
      }
    });
  } catch (error) {
    console.error('获取诊所评价失败:', error);
    res.status(500).json({
      success: false,
      message: '获取评价列表失败'
    });
  }
});

/**
 * 获取所有评价（包括待审核的，用于前端显示）
 * GET /api/reviews/all
 */
router.get('/all', async (req, res) => {
  try {
    const { page = 1, limit = 50 } = req.query;
    const skip = (page - 1) * limit;

    // 获取已审核通过的评价
    const reviews = await Review
      .find({ status: { $in: ['approved', 'pending'] } })
      .sort({ createdAt: -1 })
      .skip(skip)
      .limit(parseInt(limit));

    const total = await Review.countDocuments({ status: { $in: ['approved', 'pending'] } });

    const formattedReviews = reviews.map(review => ({
      id: review._id,
      clinicId: review.clinicId,
      clinicName: review.clinicName || '',
      userName: review.userName || '匿名用户',
      userAvatar: review.userAvatar || '/images/default-avatar.png',
      rating: review.rating?.overall || 5,
      content: review.content,
      images: review.images || [],
      date: review.createdAt ? new Date(review.createdAt).toLocaleDateString('zh-CN') : '',
      likes: review.helpfulCount || 0,
      status: review.status
    }));

    res.json({
      success: true,
      data: {
        reviews: formattedReviews,
        total
      }
    });
  } catch (error) {
    console.error('获取评价列表失败:', error);
    res.status(500).json({
      success: false,
      message: '获取评价列表失败'
    });
  }
});

/**
 * 创建评价（需要预约验证的版本）
 * POST /api/reviews/verified
 */
router.post('/verified', verifyToken, async (req, res) => {
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