const router = require('express').Router();
const Clinic = require('../models/Clinic');
const Review = require('../models/Review');
const { verifyToken } = require('../middleware/auth');

/**
 * 获取诊所列表
 * GET /api/clinics
 */
router.get('/', async (req, res) => {
  try {
    const {
      district,
      specialty,
      keyword,
      sortBy = 'rating',
      page = 1,
      limit = 10
    } = req.query;

    const query = { status: 'active' };

    // 筛选条件
    if (district) query.district = district;
    if (specialty) query.specialties = specialty;
    if (keyword) {
      query.$or = [
        { name: { $regex: keyword, $options: 'i' } },
        { description: { $regex: keyword, $options: 'i' } }
      ];
    }

    // 排序
    let sort = {};
    switch (sortBy) {
      case 'rating':
        sort = { rating: -1, reviewCount: -1 };
        break;
      case 'price':
        sort = { priceRange: 1 };
        break;
      case 'distance':
        // 需要传入用户坐标
        break;
      default:
        sort = { featured: -1, sortOrder: -1 };
    }

    const skip = (page - 1) * limit;

    const clinics = await Clinic
      .find(query)
      .select('name nameKr address district specialties rating reviewCount priceRange logo coverImage tags verified featured')
      .sort(sort)
      .skip(skip)
      .limit(parseInt(limit));

    const total = await Clinic.countDocuments(query);

    res.json({
      success: true,
      data: {
        clinics,
        pagination: {
          page: parseInt(page),
          limit: parseInt(limit),
          total,
          pages: Math.ceil(total / limit)
        }
      }
    });
  } catch (error) {
    console.error('获取诊所列表失败:', error);
    res.status(500).json({
      success: false,
      message: '获取诊所列表失败'
    });
  }
});

/**
 * 获取热门/推荐诊所
 * GET /api/clinics/featured
 */
router.get('/featured', async (req, res) => {
  try {
    const clinics = await Clinic
      .find({ featured: true, status: 'active' })
      .select('name nameKr address district specialties rating reviewCount priceRange logo coverImage tags')
      .sort({ sortOrder: -1 })
      .limit(6);

    res.json({
      success: true,
      data: clinics
    });
  } catch (error) {
    console.error('获取推荐诊所失败:', error);
    res.status(500).json({
      success: false,
      message: '获取推荐诊所失败'
    });
  }
});

/**
 * 获取诊所详情
 * GET /api/clinics/:id
 */
router.get('/:id', async (req, res) => {
  try {
    const clinic = await Clinic.findById(req.params.id);

    if (!clinic) {
      return res.status(404).json({
        success: false,
        message: '诊所不存在'
      });
    }

    // 增加浏览量
    await Clinic.findByIdAndUpdate(req.params.id, {
      $inc: { viewCount: 1 }
    });

    res.json({
      success: true,
      data: clinic
    });
  } catch (error) {
    console.error('获取诊所详情失败:', error);
    res.status(500).json({
      success: false,
      message: '获取诊所详情失败'
    });
  }
});

/**
 * 获取诊所评价
 * GET /api/clinics/:id/reviews
 */
