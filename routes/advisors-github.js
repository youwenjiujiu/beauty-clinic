const router = require('express').Router();
const axios = require('axios');

// GitHub配置
const GITHUB_TOKEN = process.env.GITHUB_TOKEN || '';
const GITHUB_OWNER = 'youwenjiujiu';  // 你的GitHub用户名
const GITHUB_REPO = 'beauty-clinic-data';  // 数据仓库名
const FILE_PATH = 'advisors.json';

// 内存缓存
let advisorsCache = null;
let cacheTime = 0;
const CACHE_DURATION = 30000; // 30秒缓存

// 默认顾问数据
const defaultAdvisors = [
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
    createdAt: '2025-01-01T00:00:00.000Z',
    updatedAt: '2025-01-01T00:00:00.000Z'
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
    createdAt: '2025-01-01T00:00:00.000Z',
    updatedAt: '2025-01-01T00:00:00.000Z'
  }
];

// 从GitHub加载数据
async function loadFromGitHub() {
  // 检查缓存
  if (advisorsCache && Date.now() - cacheTime < CACHE_DURATION) {
    return advisorsCache;
  }

  // 如果没有GitHub Token，使用默认数据
  if (!GITHUB_TOKEN) {
    console.log('使用默认数据（无GitHub Token）');
    return defaultAdvisors;
  }

  try {
    const url = `https://api.github.com/repos/${GITHUB_OWNER}/${GITHUB_REPO}/contents/${FILE_PATH}`;
    const response = await axios.get(url, {
      headers: {
        'Authorization': `token ${GITHUB_TOKEN}`,
        'Accept': 'application/vnd.github.v3+json'
      }
    });

    // 解码base64内容
    const content = Buffer.from(response.data.content, 'base64').toString('utf-8');
    advisorsCache = JSON.parse(content);
    cacheTime = Date.now();

    console.log(`从GitHub加载了 ${advisorsCache.length} 个顾问`);
    return advisorsCache;
  } catch (error) {
    if (error.response && error.response.status === 404) {
      // 文件不存在，返回默认数据
      console.log('GitHub文件不存在，使用默认数据');
      return defaultAdvisors;
    }
    console.error('从GitHub加载失败:', error.message);
    // 如果有缓存，返回缓存；否则返回默认数据
    return advisorsCache || defaultAdvisors;
  }
}

// 保存到GitHub
async function saveToGitHub(advisors) {
  if (!GITHUB_TOKEN) {
    console.log('无法保存：缺少GitHub Token');
    return false;
  }

  try {
    const url = `https://api.github.com/repos/${GITHUB_OWNER}/${GITHUB_REPO}/contents/${FILE_PATH}`;

    // 先获取当前文件的SHA（如果存在）
    let sha = null;
    try {
      const getResponse = await axios.get(url, {
        headers: {
          'Authorization': `token ${GITHUB_TOKEN}`,
          'Accept': 'application/vnd.github.v3+json'
        }
      });
      sha = getResponse.data.sha;
    } catch (e) {
      // 文件不存在，这是正常的
    }

    // 准备内容
    const content = Buffer.from(JSON.stringify(advisors, null, 2)).toString('base64');

    // 创建或更新文件
    const requestData = {
      message: `Update advisors data - ${new Date().toISOString()}`,
      content: content
    };

    if (sha) {
      requestData.sha = sha;
    }

    await axios.put(url, requestData, {
      headers: {
        'Authorization': `token ${GITHUB_TOKEN}`,
        'Accept': 'application/vnd.github.v3+json'
      }
    });

    // 清除缓存，强制下次重新加载
    advisorsCache = null;
    cacheTime = 0;

    console.log('成功保存到GitHub');
    return true;
  } catch (error) {
    console.error('保存到GitHub失败:', error.message);
    return false;
  }
}

/**
 * 获取管理员顾问列表
 * GET /api/advisors/admin/list
 */
router.get('/admin/list', async (req, res) => {
  try {
    const advisors = await loadFromGitHub();
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
    const advisors = await loadFromGitHub();
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
    const advisors = await loadFromGitHub();
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
    const advisors = await loadFromGitHub();

    const newAdvisor = {
      _id: 'advisor_' + Date.now(),
      ...req.body,
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString()
    };

    advisors.push(newAdvisor);

    // 保存到GitHub
    const saved = await saveToGitHub(advisors);

    res.json({
      success: true,
      data: newAdvisor,
      message: saved ? '顾问添加成功' : '顾问添加成功（本地）'
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
    const advisors = await loadFromGitHub();
    const index = advisors.findIndex(a => a._id === req.params.id);

    if (index === -1) {
      return res.status(404).json({
        success: false,
        message: '顾问不存在'
      });
    }

    advisors[index] = {
      ...advisors[index],
      ...req.body,
      _id: req.params.id,
      updatedAt: new Date().toISOString()
    };

    // 保存到GitHub
    const saved = await saveToGitHub(advisors);

    res.json({
      success: true,
      data: advisors[index],
      message: saved ? '顾问信息更新成功' : '顾问信息更新成功（本地）'
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
    const advisors = await loadFromGitHub();
    const index = advisors.findIndex(a => a._id === req.params.id);

    if (index === -1) {
      return res.status(404).json({
        success: false,
        message: '顾问不存在'
      });
    }

    const deleted = advisors.splice(index, 1)[0];

    // 保存到GitHub
    const saved = await saveToGitHub(advisors);

    res.json({
      success: true,
      data: deleted,
      message: saved ? '顾问删除成功' : '顾问删除成功（本地）'
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