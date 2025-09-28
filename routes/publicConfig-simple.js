const router = require('express').Router();

// 韩国区域数据 - 简化版本，只保留6个主要区作为示例
const districtsData = [
  {
    value: 'gangnam-gu',
    label: '江南区',
    labelKr: '강남구',
    children: [
      { value: 'gangnam', label: '江南站', labelKr: '강남역' },
      { value: 'sinsa', label: '新沙洞', labelKr: '신사동' },
      { value: 'apgujeong', label: '狎鸥亭', labelKr: '압구정' },
      { value: 'cheongdam', label: '清潭洞', labelKr: '청담동' },
      { value: 'yeoksam', label: '驿三洞', labelKr: '역삼동' },
      { value: 'daechi', label: '大峙洞', labelKr: '대치동' }
    ]
  },
  {
    value: 'seocho-gu',
    label: '瑞草区',
    labelKr: '서초구',
    children: [
      { value: 'seocho', label: '瑞草洞', labelKr: '서초동' },
      { value: 'bangbae', label: '方背洞', labelKr: '방배동' },
      { value: 'yangjae', label: '良才洞', labelKr: '양재동' },
      { value: 'banpo', label: '盘浦洞', labelKr: '반포동' }
    ]
  },
  {
    value: 'mapo-gu',
    label: '麻浦区',
    labelKr: '마포구',
    children: [
      { value: 'hongdae', label: '弘大', labelKr: '홍대' },
      { value: 'sinchon', label: '新村', labelKr: '신촌' },
      { value: 'hapjeong', label: '合井', labelKr: '합정' },
      { value: 'sangsu', label: '上水', labelKr: '상수' }
    ]
  },
  {
    value: 'jung-gu',
    label: '中区',
    labelKr: '중구',
    children: [
      { value: 'myeongdong', label: '明洞', labelKr: '명동' },
      { value: 'euljiro', label: '乙支路', labelKr: '을지로' },
      { value: 'chungmuro', label: '忠武路', labelKr: '충무로' },
      { value: 'namdaemun', label: '南大门', labelKr: '남대문' }
    ]
  },
  {
    value: 'yongsan-gu',
    label: '龙山区',
    labelKr: '용산구',
    children: [
      { value: 'itaewon', label: '梨泰院', labelKr: '이태원' },
      { value: 'hannam', label: '汉南洞', labelKr: '한남동' },
      { value: 'huam', label: '厚岩洞', labelKr: '후암동' }
    ]
  },
  {
    value: 'songpa-gu',
    label: '松坡区',
    labelKr: '송파구',
    children: [
      { value: 'jamsil', label: '蚕室', labelKr: '잠실' },
      { value: 'songpa', label: '松坡洞', labelKr: '송파동' },
      { value: 'garak', label: '可乐洞', labelKr: '가락동' },
      { value: 'munjeong', label: '文井洞', labelKr: '문정동' }
    ]
  }
];

/**
 * 获取筛选选项（公开接口，小程序用）
 * GET /api/config/filter-options
 */
router.get('/filter-options', async (req, res) => {
  try {
    res.json({
      success: true,
      data: {
        districts: districtsData,
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
    });
  } catch (error) {
    console.error('获取筛选选项失败:', error);
    res.status(500).json({
      success: false,
      message: '获取筛选选项失败',
      error: error.message
    });
  }
});

/**
 * 获取热门搜索（公开接口，小程序用）
 * GET /api/config/hot-searches
 */
router.get('/hot-searches', async (req, res) => {
  try {
    const hotSearches = [
      { keyword: '双眼皮', priority: 100, isHot: true },
      { keyword: '瘦脸针', priority: 90, isHot: true },
      { keyword: '玻尿酸', priority: 80, isHot: false },
      { keyword: '隆鼻', priority: 70, isHot: true }
    ];

    res.json({
      success: true,
      data: {
        keywords: hotSearches.map(item => item.keyword),
        items: hotSearches
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
 * 获取轮播图（公开接口，小程序用）
 * GET /api/config/banners
 */
router.get('/banners', async (req, res) => {
  try {
    const banners = [
      {
        id: 1,
        imageUrl: 'https://example.com/banner1.jpg',
        title: '新年特惠活动',
        link: '/promotion/newyear',
        sortOrder: 1,
        isActive: true
      },
      {
        id: 2,
        imageUrl: 'https://example.com/banner2.jpg',
        title: '江南区旗舰店开业',
        link: '/clinic/gangnam-flagship',
        sortOrder: 2,
        isActive: true
      },
      {
        id: 3,
        imageUrl: 'https://example.com/banner3.jpg',
        title: '双眼皮手术特价',
        link: '/service/double-eyelid',
        sortOrder: 3,
        isActive: true
      }
    ];

    res.json({
      success: true,
      data: {
        items: banners.filter(b => b.isActive).sort((a, b) => a.sortOrder - b.sortOrder)
      }
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
 * 获取服务项目（公开接口，小程序用）
 * GET /api/config/services
 */
router.get('/services', async (req, res) => {
  try {
    const services = [
      {
        id: 1,
        name: '双眼皮手术',
        nameKr: '쌍꺼풀 수술',
        category: '整形手术',
        description: '精细双眼皮成形术，打造自然迷人双眼',
        priceRange: '150-300万韩元',
        duration: 60,
        isHot: true
      },
      {
        id: 2,
        name: '玻尿酸注射',
        nameKr: '히알루론산 주사',
        category: '微整形',
        description: '面部填充塑形，改善皱纹和轮廓',
        priceRange: '50-150万韩元',
        duration: 30,
        isHot: true
      },
      {
        id: 3,
        name: '激光美白',
        nameKr: '레이저 미백',
        category: '激光治疗',
        description: '改善肤色均匀度，提亮肤色',
        priceRange: '80-200万韩元',
        duration: 45,
        isHot: false
      },
      {
        id: 4,
        name: '皮肤管理',
        nameKr: '피부 관리',
        category: '皮肤管理',
        description: '深层清洁保养，改善肌肤状态',
        priceRange: '30-80万韩元',
        duration: 90,
        isHot: false
      },
      {
        id: 5,
        name: '瘦脸针',
        nameKr: '보톡스',
        category: '微整形',
        description: '瘦脸塑形，改善咬肌肥大',
        priceRange: '100-200万韩元',
        duration: 20,
        isHot: true
      },
      {
        id: 6,
        name: '隆鼻手术',
        nameKr: '코 성형',
        category: '整形手术',
        description: '鼻部综合整形，打造精致鼻型',
        priceRange: '300-500万韩元',
        duration: 120,
        isHot: true
      },
      {
        id: 7,
        name: '祛斑治疗',
        nameKr: '기미 치료',
        category: '激光治疗',
        description: '淡化色斑，均匀肤色',
        priceRange: '100-250万韩元',
        duration: 60,
        isHot: false
      },
      {
        id: 8,
        name: '水光针',
        nameKr: '수광 주사',
        category: '皮肤管理',
        description: '深层补水，改善肌肤弹性',
        priceRange: '50-120万韩元',
        duration: 40,
        isHot: true
      }
    ];

    res.json({
      success: true,
      data: {
        items: services,
        categories: [...new Set(services.map(s => s.category))],
        hotServices: services.filter(s => s.isHot)
      }
    });
  } catch (error) {
    console.error('获取服务项目失败:', error);
    res.status(500).json({
      success: false,
      message: '获取服务项目失败'
    });
  }
});

module.exports = router;