router.get('/:id/reviews', async (req, res) => {
  try {
    const { page = 1, limit = 10, sortBy = 'latest' } = req.query;

    const clinicId = req.params.id;

    // 检查诊所是否存在
    const clinic = await Clinic.findById(clinicId);
    if (!clinic) {
      return res.status(404).json({
        success: false,
        message: '诊所不存在'
      });
    }

    const query = { clinicId, status: 'approved' };

    // 排序
    let sort = {};
    switch (sortBy) {
      case 'helpful':
        sort = { helpfulCount: -1 };
        break;
      case 'rating':
        sort = { 'rating.overall': -1 };
        break;
      default:
        sort = { createdAt: -1 };
    }

    const skip = (page - 1) * limit;

    const reviews = await Review
      .find(query)
      .populate('userId', 'nickName avatarUrl')
      .sort(sort)
      .skip(skip)
      .limit(parseInt(limit));

    const total = await Review.countDocuments(query);

    // 获取评分统计
    const stats = await Review.aggregate([
      { $match: { clinicId: clinic._id, status: 'approved' } },
      {
        $group: {
          _id: null,
          avgOverall: { $avg: '$rating.overall' },
          avgService: { $avg: '$rating.service' },
          avgResult: { $avg: '$rating.result' },
          avgEnvironment: { $avg: '$rating.environment' },
          avgPrice: { $avg: '$rating.price' },
          count: { $sum: 1 }
        }
      }
    ]);

    res.json({
      success: true,
      data: {
        reviews,
        stats: stats[0] || {},
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
      message: '获取诊所评价失败'
    });
  }
});

/**
 * 搜索诊所
 * GET /api/clinics/search
 */
router.get('/search', async (req, res) => {
  try {
    const { q, limit = 10 } = req.query;

    if (!q) {
      return res.status(400).json({
        success: false,
        message: '请输入搜索关键词'
      });
    }

    const clinics = await Clinic
      .find({
        $text: { $search: q },
        status: 'active'
      })
      .select('name nameKr address district specialties rating reviewCount')
      .limit(parseInt(limit));

    res.json({
      success: true,
      data: clinics
    });
  } catch (error) {
    console.error('搜索诊所失败:', error);
    res.status(500).json({
      success: false,
      message: '搜索失败'
    });
  }
});

/**
 * 获取附近诊所
 * GET /api/clinics/nearby
 */
router.get('/nearby', async (req, res) => {
  try {
    const { longitude, latitude, maxDistance = 5000, limit = 10 } = req.query;

    if (!longitude || !latitude) {
      return res.status(400).json({
        success: false,
        message: '请提供位置信息'
      });
    }

    const clinics = await Clinic
      .find({
        location: {
          $near: {
            $geometry: {
              type: 'Point',
              coordinates: [parseFloat(longitude), parseFloat(latitude)]
            },
            $maxDistance: parseInt(maxDistance)
          }
        },
        status: 'active'
      })
      .select('name nameKr address district specialties rating reviewCount location')
      .limit(parseInt(limit));

    res.json({
      success: true,
      data: clinics
    });
  } catch (error) {
    console.error('获取附近诊所失败:', error);
    res.status(500).json({
      success: false,
      message: '获取附近诊所失败'
    });
  }
});

/**
 * 管理员创建诊所
 * POST /api/clinics/admin
 */
router.post('/admin', verifyToken, async (req, res) => {
  if (!req.user.isAdmin) {
    return res.status(403).json({
      success: false,
      message: '需要管理员权限'
    });
  }

  try {
    const clinic = new Clinic(req.body);
    await clinic.save();

    res.json({
      success: true,
      data: clinic
    });
  } catch (error) {
    console.error('创建诊所失败:', error);
    res.status(500).json({
      success: false,
      message: '创建诊所失败',
      error: error.message
    });
  }
});

/**
 * 管理员更新诊所
 * PUT /api/clinics/admin/:id
 */
router.put('/admin/:id', verifyToken, async (req, res) => {
  if (!req.user.isAdmin) {
    return res.status(403).json({
      success: false,
      message: '需要管理员权限'
    });
  }

  try {
    const clinic = await Clinic.findByIdAndUpdate(
      req.params.id,
      req.body,
      { new: true, runValidators: true }
    );

    if (!clinic) {
      return res.status(404).json({
        success: false,
        message: '诊所不存在'
      });
    }

    res.json({
      success: true,
      data: clinic
    });
  } catch (error) {
    console.error('更新诊所失败:', error);
    res.status(500).json({
      success: false,
      message: '更新诊所失败',
      error: error.message
    });
  }
});

/**
 * 管理员删除诊所
 * DELETE /api/clinics/admin/:id
 */
router.delete('/admin/:id', verifyToken, async (req, res) => {
  if (!req.user.isAdmin) {
    return res.status(403).json({
      success: false,
      message: '需要管理员权限'
    });
  }

  try {
    const clinic = await Clinic.findByIdAndUpdate(
      req.params.id,
      { status: 'inactive' },
      { new: true }
    );

    if (!clinic) {
      return res.status(404).json({
        success: false,
        message: '诊所不存在'
      });
    }

    res.json({
      success: true,
      message: '诊所已删除'
    });
  } catch (error) {
    console.error('删除诊所失败:', error);
    res.status(500).json({
      success: false,
      message: '删除诊所失败'
    });
  }
});

module.exports = router;