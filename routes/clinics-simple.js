const router = require('express').Router();
const { verifyToken } = require('../middleware/auth');

// 模拟诊所数据存储（内存中）
let clinicsStore = [
  {
    _id: 'clinic_001',
    name: 'Seoul Beauty Clinic',
    nameKr: '서울 뷰티 클리닉',
    district: '江南',
    address: '首尔市江南区123号',
    phone: '02-1234-5678',
    specialties: ['皮肤管理', '整形手术'],
    rating: 4.8,
    reviewCount: 156,
    priceRange: '中高档',
    status: 'active',
    featured: true
  },
  {
    _id: 'clinic_002',
    name: 'Gangnam Medical Center',
    nameKr: '강남 메디컬 센터',
    district: '新沙',
    address: '首尔市新沙区456号',
    phone: '02-8765-4321',
    specialties: ['微整形', '皮肤管理'],
    rating: 4.6,
    reviewCount: 89,
    priceRange: '中档',
    status: 'active',
    featured: false
  }
];

let nextClinicId = 3;

/**
 * 获取诊所列表
 * GET /api/clinics
 */
router.get('/', async (req, res) => {
  try {
    const { limit = 10, page = 1, status } = req.query;

    let filteredClinics = [...clinicsStore];

    // 如果指定了状态，进行过滤
    if (status) {
      filteredClinics = filteredClinics.filter(c => c.status === status);
    }

    res.json({
      success: true,
      data: {
        clinics: filteredClinics.slice(0, parseInt(limit)),
        pagination: {
          page: parseInt(page),
          limit: parseInt(limit),
          total: filteredClinics.length,
          pages: Math.ceil(filteredClinics.length / parseInt(limit))
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
 * 获取推荐诊所
 * GET /api/clinics/featured
 */
router.get('/featured', async (req, res) => {
  try {
    const featuredClinics = clinicsStore.filter(c => c.featured && c.status === 'active');

    res.json({
      success: true,
      data: featuredClinics
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      message: '获取推荐诊所失败'
    });
  }
});

/**
 * 获取单个诊所详情
 * GET /api/clinics/:id
 */
router.get('/:id', async (req, res) => {
  try {
    const clinic = clinicsStore.find(c => c._id === req.params.id);

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
 * 管理员：创建诊所
 * POST /api/clinics/admin
 */
router.post('/admin', verifyToken, async (req, res) => {
  if (!req.user || !req.user.isAdmin) {
    return res.status(403).json({
      success: false,
      message: '需要管理员权限'
    });
  }

  try {
    const newClinic = {
      _id: `clinic_${String(nextClinicId++).padStart(3, '0')}`,
      ...req.body,
      rating: 0,
      reviewCount: 0,
      createTime: new Date(),
      status: 'active'
    };

    clinicsStore.push(newClinic);

    res.json({
      success: true,
      data: newClinic,
      message: '诊所创建成功'
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      message: '创建诊所失败'
    });
  }
});

/**
 * 管理员：更新诊所
 * PUT /api/clinics/admin/:id
 */
router.put('/admin/:id', verifyToken, async (req, res) => {
  if (!req.user || !req.user.isAdmin) {
    return res.status(403).json({
      success: false,
      message: '需要管理员权限'
    });
  }

  try {
    const clinicIndex = clinicsStore.findIndex(c => c._id === req.params.id);

    if (clinicIndex === -1) {
      return res.status(404).json({
        success: false,
        message: '诊所不存在'
      });
    }

    clinicsStore[clinicIndex] = {
      ...clinicsStore[clinicIndex],
      ...req.body,
      _id: req.params.id // 确保ID不被修改
    };

    res.json({
      success: true,
      data: clinicsStore[clinicIndex],
      message: '诊所更新成功'
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      message: '更新诊所失败'
    });
  }
});

/**
 * 管理员：删除诊所
 * DELETE /api/clinics/admin/:id
 */
router.delete('/admin/:id', verifyToken, async (req, res) => {
  if (!req.user || !req.user.isAdmin) {
    return res.status(403).json({
      success: false,
      message: '需要管理员权限'
    });
  }

  try {
    const clinicIndex = clinicsStore.findIndex(c => c._id === req.params.id);

    if (clinicIndex === -1) {
      return res.status(404).json({
        success: false,
        message: '诊所不存在'
      });
    }

    clinicsStore.splice(clinicIndex, 1);

    res.json({
      success: true,
      message: '诊所删除成功'
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      message: '删除诊所失败'
    });
  }
});

module.exports = router;