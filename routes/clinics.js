const router = require('express').Router();
const { verifyToken, optionalAuth } = require('../middleware/auth');

// 临时的诊所数据（实际应该从数据库读取）
const clinics = [
  {
    id: 'dr-petit',
    name: 'Dr.Petit整形外科',
    rating: 4.8,
    reviews: 1256,
    address: '首尔市江南区新沙洞123号',
    tags: ['双眼皮专科', 'TOP100医院', '医保定点'],
    image: '/images/clinic1.jpg',
    specialties: ['双眼皮', '隆鼻', '轮廓'],
    doctors: 15,
    yearEstablished: 2010
  },
  {
    id: 'grand',
    name: 'Grand整形外科',
    rating: 4.9,
    reviews: 2341,
    address: '首尔市江南区清潭洞456号',
    tags: ['轮廓专家', 'JCI认证', '明星医院'],
    image: '/images/clinic2.jpg',
    specialties: ['轮廓', '隆胸', '抗衰老'],
    doctors: 20,
    yearEstablished: 2008
  }
];

/**
 * 获取诊所列表
 * GET /api/clinics
 */
router.get('/', optionalAuth, async (req, res) => {
  try {
    const { page = 1, limit = 10, category, sort } = req.query;

    // 这里应该从数据库查询
    // const clinics = await Clinic.find(filter)
    //   .limit(limit)
    //   .skip((page - 1) * limit)
    //   .sort(sort);

    res.json({
      success: true,
      data: {
        clinics,
        total: clinics.length,
        page: Number(page),
        totalPages: Math.ceil(clinics.length / limit)
      }
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      message: '获取诊所列表失败'
    });
  }
});

/**
 * 获取诊所详情
 * GET /api/clinics/:id
 */
router.get('/:id', optionalAuth, async (req, res) => {
  try {
    const clinic = clinics.find(c => c.id === req.params.id);

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
    res.status(500).json({
      success: false,
      message: '获取诊所详情失败'
    });
  }
});

/**
 * 搜索诊所
 * GET /api/clinics/search
 */
router.get('/search', async (req, res) => {
  const { keyword, category, location } = req.query;

  try {
    // 实际应该使用数据库搜索
    let results = [...clinics];

    if (keyword) {
      results = results.filter(c =>
        c.name.includes(keyword) ||
        c.specialties.some(s => s.includes(keyword))
      );
    }

    res.json({
      success: true,
      data: results
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      message: '搜索失败'
    });
  }
});

module.exports = router;