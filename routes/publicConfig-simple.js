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

module.exports = router;