const router = require('express').Router();

// 直接导入admin配置存储
const adminConfig = require('./admin/config');

// 从admin/config共享配置存储
const getConfigStore = () => {
  // 直接使用admin配置的存储
  return adminConfig.configStore || {
    hot_searches: {
      items: [
        { keyword: '双眼皮', priority: 100, isHot: true },
        { keyword: '瘦脸针', priority: 90, isHot: true },
        { keyword: '玻尿酸', priority: 80, isHot: false }
      ]
    },
    filter_options: {
      districts: [
        // 使用与admin/config.js相同的数据结构
        { value: 'gangnam', label: '江南' },
        { value: 'sinsa', label: '新沙' },
        { value: 'apgujeong', label: '狎鸥亭' },
        { value: 'cheongdam', label: '清潭' }
      ],
      services: [
        { value: 'skin', label: '皮肤管理' },
        { value: 'plastic', label: '整形手术' },
        { value: 'injection', label: '微整形' },
        { value: 'laser', label: '激光治疗' }
      ],
      priceRanges: [
        { value: '0-100', label: '100万韩元以下' },
        { value: '100-300', label: '100-300万韩元' },
        { value: '300-500', label: '300-500万韩元' },
        { value: '500+', label: '500万韩元以上' }
      ]
    }
  };
};

/**
 * 获取筛选选项（公开接口，小程序用）
 * GET /api/config/filter-options
 */
router.get('/filter-options', async (req, res) => {
  try {
    const configStore = getConfigStore();
    const filterOptions = configStore.filter_options;

    res.json({
      success: true,
      data: filterOptions
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
 * 获取热门搜索（公开接口，小程序用）
 * GET /api/config/hot-searches
 */
router.get('/hot-searches', async (req, res) => {
  try {
    const configStore = getConfigStore();
    const hotSearches = configStore.hot_searches;

    // 按优先级排序
    const sortedItems = hotSearches.items.sort((a, b) => b.priority - a.priority);

    res.json({
      success: true,
      data: {
        keywords: sortedItems.map(item => item.keyword),
        items: sortedItems
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

module.exports = router;