const router = require('express').Router();
const fs = require('fs').promises;
const path = require('path');

// 静态数据文件路径
const dataFile = path.join(__dirname, '..', 'data', 'advisors.json');

// 内存缓存
let advisorsCache = null;
let lastModified = 0;

// 加载顾问数据
async function loadAdvisors() {
  try {
    // 检查文件是否存在
    const stats = await fs.stat(dataFile).catch(() => null);

    // 如果文件不存在或缓存为空，返回默认数据
    if (!stats) {
      return getDefaultAdvisors();
    }

    // 如果文件没有变化且缓存存在，使用缓存
    if (advisorsCache && stats.mtimeMs === lastModified) {
      return advisorsCache;
    }

    // 读取并解析文件
    const data = await fs.readFile(dataFile, 'utf-8');
    advisorsCache = JSON.parse(data);
    lastModified = stats.mtimeMs;

    console.log(`加载了 ${advisorsCache.length} 个顾问`);
    return advisorsCache;
  } catch (error) {
    console.error('加载顾问数据失败:', error);
    return getDefaultAdvisors();
  }
}

// 获取默认顾问数据
function getDefaultAdvisors() {
  return [
    {
      _id: 'advisor_001',
      name: '小美顾问',
      nameKr: '샤오메이',
      phone: '010-1234-5678',
      wechat: 'xiaomei_service',
      avatar: '',
      gender: 'female',
      languages: ['中文', '韩语'],
      specialties: ['医美咨询', '整形咨询'],
      experience: 5,
      serviceAreas: ['江南区', '瑞草区'],
      serviceTypes: ['陪同翻译', '项目咨询', '预约安排'],
      introduction: '5年医美陪同经验，熟悉首尔各大医美机构',
      rating: 4.9,
      reviewCount: 156,
      totalServices: 200,
      status: 'active',
      featured: true,
      tags: ['资深顾问', '双语服务', '医美专家'],
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
      avatar: '',
      gender: 'male',
      languages: ['中文', '韩语', '英语'],
      specialties: ['整形咨询', '术后护理'],
      experience: 3,
      serviceAreas: ['江南区', '明洞'],
      serviceTypes: ['陪同翻译', '术后跟进'],
      introduction: '3年医美行业经验，专注整形项目咨询',
      rating: 4.7,
      reviewCount: 89,
      totalServices: 120,
      status: 'active',
      featured: false,
      tags: ['整形专家', '多语言'],
      sortOrder: 5,
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString()
    }
  ];
}

/**
 * 获取管理员顾问列表
 * GET /api/advisors/admin/list
 */
router.get('/admin/list', async (req, res) => {
  try {
    const advisors = await loadAdvisors();
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
    const advisors = await loadAdvisors();
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
    const advisors = await loadAdvisors();
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
 * 添加新顾问（仅返回成功，不实际保存）
 * POST /api/advisors/add
 */
router.post('/add', async (req, res) => {
  try {
    const newAdvisor = {
      _id: 'advisor_' + Date.now(),
      ...req.body,
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString()
    };

    // 在生产环境中只返回成功，不实际保存
    console.log('新增顾问（演示）:', newAdvisor.name);

    res.json({
      success: true,
      data: newAdvisor,
      message: '顾问添加成功（演示模式）'
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
 * 更新顾问信息（仅返回成功，不实际保存）
 * PUT /api/advisors/update/:id
 */
router.put('/update/:id', async (req, res) => {
  try {
    const advisors = await loadAdvisors();
    const advisor = advisors.find(a => a._id === req.params.id);

    if (!advisor) {
      return res.status(404).json({
        success: false,
        message: '顾问不存在'
      });
    }

    const updated = {
      ...advisor,
      ...req.body,
      _id: req.params.id,
      updatedAt: new Date().toISOString()
    };

    console.log('更新顾问（演示）:', updated.name);

    res.json({
      success: true,
      data: updated,
      message: '顾问信息更新成功（演示模式）'
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
 * 删除顾问（仅返回成功，不实际删除）
 * DELETE /api/advisors/delete/:id
 */
router.delete('/delete/:id', async (req, res) => {
  try {
    const advisors = await loadAdvisors();
    const advisor = advisors.find(a => a._id === req.params.id);

    if (!advisor) {
      return res.status(404).json({
        success: false,
        message: '顾问不存在'
      });
    }

    console.log('删除顾问（演示）:', advisor.name);

    res.json({
      success: true,
      data: advisor,
      message: '顾问删除成功（演示模式）'
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