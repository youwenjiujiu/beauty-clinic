const router = require('express').Router();
const Consultant = require('../models/Consultant');

/**
 * 获取所有顾问列表（公开接口）
 * GET /api/consultants
 */
router.get('/', async (req, res) => {
  try {
    const { area, specialty, featured, status = 'active' } = req.query;

    let query = { status };

    // 按区域筛选
    if (area) {
      query.serviceAreas = area;
    }

    // 按专长筛选
    if (specialty) {
      query.specialties = specialty;
    }

    // 只显示推荐
    if (featured === 'true') {
      query.featured = true;
    }

    const consultants = await Consultant.find(query)
      .sort({ featured: -1, sortOrder: -1, rating: -1 })
      .select('-__v');

    res.json({
      success: true,
      data: consultants
    });
  } catch (error) {
    console.error('获取顾问列表失败:', error);
    res.status(500).json({
      success: false,
      message: '获取顾问列表失败'
    });
  }
});

/**
 * 获取单个顾问详情（公开接口）
 * GET /api/consultants/:id
 */
router.get('/:id', async (req, res) => {
  try {
    const consultant = await Consultant.findById(req.params.id)
      .populate('associatedClinics', 'name nameKr address district')
      .select('-__v');

    if (!consultant) {
      return res.status(404).json({
        success: false,
        message: '顾问不存在'
      });
    }

    res.json({
      success: true,
      data: consultant
    });
  } catch (error) {
    console.error('获取顾问详情失败:', error);
    res.status(500).json({
      success: false,
      message: '获取顾问详情失败'
    });
  }
});

/**
 * 创建顾问（管理员接口）
 * POST /api/consultants
 */
router.post('/', async (req, res) => {
  try {
    const consultant = new Consultant(req.body);
    await consultant.save();

    res.json({
      success: true,
      data: consultant,
      message: '顾问创建成功'
    });
  } catch (error) {
    console.error('创建顾问失败:', error);
    res.status(500).json({
      success: false,
      message: '创建顾问失败',
      error: error.message
    });
  }
});

/**
 * 更新顾问信息（管理员接口）
 * PUT /api/consultants/:id
 */
router.put('/:id', async (req, res) => {
  try {
    const consultant = await Consultant.findByIdAndUpdate(
      req.params.id,
      { ...req.body, updatedAt: Date.now() },
      { new: true, runValidators: true }
    );

    if (!consultant) {
      return res.status(404).json({
        success: false,
        message: '顾问不存在'
      });
    }

    res.json({
      success: true,
      data: consultant,
      message: '顾问信息更新成功'
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
 * 删除顾问（管理员接口）
 * DELETE /api/consultants/:id
 */
router.delete('/:id', async (req, res) => {
  try {
    const consultant = await Consultant.findByIdAndDelete(req.params.id);

    if (!consultant) {
      return res.status(404).json({
        success: false,
        message: '顾问不存在'
      });
    }

    res.json({
      success: true,
      message: '顾问删除成功'
    });
  } catch (error) {
    console.error('删除顾问失败:', error);
    res.status(500).json({
      success: false,
      message: '删除顾问失败'
    });
  }
});

/**
 * 获取推荐顾问（公开接口）
 * GET /api/consultants/featured/list
 */
router.get('/featured/list', async (req, res) => {
  try {
    const consultants = await Consultant.findFeatured()
      .limit(10)
      .select('-__v');

    res.json({
      success: true,
      data: consultants
    });
  } catch (error) {
    console.error('获取推荐顾问失败:', error);
    res.status(500).json({
      success: false,
      message: '获取推荐顾问失败'
    });
  }
});

module.exports = router;
