const router = require('express').Router();
const fs = require('fs').promises;
const path = require('path');

// 使用文件存储（Vercel兼容）
let advisorsStore = [];
let lastLoadTime = 0;
const CACHE_DURATION = 5000; // 5秒缓存

// 数据文件路径 - 使用/tmp目录（Vercel支持）
const dataFile = path.join('/tmp', 'advisors-data.json');

// 从文件加载数据
async function loadFromFile() {
  const now = Date.now();

  // 如果缓存还有效，直接返回
  if (advisorsStore.length > 0 && (now - lastLoadTime) < CACHE_DURATION) {
    return advisorsStore;
  }

  try {
    const data = await fs.readFile(dataFile, 'utf-8');
    advisorsStore = JSON.parse(data);
    lastLoadTime = now;
    console.log('从文件加载了', advisorsStore.length, '个顾问');
  } catch (error) {
    console.log('没有找到数据文件或读取失败，使用默认数据');
    if (advisorsStore.length === 0) {
      initDefaultAdvisors();
    }
  }
  return advisorsStore;
}

// 保存到文件
async function saveToFile() {
  try {
    await fs.writeFile(dataFile, JSON.stringify(advisorsStore, null, 2));
    console.log('保存了', advisorsStore.length, '个顾问到文件');
  } catch (error) {
    console.error('保存文件失败:', error);
  }
}

// 初始化默认顾问数据
function initDefaultAdvisors() {
  if (advisorsStore.length === 0) {
    advisorsStore = [
      {
        _id: 'advisor_001',
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
        createdAt: new Date().toISOString(),
        updatedAt: new Date().toISOString()
      },
      {
        _id: 'advisor_002',
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
        createdAt: new Date().toISOString(),
        updatedAt: new Date().toISOString()
      }
    ];
  }
  return advisorsStore;
}

// 启动时加载数据
loadFromFile();

/**
 * 获取管理员顾问列表
 * GET /api/advisors/admin/list
 */
router.get('/admin/list', async (req, res) => {
  try {
    const advisors = await loadFromFile();
    res.json({
      success: true,
      data: advisors,
      total: advisors.length
    });
  } catch (error) {
    console.error('获取管理员顾问列表失败:', error);
    res.status(500).json({
      success: false,
      message: '获取顾问列表失败',
      error: error.message
    });
  }
});

/**
 * 获取所有顾问列表
 * GET /api/advisors
 */
router.get('/', async (req, res) => {
  try {
    const advisors = await loadFromFile();
    const { area, specialty, featured, status = 'active' } = req.query;

    let filtered = [...advisors];

    // 按状态筛选
    if (status) {
      filtered = filtered.filter(a => a.status === status);
    }

    // 按区域筛选
    if (area) {
      filtered = filtered.filter(a =>
        a.serviceAreas && a.serviceAreas.includes(area)
      );
    }

    // 按专长筛选
    if (specialty) {
      filtered = filtered.filter(a =>
        a.specialties && a.specialties.includes(specialty)
      );
    }

    // 只显示推荐
    if (featured === 'true') {
      filtered = filtered.filter(a => a.featured === true);
    }

    // 排序
    filtered.sort((a, b) => {
      if (a.featured !== b.featured) return b.featured ? 1 : -1;
      if (a.sortOrder !== b.sortOrder) return (b.sortOrder || 0) - (a.sortOrder || 0);
      return (b.rating || 0) - (a.rating || 0);
    });

    res.json({
      success: true,
      data: filtered,
      total: filtered.length
    });
  } catch (error) {
    console.error('获取顾问列表失败:', error);
    res.status(500).json({
      success: false,
      message: '获取顾问列表失败',
      error: error.message
    });
  }
});

/**
 * 获取单个顾问详情
 * GET /api/advisors/detail/:id
 */
router.get('/detail/:id', async (req, res) => {
  try {
    const advisors = await loadFromFile();
    const advisor = advisors.find(a => a._id === req.params.id);

    if (!advisor) {
      return res.status(404).json({
        success: false,
        message: '顾问不存在'
      });
    }

    res.json({
      success: true,
      data: advisor
    });
  } catch (error) {
    console.error('获取顾问详情失败:', error);
    res.status(500).json({
      success: false,
      message: '获取顾问详情失败',
      error: error.message
    });
  }
});

/**
 * 添加新顾问
 * POST /api/advisors/add
 */
router.post('/add', async (req, res) => {
  try {
    await loadFromFile();

    const newAdvisor = {
      _id: 'advisor_' + Date.now(),
      ...req.body,
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString()
    };

    advisorsStore.push(newAdvisor);
    await saveToFile();

    res.json({
      success: true,
      data: newAdvisor,
      message: '顾问添加成功'
    });
  } catch (error) {
    console.error('添加顾问失败:', error);
    res.status(500).json({
      success: false,
      message: '添加顾问失败',
      error: error.message
    });
  }
});

/**
 * 更新顾问信息
 * PUT /api/advisors/update/:id
 */
router.put('/update/:id', async (req, res) => {
  try {
    await loadFromFile();

    const index = advisorsStore.findIndex(a => a._id === req.params.id);

    if (index === -1) {
      return res.status(404).json({
        success: false,
        message: '顾问不存在'
      });
    }

    advisorsStore[index] = {
      ...advisorsStore[index],
      ...req.body,
      _id: req.params.id,
      updatedAt: new Date().toISOString()
    };

    await saveToFile();

    res.json({
      success: true,
      data: advisorsStore[index],
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
 * 删除顾问
 * DELETE /api/advisors/delete/:id
 */
router.delete('/delete/:id', async (req, res) => {
  try {
    await loadFromFile();

    const index = advisorsStore.findIndex(a => a._id === req.params.id);

    if (index === -1) {
      return res.status(404).json({
        success: false,
        message: '顾问不存在'
      });
    }

    const deleted = advisorsStore.splice(index, 1)[0];
    await saveToFile();

    res.json({
      success: true,
      data: deleted,
      message: '顾问删除成功'
    });
  } catch (error) {
    console.error('删除顾问失败:', error);
    res.status(500).json({
      success: false,
      message: '删除顾问失败',
      error: error.message
    });
  }
});

module.exports = router;