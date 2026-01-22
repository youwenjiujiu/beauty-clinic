const router = require('express').Router();
const Config = require('../models/Config');

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
    // 从环境变量获取模式
    // 默认使用 review 模式（安全第一，审核通过后设置 APP_MODE=production）
    const envValue = process.env.APP_MODE;
    let mode = envValue || 'review';

    // 验证模式值
    if (!['review', 'production'].includes(mode)) {
      mode = 'review'; // 无效值时默认审核模式
    }

    console.log(`[模式查询] 环境变量APP_MODE: ${envValue}, 当前模式: ${mode}`);

    res.json({
      success: true,
      mode: mode,
      envValue: envValue || '(未设置)',
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
 * 获取文案映射配置（公开接口）
 * GET /api/config/texts
 *
 * 根据当前模式返回不同的文案
 * - review模式：返回空对象（使用前端默认文案）
 * - production模式：返回实际业务文案
 */
router.get('/texts', async (req, res) => {
  try {
    const mode = process.env.APP_MODE || 'review';

    if (mode === 'review') {
      // 审核模式：返回空配置，使用前端默认文案
      res.json({
        success: true,
        data: {},
        message: '使用默认文案'
      });
      return;
    }

    // 生产模式：返回实际业务文案
    const productionTexts = {
      // 机构相关
      institution: '诊所',
      institutions: '诊所',
      clinic: '诊所',
      clinics: '诊所',
      hospital: '医院',

      // 专业人员
      doctor: '医生',
      doctors: '医生团队',
      professional: '医疗工作者',
      consultant: '面诊医生',

      // 服务相关
      medical: '医美',
      surgery: '整形手术',
      treatment: '治疗项目',
      consultation: '面诊',
      appointment: '预约',

      // 地区相关
      country: '韩国',
      city: '首尔',
      district: '区域',
      area: '地区',

      // 分类相关
      beauty: '医美',
      cosmetic: '整形',
      aesthetic: '美容国',

      // 具体服务
      eyes: '双眼皮',
      nose: '隆鼻',
      face: '轮廓',
      skin: '皮肤管理',
      plastic: '整形手术',
      injection: '注射',
      laser: '激光提升',
      body: '身体塑形',
      antiaging: '抗衰老',

      // 货币
      currency: '韩元',
      priceUnit: '万韩元',

      // 操作
      book: '预约',
      consult: '面诊',
      compare: '对比',
      search: '搜索',

      // 页面文案
      searchPlaceholder: '搜索诊所、医生、项目...',
      loadingText: '加载中...',
      emptyText: '暂无诊所',
      retryText: '重试',
    };

    res.json({
      success: true,
      data: productionTexts,
      message: '文案配置加载成功'
    });

  } catch (error) {
    console.error('获取文案配置失败:', error);
    res.json({
      success: true,
      data: {}, // 失败时返回空对象，使用默认文案
      message: '配置加载失败'
    });
  }
});

// 专科分类数据 - 审核模式（通用安全内容）
const reviewSpecialtiesData = [
  { id: 'skin', name: '皮肤管理', icon: '🧴', order: 1 },
  { id: 'plastic', name: '整形手术', icon: '💉', order: 2 },
  { id: 'injection', name: '微整形', icon: '💊', order: 3 },
  { id: 'laser', name: '激光提升', icon: '✨', order: 4 },
  { id: 'body', name: '身体塑形', icon: '💪', order: 5 },
  { id: 'antiaging', name: '抗衰老', icon: '🌟', order: 6 }
];

// 专科分类数据 - 生产模式（后台管理配置的完整专长列表）
const productionSpecialtiesData = [
  { id: 'skin-care', name: '皮肤管理', icon: '🧴', order: 1 },
  { id: 'skin-treatment', name: '皮肤治疗', icon: '💆', order: 2 },
  { id: 'laser', name: '激光提升', icon: '✨', order: 3 },
  { id: 'thread', name: '线雕', icon: '🧵', order: 4 },
  { id: 'filler', name: '填充', icon: '💉', order: 5 },
  { id: 'botox', name: '肉毒', icon: '💊', order: 6 },
  { id: 'body-filler', name: '身体填充', icon: '💪', order: 7 },
  { id: 'eye', name: '眼部整形', icon: '👁️', order: 8 },
  { id: 'nose', name: '鼻部整形', icon: '👃', order: 9 },
  { id: 'contour', name: '轮廓', icon: '🎭', order: 10 },
  { id: 'jaw', name: '双鄂', icon: '🦷', order: 11 },
  { id: 'breast', name: '胸部整形', icon: '🌸', order: 12 },
  { id: 'female', name: '女性私密', icon: '🌺', order: 13 },
  { id: 'male', name: '男性整形', icon: '👨', order: 14 },
  { id: 'dental-eye', name: '牙科/眼科', icon: '🦷', order: 15 },
  { id: 'hair', name: '毛发管理/移植', icon: '💇', order: 16 },
  { id: 'fat', name: '脂肪移植/吸', icon: '✂️', order: 17 }
];

// 兼容旧代码的变量（默认使用审核模式数据）
let specialtiesData = reviewSpecialtiesData;

// 韩国区域数据 - 与后台管理配置保持一致
const districtsData = [
  {
    value: 'seoul',
    label: '首尔',
    labelKr: '서울',
    children: [
      { value: 'gangnam-gu', label: '江南区', labelKr: '강남구' },
      { value: 'seocho-gu', label: '瑞草区', labelKr: '서초구' },
      { value: 'sinsa', label: '新沙洞', labelKr: '신사동' },
      { value: 'apgujeong', label: '狎鸥亭', labelKr: '압구정' },
      { value: 'cheongdam', label: '清潭洞', labelKr: '청담동' },
      { value: 'myeongdong', label: '明洞', labelKr: '명동' },
      { value: 'mapo-gu', label: '麻浦区', labelKr: '마포구' },
      { value: 'hongdae', label: '弘大', labelKr: '홍대' },
      { value: 'yongsan-gu', label: '龙山区', labelKr: '용산구' },
      { value: 'itaewon', label: '梨泰院', labelKr: '이태원' },
      { value: 'yeongdeungpo', label: '永登浦', labelKr: '영등포' },
      { value: 'yeouido', label: '汝矣岛', labelKr: '여의도' },
      { value: 'dongdaemun', label: '东大门', labelKr: '동대문' },
      { value: 'jongno-gu', label: '钟路区', labelKr: '종로구' },
      { value: 'songpa-gu', label: '松坡区', labelKr: '송파구' }
    ]
  },
  {
    value: 'other-cities',
    label: '其他城市',
    labelKr: '기타 도시',
    children: [
      { value: 'incheon', label: '仁川', labelKr: '인천' },
      { value: 'jeju', label: '济州', labelKr: '제주' }
    ]
  }
];

/**
 * 获取筛选选项（公开接口，小程序用）
 * GET /api/config/filter-options
 *
 * 根据模式返回不同数据：
 * - review: 返回通用区域数据
 * - production: 返回韩国区域数据
 */
router.get('/filter-options', async (req, res) => {
  try {
    const mode = process.env.APP_MODE || 'review';

    let districts = [];
    let priceRanges = [];
    let city = '';
    let currentSpecialties = [];

    if (mode === 'review') {
      // 审核模式：通用安全内容
      city = '本地';
      currentSpecialties = reviewSpecialtiesData;
      districts = [
        {
          value: 'area1',
          label: '中心区',
          children: [
            { value: 'center1', label: '商务中心' },
            { value: 'center2', label: '文化中心' }
          ]
        },
        {
          value: 'area2',
          label: '东区',
          children: [
            { value: 'east1', label: '科技园区' },
            { value: 'east2', label: '教育区' }
          ]
        }
      ];

      priceRanges = [
        { value: '0-100', label: '100元以下' },
        { value: '100-300', label: '100-300元' },
        { value: '300-500', label: '300-500元' },
        { value: '500+', label: '500元以上' }
      ];
    } else {
      // 生产模式：使用后台配置的完整专长列表
      city = '首尔';
      currentSpecialties = productionSpecialtiesData;
      districts = districtsData;
      priceRanges = [
        { value: '0-100', label: '100万韩元以下' },
        { value: '100-300', label: '100-300万韩元' },
        { value: '300-500', label: '300-500万韩元' },
        { value: '500+', label: '500万韩元以上' }
      ];
    }

    res.json({
      success: true,
      data: {
        city: city,
        districts: districts,
        services: currentSpecialties.map(s => ({ value: s.id, label: s.name })),
        specialties: currentSpecialties,
        priceRanges: priceRanges
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
 * 获取联系方式配置（公开接口，小程序用）
 * GET /api/config/contact
 *
 * 数据持久化到MongoDB
 */
// 默认联系方式配置
const defaultContactConfig = {
  qrCodeImage: '',  // 客服二维码图片URL
  wechatId: 'xiaohanmeimei_service',  // 客服微信号
  phone: '',  // 联系电话（可选）
  workTime: '10:00-22:00'  // 工作时间
};

router.get('/contact', async (req, res) => {
  try {
    // 从数据库获取联系方式配置
    let config = await Config.findOne({ type: 'contact_info' });

    if (config && config.content) {
      res.json({
        success: true,
        data: config.content
      });
    } else {
      // 没有配置时返回默认值
      res.json({
        success: true,
        data: defaultContactConfig
      });
    }
  } catch (error) {
    console.error('获取联系方式配置失败:', error);
    // 出错时返回默认配置
    res.json({
      success: true,
      data: defaultContactConfig
    });
  }
});

// 更新联系方式配置（需要管理员权限）
router.post('/contact', async (req, res) => {
  try {
    const { qrCodeImage, wechatId, phone, workTime } = req.body;

    // 构建更新内容
    const contactData = {
      qrCodeImage: qrCodeImage || '',
      wechatId: wechatId || 'xiaohanmeimei_service',
      phone: phone || '',
      workTime: workTime || '10:00-22:00'
    };

    // 使用upsert保存到数据库
    const config = await Config.findOneAndUpdate(
      { type: 'contact_info' },
      {
        type: 'contact_info',
        name: '联系方式配置',
        content: contactData,
        isActive: true,
        updatedAt: new Date()
      },
      { upsert: true, new: true }
    );

    console.log('联系方式配置已保存到数据库:', contactData.qrCodeImage ? '有二维码' : '无二维码');

    res.json({
      success: true,
      data: config.content,
      message: '联系方式配置已更新并持久化'
    });
  } catch (error) {
    console.error('更新联系方式配置失败:', error);
    res.status(500).json({
      success: false,
      message: '更新联系方式配置失败: ' + error.message
    });
  }
});

/**
 * 获取服务分类（公开接口，小程序用）
 * GET /api/config/categories
 */
// 服务分类数据（主页图标和筛选分类共用）
let categoriesStore = [
  { id: 'skin', name: '皮肤管理', icon: '🧴', order: 1, type: 'both' },
  { id: 'plastic', name: '整形手术', icon: '💉', order: 2, type: 'both' },
  { id: 'injection', name: '填充', icon: '💊', order: 3, type: 'both' },
  { id: 'laser', name: '激光提升', icon: '✨', order: 4, type: 'both' },
  { id: 'body', name: '身体塑形', icon: '💪', order: 5, type: 'filter' },
  { id: 'antiaging', name: '抗衰老', icon: '🌟', order: 6, type: 'filter' }
];

router.get('/categories', async (req, res) => {
  try {
    const { type = 'all' } = req.query;
    let categories = [...categoriesStore];

    // 根据类型过滤
    if (type === 'home') {
      // 主页图标只显示both和home类型
      categories = categories.filter(c => c.type === 'both' || c.type === 'home');
    } else if (type === 'filter') {
      // 筛选分类显示both和filter类型
      categories = categories.filter(c => c.type === 'both' || c.type === 'filter');
    }

    // 按order排序
    categories.sort((a, b) => a.order - b.order);

    res.json({
      success: true,
      data: categories
    });
  } catch (error) {
    console.error('获取服务分类失败:', error);
    res.status(500).json({
      success: false,
      message: '获取服务分类失败'
    });
  }
});

/**
 * 添加/更新分类（管理员）
 * POST /api/config/categories
 */
router.post('/categories', async (req, res) => {
  try {
    const { categories } = req.body;
    if (!categories || !Array.isArray(categories)) {
      return res.status(400).json({
        success: false,
        message: '分类数据格式不正确'
      });
    }

    categoriesStore = categories;

    res.json({
      success: true,
      message: '分类更新成功',
      data: categoriesStore
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      message: '更新分类失败',
      error: error.message
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
        category: '激光提升',
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
        category: '激光提升',
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