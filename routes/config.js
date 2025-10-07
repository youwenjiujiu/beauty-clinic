const router = require('express').Router();
const Config = require('../models/Config');
const SearchHistory = require('../models/SearchHistory');

/**
 * 获取应用运行模式（公开接口）
 * GET /api/config/mode
 *
 * 返回值：
 * - review: 审核模式，显示杭州本地服务数据
 * - production: 生产模式，显示韩国医美数据
 */
router.get('/mode', async (req, res) => {
  try {
    // 方法1：从数据库获取配置
    const modeConfig = await Config.findOne({
      type: 'app_mode',
      isActive: true
    });

    let mode = 'review'; // 默认审核模式（安全第一）

    if (modeConfig && modeConfig.content && modeConfig.content.mode) {
      mode = modeConfig.content.mode;
    } else {
      // 方法2：从环境变量获取
      mode = process.env.APP_MODE || 'review';
    }

    // 验证模式值
    if (!['review', 'production'].includes(mode)) {
      mode = 'review'; // 无效值时默认审核模式
    }

    console.log(`[模式查询] 当前模式: ${mode}`);

    res.json({
      success: true,
      mode: mode,
      message: mode === 'review' ? '当前为审核模式' : '当前为生产模式',
      timestamp: Date.now()
    });
  } catch (error) {
    console.error('获取模式配置失败:', error);
    // 出错时返回安全的审核模式
    res.json({
      success: true,
      mode: 'review',
      message: '配置加载失败，使用审核模式',
      timestamp: Date.now()
    });
  }
});

/**
 * 获取热门搜索（公开接口）
 * GET /api/config/hot-searches
 */
router.get('/hot-searches', async (req, res) => {
  try {
    // 1. 获取管理员配置的热门搜索
    const adminConfig = await Config.findOne({
      type: 'hot_searches',
      isActive: true
    });

    let adminHotSearches = [];
    if (adminConfig && adminConfig.content && adminConfig.content.items) {
      adminHotSearches = adminConfig.content.items;
    }

    // 2. 获取算法生成的热门搜索（最近7天）
    const algorithmHotSearches = await SearchHistory.getHotSearches(10, 7);

    // 3. 合并结果（管理员配置优先）
    const hotSearchMap = new Map();

    // 先添加管理员配置的
    adminHotSearches.forEach(item => {
      hotSearchMap.set(item.keyword, {
        keyword: item.keyword,
        isHot: item.isHot || false,
        priority: item.priority || 100,
        source: 'admin'
      });
    });

    // 再添加算法生成的（如果不重复）
    algorithmHotSearches.forEach(item => {
      if (!hotSearchMap.has(item.keyword)) {
        hotSearchMap.set(item.keyword, {
          keyword: item.keyword,
          isHot: item.isHot || false,
          priority: 50, // 算法生成的优先级较低
          source: 'algorithm'
        });
      }
    });

    // 排序并取前10个
    const sortedSearches = Array.from(hotSearchMap.values())
      .sort((a, b) => b.priority - a.priority)
      .slice(0, 10)
      .map(({ keyword, isHot }) => ({ keyword, isHot })); // 只返回必要字段

    res.json({
      success: true,
      data: sortedSearches
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
 * 获取筛选选项（公开接口）
 * GET /api/config/filter-options
 */
router.get('/filter-options', async (req, res) => {
  try {
    const config = await Config.findOne({
      type: 'filter_options',
      isActive: true
    });

    if (!config) {
      // 返回默认选项
      return res.json({
        success: true,
        data: {
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
        }
      });
    }

    res.json({
      success: true,
      data: config.content
    });
  } catch (error) {
    console.error('获取筛选选项失败:', error);
    res.status(500).json({
      success: false,
      message: '获取筛选选项失败'
    });
  }
});

/**
 * 获取轮播图（公开接口）
 * GET /api/config/banners
 */
router.get('/banners', async (req, res) => {
  try {
    const config = await Config.findOne({
      type: 'banner_images',
      isActive: true
    });

    if (!config || !config.content || !config.content.items) {
      // 返回默认轮播图
      return res.json({
        success: true,
        data: [
          {
            id: 1,
            imageUrl: 'https://placehold.co/750x350',
            title: '欢迎使用嘟嘟预约通',
            link: ''
          }
        ]
      });
    }

    // 按排序返回
    const banners = config.content.items
      .sort((a, b) => (b.sortOrder || 0) - (a.sortOrder || 0));

    res.json({
      success: true,
      data: banners
    });
  } catch (error) {
    console.error('获取轮播图失败:', error);
    res.status(500).json({
      success: false,
      message: '获取轮播图失败'
    });
  }
});

/**
 * 记录搜索历史（公开接口）
 * POST /api/config/search-history
 */
router.post('/search-history', async (req, res) => {
  try {
    const {
      keyword,
      searchType,
      resultCount,
      hasClicked,
      clickedItemId,
      deviceInfo
    } = req.body;

    // 获取用户信息（如果有）
    const userId = req.user?.userId;
    const openId = req.user?.openId;

    // 创建搜索历史记录
    const searchHistory = new SearchHistory({
      keyword,
      userId,
      openId,
      searchType: searchType || 'general',
      resultCount: resultCount || 0,
      hasClicked: hasClicked || false,
      clickedItemId,
      deviceInfo,
      ipAddress: req.ip
    });

    await searchHistory.save();

    res.json({
      success: true,
      message: '搜索记录已保存'
    });
  } catch (error) {
    console.error('保存搜索历史失败:', error);
    // 不返回错误，避免影响用户体验
    res.json({
      success: true
    });
  }
});

/**
 * 获取所有配置（批量获取）
 * GET /api/config/all
 */
router.get('/all', async (req, res) => {
  try {
    const configs = await Config.find({ isActive: true });

    const configMap = {};
    configs.forEach(config => {
      configMap[config.type] = config.content;
    });

    // 添加默认值
    if (!configMap.hot_searches) {
      configMap.hot_searches = {
        items: []
      };
    }

    if (!configMap.filter_options) {
      configMap.filter_options = {
        districts: [],
        services: [],
        priceRanges: []
      };
    }

    res.json({
      success: true,
      data: configMap
    });
  } catch (error) {
    console.error('获取配置失败:', error);
    res.status(500).json({
      success: false,
      message: '获取配置失败'
    });
  }
});

module.exports = router;