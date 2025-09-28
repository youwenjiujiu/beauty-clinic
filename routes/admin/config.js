const router = require('express').Router();
const { verifyToken } = require('../../middleware/auth');

// 管理员权限检查中间件
const requireAdmin = (req, res, next) => {
  if (!req.user || !req.user.isAdmin) {
    return res.status(403).json({
      success: false,
      message: '需要管理员权限'
    });
  }
  next();
};

// 内存中存储配置（没有数据库时）
let configStore = {
  hot_searches: {
    items: [
      { keyword: '双眼皮', priority: 100, isHot: true },
      { keyword: '瘦脸针', priority: 90, isHot: true },
      { keyword: '玻尿酸', priority: 80, isHot: false }
    ]
  },
  filter_options: {
    districts: [
      { value: 'gangnam', label: '江南' },
      { value: 'sinsa', label: '新沙' }
    ],
    services: [
      { value: 'skin', label: '皮肤管理' },
      { value: 'plastic', label: '整形手术' }
    ],
    priceRanges: [
      { value: '0-100', label: '100万韩元以下' },
      { value: '100-300', label: '100-300万韩元' }
    ]
  },
  banner_images: {
    items: [
      {
        imageUrl: '/images/banner1.jpg',
        title: '新年特惠',
        link: '/promotion',
        sortOrder: 1
      }
    ]
  }
};

/**
 * 获取所有配置列表
 * GET /api/admin/config
 */
router.get('/', verifyToken, requireAdmin, async (req, res) => {
  try {
    // 返回所有配置
    const configs = Object.keys(configStore).map(type => ({
      type,
      content: configStore[type],
      isActive: true
    }));

    res.json({
      success: true,
      data: configs
    });
  } catch (error) {
    console.error('获取配置失败:', error);
    res.status(500).json({
      success: false,
      message: '获取配置失败'
    });
  }
});

/**
 * 获取组合热搜（管理员配置+算法生成）
 * GET /api/admin/config/hot-searches/combined
 */
router.get('/hot-searches/combined', verifyToken, requireAdmin, async (req, res) => {
  try {
    const adminSearches = configStore.hot_searches?.items || [];

    // 模拟算法生成的热搜
    const algorithmSearches = [
      { keyword: '隆鼻', count: 150, clickRate: 45, source: 'algorithm', isHot: true },
      { keyword: '美白针', count: 120, clickRate: 38, source: 'algorithm', isHot: false }
    ];

    res.json({
      success: true,
      data: {
        searches: [
          ...adminSearches.map(item => ({ ...item, source: 'admin' })),
          ...algorithmSearches
        ]
      }
    });
  } catch (error) {
    console.error('获取组合热搜失败:', error);
    res.status(500).json({
      success: false,
      message: '获取热搜失败'
    });
  }
});

/**
 * 获取特定类型的配置
 * GET /api/admin/config/:type
 */
router.get('/:type', verifyToken, requireAdmin, async (req, res) => {
  try {
    const config = configStore[req.params.type];

    if (!config) {
      return res.status(404).json({
        success: false,
        message: '配置不存在'
      });
    }

    res.json({
      success: true,
      data: {
        type: req.params.type,
        content: config,
        isActive: true
      }
    });
  } catch (error) {
    console.error('获取配置失败:', error);
    res.status(500).json({
      success: false,
      message: '获取配置失败'
    });
  }
});

/**
 * 创建或更新配置
 * POST /api/admin/config
 */
router.post('/', verifyToken, requireAdmin, async (req, res) => {
  try {
    const { type, name, content, isActive } = req.body;

    if (!type || !content) {
      return res.status(400).json({
        success: false,
        message: '参数缺失'
      });
    }

    // 保存到内存中
    configStore[type] = content;

    res.json({
      success: true,
      data: {
        type,
        name,
        content,
        isActive: true
      },
      message: '配置保存成功'
    });
  } catch (error) {
    console.error('保存配置失败:', error);
    res.status(500).json({
      success: false,
      message: '保存配置失败'
    });
  }
});

/**
 * 更新配置
 * PUT /api/admin/config/:type
 */
router.put('/:type', verifyToken, requireAdmin, async (req, res) => {
  const { type } = req.params;
  const { content } = req.body;

  try {
    if (!content) {
      return res.status(400).json({
        success: false,
        message: '内容不能为空'
      });
    }

    configStore[type] = content;

    res.json({
      success: true,
      data: {
        type,
        content,
        isActive: true
      },
      message: '配置更新成功'
    });
  } catch (error) {
    console.error('更新配置失败:', error);
    res.status(500).json({
      success: false,
      message: '更新配置失败'
    });
  }
});

/**
 * 删除配置
 * DELETE /api/admin/config/:type
 */
router.delete('/:type', verifyToken, requireAdmin, async (req, res) => {
  const { type } = req.params;

  try {
    if (!configStore[type]) {
      return res.status(404).json({
        success: false,
        message: '配置不存在'
      });
    }

    delete configStore[type];

    res.json({
      success: true,
      message: '配置删除成功'
    });
  } catch (error) {
    console.error('删除配置失败:', error);
    res.status(500).json({
      success: false,
      message: '删除配置失败'
    });
  }
});

module.exports = router;