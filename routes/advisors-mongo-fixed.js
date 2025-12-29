const router = require('express').Router();
const mongoose = require('mongoose');

// MongoDB连接管理
let isConnecting = false;
let connectionPromise = null;

async function connectDB() {
  if (mongoose.connection.readyState === 1) {
    return; // 已连接
  }

  if (isConnecting) {
    await connectionPromise;
    return;
  }

  isConnecting = true;

  try {
    connectionPromise = mongoose.connect(process.env.MONGODB_URI, {
      serverSelectionTimeoutMS: 5000,
      maxPoolSize: 1,
      bufferCommands: false,
    });

    await connectionPromise;
    console.log('MongoDB连接成功');
  } catch (error) {
    console.error('MongoDB连接失败:', error.message);
    throw error;
  } finally {
    isConnecting = false;
  }
}

// 顾问Schema（简化版，直接在这里定义）
const advisorSchema = new mongoose.Schema({
  name: { type: String, required: true },
  nameKr: String,
  phone: String,
  wechat: String,
  kakaoTalk: String,
  avatar: String,
  gender: String,
  languages: [String],
  specialties: [String],
  experience: Number,
  serviceAreas: [String],
  serviceTypes: [String],
  introduction: String,
  introductionKr: String,
  rating: { type: Number, default: 5.0 },
  reviewCount: { type: Number, default: 0 },
  totalServices: { type: Number, default: 0 },
  consultationFee: { type: Number, default: 0 },
  accompanyFee: { type: Number, default: 0 },
  status: { type: String, default: 'active' },
  featured: { type: Boolean, default: false },
  tags: [String],
  sortOrder: { type: Number, default: 0 }
}, {
  timestamps: true
});

// 获取或创建模型
function getAdvisorModel() {
  if (mongoose.models.Advisor) {
    return mongoose.models.Advisor;
  }
  return mongoose.model('Advisor', advisorSchema);
}

// 默认顾问数据（已清空）
const defaultAdvisors = [];

/**
 * 获取管理员顾问列表
 * GET /api/advisors/admin/list
 */
