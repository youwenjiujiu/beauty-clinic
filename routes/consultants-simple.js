const router = require('express').Router();

// 使用内存存储（无需数据库）
let consultantsStore = [];

// 初始化一些示例顾问数据
function initDefaultConsultants() {
  if (consultantsStore.length === 0) {
    consultantsStore = [
      {
        _id: 'consultant_001',
        name: '小美顾问',
        nameKr: '샤오메이',
        phone: '010-1234-5678',
        wechat: 'xiaomei_service',
        kakaoTalk: 'xiaomei_kr',
        avatar: '',
        gender: 'female',
        languages: ['中文', '韩语'],
        specialties: ['医美咨询', '整形咨询'],
        experience: 5,
        serviceAreas: ['江南区', '瑞草区'],
        serviceTypes: ['陪同翻译', '项目咨询', '预约安排'],
        introduction: '5年医美陪同经验，熟悉首尔各大医美机构',
        introductionKr: '5년 의료미용 동행 경험, 서울 주요 병원 잘 알고 있습니다',
        rating: 4.9,
        reviewCount: 156,
        totalServices: 200,
        consultationFee: 0,
        accompanyFee: 300,
        status: 'active',
        featured: true,
        tags: ['资深顾问', '双语服务', '医美专家'],
        qrCodes: {
          wechat: '/images/qr-xiaomei-wechat.jpg',
          kakaoTalk: '/images/qr-xiaomei-kakao.jpg'
        },
        sortOrder: 10,
        createdAt: new Date(),
        updatedAt: new Date()
      },
      {
        _id: 'consultant_002',
        name: '李明顾问',
        nameKr: '리밍',
        phone: '010-2345-6789',
        wechat: 'liming_consultant',
        kakaoTalk: 'liming_kr',
        avatar: '',
        gender: 'male',
        languages: ['中文', '韩语', '英语'],
        specialties: ['整形咨询', '术后护理'],
        experience: 3,
        serviceAreas: ['江南区', '明洞'],
        serviceTypes: ['陪同翻译', '术后跟进'],
        introduction: '3年医美行业经验，专注整形项目咨询',
        introductionKr: '3년 의료미용 업계 경험, 성형 프로젝트 상담 전문',
        rating: 4.7,
        reviewCount: 89,
        totalServices: 120,
        consultationFee: 0,
        accompanyFee: 250,
        status: 'active',
        featured: false,
        tags: ['整形专家', '多语言'],
        qrCodes: {
          wechat: '/images/qr-liming-wechat.jpg',
          kakaoTalk: '/images/qr-liming-kakao.jpg'
        },
        sortOrder: 5,
        createdAt: new Date(),
        updatedAt: new Date()
      }
    ];
  }
  return consultantsStore;
}

/**
 * 获取所有顾问列表（公开接口）
 * GET /api/consultants
 */
router.get('/', async (req, res) => {
  try {
    const { area, specialty, featured, status = 'active' } = req.query;

    // 确保有默认数据
    let consultants = initDefaultConsultants();

    // 按状态筛选
    if (status) {
      consultants = consultants.filter(c => c.status === status);
    }

    // 按区域筛选
    if (area) {
      consultants = consultants.filter(c =>
        c.serviceAreas && c.serviceAreas.includes(area)
      );
    }

    // 按专长筛选
    if (specialty) {
      consultants = consultants.filter(c =>
        c.specialties && c.specialties.includes(specialty)
      );
    }

    // 只显示推荐
    if (featured === 'true') {
      consultants = consultants.filter(c => c.featured === true);
    }

    // 排序
    consultants.sort((a, b) => {
      if (a.featured !== b.featured) return b.featured ? 1 : -1;
      if (a.sortOrder !== b.sortOrder) return b.sortOrder - a.sortOrder;
      return b.rating - a.rating;
    });

    res.json({
      success: true,
      data: consultants
    });
  } catch (error) {
    console.error('获取顾问列表失败:', error);
    res.status(500).json({
      success: false,
      message: '获取顾问列表失败'
    });
  }
});

/**
 * 获取单个顾问详情（公开接口）
 * GET /api/consultants/:id
 */
router.get('/:id', async (req, res) => {
  try {
    const consultants = initDefaultConsultants();
    const consultant = consultants.find(c => c._id === req.params.id);

    if (!consultant) {
      return res.status(404).json({
        success: false,
        message: '顾问不存在'
      });
    }

    res.json({
      success: true,
      data: consultant
    });
  } catch (error) {
    console.error('获取顾问详情失败:', error);
    res.status(500).json({
      success: false,
      message: '获取顾问详情失败'
    });
  }
});

/**
 * 创建顾问（管理员接口）
 * POST /api/consultants
 */
router.post('/', async (req, res) => {
  try {
    const consultant = {
      _id: 'consultant_' + Date.now(),
      ...req.body,
      createdAt: new Date(),
      updatedAt: new Date()
    };

    consultantsStore.push(consultant);

    res.json({
      success: true,
      data: consultant,
      message: '顾问创建成功'
    });
  } catch (error) {
    console.error('创建顾问失败:', error);
    res.status(500).json({
      success: false,
      message: '创建顾问失败',
      error: error.message
    });
  }
});

/**
 * 更新顾问信息（管理员接口）
 * PUT /api/consultants/:id
 */
router.put('/:id', async (req, res) => {
  try {
    const index = consultantsStore.findIndex(c => c._id === req.params.id);

    if (index === -1) {
      return res.status(404).json({
        success: false,
        message: '顾问不存在'
      });
    }

    consultantsStore[index] = {
      ...consultantsStore[index],
      ...req.body,
      _id: req.params.id, // 保持ID不变
      updatedAt: new Date()
    };

    res.json({
      success: true,
      data: consultantsStore[index],
      message: '顾问信息更新成功'
    });
  } catch (error) {
    console.error('更新顾问失败:', error);
    res.status(500).json({
      success: false,
      message: '更新顾问失败',
      error: error.message
    });
  }
});

/**
 * 删除顾问（管理员接口）
 * DELETE /api/consultants/:id
 */
router.delete('/:id', async (req, res) => {
  try {
    const index = consultantsStore.findIndex(c => c._id === req.params.id);

    if (index === -1) {
      return res.status(404).json({
        success: false,
        message: '顾问不存在'
      });
    }

    consultantsStore.splice(index, 1);

    res.json({
      success: true,
      message: '顾问删除成功'
    });
  } catch (error) {
    console.error('删除顾问失败:', error);
    res.status(500).json({
      success: false,
      message: '删除顾问失败'
    });
  }
});

/**
 * 获取推荐顾问（公开接口）
 * GET /api/consultants/featured/list
 */
router.get('/featured/list', async (req, res) => {
  try {
    const consultants = initDefaultConsultants();
    const featured = consultants
      .filter(c => c.featured && c.status === 'active')
      .sort((a, b) => b.sortOrder - a.sortOrder)
      .slice(0, 10);

    res.json({
      success: true,
      data: featured
    });
  } catch (error) {
    console.error('获取推荐顾问失败:', error);
    res.status(500).json({
      success: false,
      message: '获取推荐顾问失败'
    });
  }
});

module.exports = router;
