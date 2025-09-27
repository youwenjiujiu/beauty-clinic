const router = require('express').Router();
const Config = require('../../models/Config');
const SearchHistory = require('../../models/SearchHistory');
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

/**
 * 获取所有配置列表
 * GET /api/admin/config
 */
router.get('/', verifyToken, requireAdmin, async (req, res) => {
  try {
    const configs = await Config.find()
      .sort({ type: 1, sortOrder: -1 });

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
 * 获取特定类型的配置
 * GET /api/admin/config/:type
 */
router.get('/:type', verifyToken, requireAdmin, async (req, res) => {
  try {
    const config = await Config.findOne({
      type: req.params.type,
      isActive: true
    });

    if (!config) {
      // 如果不存在，返回默认配置
      const defaultConfigs = getDefaultConfig(req.params.type);
      return res.json({
        success: true,
        data: {
          type: req.params.type,
          content: defaultConfigs,
          isDefault: true
        }
      });
    }

    res.json({
      success: true,
      data: config
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
    const { type, name, content, description, isActive } = req.body;

    let config = await Config.findOne({ type });

    if (config) {
      // 更新现有配置
      config.name = name || config.name;
      config.content = content;
      config.description = description || config.description;
      config.isActive = isActive !== undefined ? isActive : config.isActive;
      config.lastModifiedBy = req.user.userId;
      config.updatedAt = new Date();
    } else {
      // 创建新配置
      config = new Config({
        type,
        name,
        content,
        description,
        isActive: isActive !== undefined ? isActive : true,
        lastModifiedBy: req.user.userId
      });
    }

    await config.save();

    res.json({
      success: true,
      data: config
    });
  } catch (error) {
    console.error('保存配置失败:', error);
    res.status(500).json({
      success: false,
      message: '保存配置失败',
      error: error.message
    });
  }
});

/**
 * 删除配置
 * DELETE /api/admin/config/:id
 */
router.delete('/:id', verifyToken, requireAdmin, async (req, res) => {
  try {
    await Config.findByIdAndDelete(req.params.id);

    res.json({
      success: true,
      message: '配置已删除'
    });
  } catch (error) {
    console.error('删除配置失败:', error);
    res.status(500).json({
      success: false,
      message: '删除配置失败'
    });
  }
});

/**
 * 获取热门搜索配置（包含管理员设置的和算法生成的）
 * GET /api/admin/config/hot-searches/combined
 */
router.get('/hot-searches/combined', verifyToken, requireAdmin, async (req, res) => {
  try {
    // 1. 获取管理员配置的热门搜索
    const adminConfig = await Config.findOne({
      type: 'hot_searches',
      isActive: true
    });

    let adminHotSearches = [];
    if (adminConfig && adminConfig.content) {
      adminHotSearches = adminConfig.content.items || [];
    }

    // 2. 获取算法生成的热门搜索
    const algorithmHotSearches = await SearchHistory.getHotSearches(20, 30);

    // 3. 合并结果（管理员配置的优先级更高）
    const combinedSearches = [
      ...adminHotSearches.map(item => ({
        ...item,
        source: 'admin',
        priority: item.priority || 100
      })),
      ...algorithmHotSearches.filter(algoItem =>
        !adminHotSearches.some(adminItem =>
          adminItem.keyword === algoItem.keyword
        )
      ).map(item => ({
        ...item,
        source: 'algorithm',
        priority: 50
      }))
    ].sort((a, b) => b.priority - a.priority);

    res.json({
      success: true,
      data: {
        searches: combinedSearches.slice(0, 10),
        adminCount: adminHotSearches.length,
        algorithmCount: algorithmHotSearches.length
      }
    });
  } catch (error) {
    console.error('获取热门搜索失败:', error);
    res.status(500).json({
      success: false,
      message: '获取热门搜索失败'
    });
  }
});

/**
 * 批量更新配置
 * PUT /api/admin/config/batch
 */
router.put('/batch', verifyToken, requireAdmin, async (req, res) => {
  try {
    const { configs } = req.body;

    if (!Array.isArray(configs)) {
      return res.status(400).json({
        success: false,
        message: '配置数据格式错误'
      });
    }

    const results = [];

    for (const configData of configs) {
      let config = await Config.findOne({ type: configData.type });

      if (config) {
        config.content = configData.content;
        config.lastModifiedBy = req.user.userId;
        config.updatedAt = new Date();
        await config.save();
        results.push(config);
      }
    }

    res.json({
      success: true,
      data: results,
      message: `成功更新 ${results.length} 个配置`
    });
  } catch (error) {
    console.error('批量更新配置失败:', error);
    res.status(500).json({
      success: false,
      message: '批量更新配置失败'
    });
  }
});

// 获取默认配置
function getDefaultConfig(type) {
  const defaults = {
    hot_searches: {
      items: [
        { keyword: '双眼皮', priority: 100, isHot: true },
        { keyword: '隆鼻', priority: 90, isHot: true },
        { keyword: '瘦脸针', priority: 85, isHot: false },
        { keyword: '玻尿酸', priority: 80, isHot: false },
        { keyword: '祛斑', priority: 75, isHot: false }
      ]
    },
    filter_options: {
      districts: [
        { value: '江南区', label: '江南区' },
        { value: '瑞草区', label: '瑞草区' },
        { value: '明洞', label: '明洞' }
      ],
      services: [
        { value: 'eyes', label: '眼部整形' },
        { value: 'nose', label: '鼻部整形' },
        { value: 'face', label: '面部轮廓' },
        { value: 'skin', label: '皮肤管理' }
      ],
      priceRanges: [
        { value: '0-100', label: '100万韩元以下' },
        { value: '100-300', label: '100-300万韩元' },
        { value: '300-500', label: '300-500万韩元' },
        { value: '500+', label: '500万韩元以上' }
      ]
    },
    banner_images: {
      items: [
        {
          id: 1,
          imageUrl: '/images/banner1.jpg',
          title: '夏季特惠',
          link: '/pages/promotion/summer'
        }
      ]
    }
  };

  return defaults[type] || {};
}

module.exports = router;