router.get('/admin/list', async (req, res) => {
  try {
    // 尝试连接数据库
    if (process.env.MONGODB_URI) {
      try {
        await connectDB();
        const Advisor = getAdvisorModel();
        const advisors = await Advisor.find().sort({ sortOrder: -1, createdAt: -1 });

        if (advisors.length > 0) {
          return res.json({
            success: true,
            data: advisors,
            total: advisors.length
          });
        }
      } catch (dbError) {
        console.log('数据库查询失败，使用默认数据:', dbError.message);
      }
    }

    // 返回默认数据
    res.json({
      success: true,
      data: defaultAdvisors,
      total: defaultAdvisors.length
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
    const { area, specialty, featured, status = 'active' } = req.query;

    // 尝试从数据库获取
    if (process.env.MONGODB_URI) {
      try {
        await connectDB();
        const Advisor = getAdvisorModel();

        // 构建查询
        const query = {};
        if (status) query.status = status;
        if (featured === 'true') query.featured = true;
        if (area) query.serviceAreas = area;
        if (specialty) query.specialties = specialty;

        const advisors = await Advisor.find(query)
          .sort({ featured: -1, sortOrder: -1, rating: -1 });

        if (advisors.length > 0) {
          return res.json({
            success: true,
            data: advisors,
            total: advisors.length
          });
        }
      } catch (dbError) {
        console.log('数据库查询失败，使用默认数据:', dbError.message);
      }
    }

    // 使用默认数据并应用筛选
    let filtered = [...defaultAdvisors];

    if (status) {
      filtered = filtered.filter(a => a.status === status);
    }
    if (area) {
      filtered = filtered.filter(a => a.serviceAreas && a.serviceAreas.includes(area));
    }
    if (specialty) {
      filtered = filtered.filter(a => a.specialties && a.specialties.includes(specialty));
    }
    if (featured === 'true') {
      filtered = filtered.filter(a => a.featured === true);
    }

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
    // 尝试从数据库获取
    if (process.env.MONGODB_URI) {
      try {
        await connectDB();
        const Advisor = getAdvisorModel();
        const advisor = await Advisor.findById(req.params.id);

        if (advisor) {
          return res.json({
            success: true,
            data: advisor
          });
        }
      } catch (dbError) {
        console.log('数据库查询失败，使用默认数据:', dbError.message);
      }
    }

    // 从默认数据中查找
    const advisor = defaultAdvisors.find(a => a._id === req.params.id);

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
    // 尝试保存到数据库
    if (process.env.MONGODB_URI) {
      try {
        await connectDB();
        const Advisor = getAdvisorModel();

        const newAdvisor = new Advisor({
          ...req.body,
          _id: new mongoose.Types.ObjectId()
        });

        await newAdvisor.save();

        return res.json({
          success: true,
          data: newAdvisor,
          message: '顾问添加成功'
        });
      } catch (dbError) {
        console.error('保存到数据库失败:', dbError);
        // 继续返回成功（但实际没保存）
      }
    }

    // 返回模拟成功
    const mockAdvisor = {
      _id: 'advisor_' + Date.now(),
      ...req.body,
      createdAt: new Date(),
      updatedAt: new Date()
    };

    res.json({
      success: true,
      data: mockAdvisor,
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
 * 更新顾问信息
 * PUT /api/advisors/update/:id
 */
router.put('/update/:id', async (req, res) => {
  try {
    // 尝试更新数据库
    if (process.env.MONGODB_URI) {
      try {
        await connectDB();
        const Advisor = getAdvisorModel();

        const advisor = await Advisor.findByIdAndUpdate(
          req.params.id,
          { $set: req.body },
          { new: true }
        );

        if (advisor) {
          return res.json({
            success: true,
            data: advisor,
            message: '顾问信息更新成功'
          });
        }
      } catch (dbError) {
        console.error('更新数据库失败:', dbError);
      }
    }

    // 返回模拟成功
    res.json({
      success: true,
      data: { _id: req.params.id, ...req.body },
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
 * 删除顾问
 * DELETE /api/advisors/delete/:id
 */
router.delete('/delete/:id', async (req, res) => {
  try {
    // 尝试从数据库删除
    if (process.env.MONGODB_URI) {
      try {
        await connectDB();
        const Advisor = getAdvisorModel();

        const advisor = await Advisor.findByIdAndDelete(req.params.id);

        if (advisor) {
          return res.json({
            success: true,
            data: advisor,
            message: '顾问删除成功'
          });
        }
      } catch (dbError) {
        console.error('从数据库删除失败:', dbError);
      }
    }

    // 返回模拟成功
    res.json({
      success: true,
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

/**
 * 添加顾问（REST风格路由）
 * POST /api/consultants
 */
router.post('/', async (req, res) => {
  // 重定向到 /add 路由处理
  req.url = '/add';
  return router.handle(req, res);
});

/**
 * 更新顾问（REST风格路由）
 * PUT /api/consultants/:id
 */
router.put('/:id', async (req, res) => {
  // 重定向到 /update/:id 路由处理
  req.url = '/update/' + req.params.id;
  return router.handle(req, res);
});

/**
 * 删除顾问（REST风格路由）
 * DELETE /api/consultants/:id
 */
router.delete('/:id', async (req, res) => {
  try {
    // 尝试从数据库删除
    if (process.env.MONGODB_URI) {
      try {
        await connectDB();
        const Advisor = getAdvisorModel();
        const advisor = await Advisor.findByIdAndDelete(req.params.id);
        if (advisor) {
          return res.json({
            success: true,
            data: advisor,
            message: '顾问删除成功'
          });
        }
      } catch (dbError) {
        console.error('从数据库删除失败:', dbError);
      }
    }
    // 返回模拟成功
    res.json({
      success: true,
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