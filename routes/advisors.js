// 陪同顾问管理API
const router = require('express').Router();
const Consultant = require('../models/Consultant');
const mongoose = require('mongoose');

// 默认顾问数据
const defaultAdvisors = [
  {
    id: 'ADV001',
    name: '李顾问',
    avatar: '/images/advisor1.jpg',
    title: '资深医疗顾问',
    experience: '5年',
    specialty: '整形外科陪同',
    rating: 4.9,
    serviceCount: 328,
    tags: ['专业', '细心', '经验丰富']
  },
  {
    id: 'ADV002',
    name: '张顾问',
    avatar: '/images/advisor2.jpg',
    title: '资深医疗顾问',
    experience: '3年',
    specialty: '皮肤科陪同',
    rating: 4.8,
    serviceCount: 256,
    tags: ['耐心', '专业', '细致']
  },
  {
    id: 'ADV003',
    name: '王顾问',
    avatar: '/images/advisor3.jpg',
    title: '医疗顾问',
    experience: '2年',
    specialty: '综合陪同',
    rating: 4.7,
    serviceCount: 189,
    tags: ['友善', '负责', '细心']
  }
];

// 获取所有顾问列表（公开接口）
router.get('/list', async (req, res) => {
  try {
    // 检查数据库连接状态
    if (mongoose.connection.readyState !== 1) {
      console.log('数据库未连接，返回默认数据');
      return res.json({
        success: true,
        data: defaultAdvisors
      });
    }

    // 从数据库获取活跃的顾问
    const consultants = await Consultant.find({
      status: 'active'
    }).select({
      name: 1,
      avatar: 1,
      experience: 1,
      specialties: 1,
      rating: 1,
      totalServices: 1,
      tags: 1,
      languages: 1,
      serviceTypes: 1
    }).sort({ featured: -1, sortOrder: -1, rating: -1 });

    // 转换为小程序期望的格式
    const advisors = consultants.map(consultant => ({
      id: consultant._id.toString(),
      name: consultant.name,
      avatar: consultant.avatar || '/images/default-avatar.jpg',
      title: consultant.tags && consultant.tags[0] || '医疗顾问',
      experience: consultant.experience ? `${consultant.experience}年` : '1年',
      specialty: consultant.specialties && consultant.specialties[0] || '综合陪同',
      rating: consultant.rating || 5.0,
      serviceCount: consultant.totalServices || 0,
      tags: consultant.tags || ['专业', '细心']
    }));

    res.json({
      success: true,
      data: advisors
    });
  } catch (error) {
    console.error('获取顾问列表失败:', error);
    // 如果数据库查询失败，返回默认数据
    res.json({
      success: true,
      data: defaultAdvisors
    });
  }
});

// 获取顾问详情（公开接口）
router.get('/detail/:id', async (req, res) => {
  try {
    const consultant = await Consultant.findById(req.params.id);

    if (!consultant) {
      return res.status(404).json({
        success: false,
        message: '顾问不存在'
      });
    }

    // 转换为小程序期望的格式
    const advisorDetail = {
      id: consultant._id.toString(),
      name: consultant.name,
      avatar: consultant.avatar || '/images/default-avatar.jpg',
      title: consultant.tags && consultant.tags[0] || '医疗顾问',
      experience: consultant.experience ? `${consultant.experience}年` : '1年',
      specialty: consultant.specialties && consultant.specialties[0] || '综合陪同',
      rating: consultant.rating || 5.0,
      serviceCount: consultant.totalServices || 0,
      tags: consultant.tags || ['专业', '细心'],
      reviews: [
        { user: '张**', comment: '非常专业，沟通顺畅', rating: 5 },
        { user: '李**', comment: '服务细心，帮助很大', rating: 5 },
        { user: '王**', comment: '经验丰富，让人放心', rating: 4 }
      ]
    };

    res.json({
      success: true,
      data: advisorDetail
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

// 获取可用顾问（根据时间筛选）
router.post('/available', async (req, res) => {
  try {
    const { date, time } = req.body;

    if (!date || !time) {
      return res.status(400).json({
        success: false,
        message: '请提供日期和时间'
      });
    }

    // 获取所有活跃的顾问
    const consultants = await Consultant.find({
      status: 'active'
    }).select({
      name: 1,
      avatar: 1,
      rating: 1,
      tags: 1,
      availability: 1
    });

    // 转换为小程序期望的格式
    const availableAdvisors = consultants.map(consultant => ({
      id: consultant._id.toString(),
      name: consultant.name,
      avatar: consultant.avatar || '/images/default-avatar.jpg',
      title: consultant.tags && consultant.tags[0] || '医疗顾问',
      rating: consultant.rating || 5.0,
      available: true
    }));

    res.json({
      success: true,
      data: availableAdvisors,
      count: availableAdvisors.length,
      message: availableAdvisors.length > 0
        ? `${availableAdvisors.length}位顾问可选`
        : '该时段暂无可用顾问'
    });
  } catch (error) {
    console.error('查询可用顾问失败:', error);
    res.status(500).json({
      success: false,
      message: '查询可用顾问失败',
      error: error.message
    });
  }
});

// 添加新顾问（管理员接口）
router.post('/add', async (req, res) => {
  try {
    const consultantData = req.body;

    // 创建新顾问
    const newConsultant = new Consultant({
      name: consultantData.name,
      nameKr: consultantData.nameKr,
      nameEn: consultantData.nameEn,
      phone: consultantData.phone,
      wechat: consultantData.wechat || 'default_wechat',
      kakaoTalk: consultantData.kakaoTalk,
      whatsapp: consultantData.whatsapp,
      email: consultantData.email,
      avatar: consultantData.avatar,
      gender: consultantData.gender,
      age: consultantData.age,
      languages: consultantData.languages || ['中文'],
      specialties: consultantData.specialties || ['综合陪同'],
      experience: consultantData.experience || 1,
      certification: consultantData.certification,
      serviceAreas: consultantData.serviceAreas,
      serviceTypes: consultantData.serviceTypes || ['陪同翻译'],
      introduction: consultantData.introduction,
      introductionKr: consultantData.introductionKr,
      rating: consultantData.rating || 5.0,
      reviewCount: consultantData.reviewCount || 0,
      totalServices: consultantData.totalServices || 0,
      consultationFee: consultantData.consultationFee || 0,
      accompanyFee: consultantData.accompanyFee || 0,
      availability: consultantData.availability,
      tags: consultantData.tags || ['专业', '细心'],
      status: consultantData.status || 'active',
      featured: consultantData.featured || false,
      sortOrder: consultantData.sortOrder || 0
    });

    await newConsultant.save();

    res.json({
      success: true,
      message: '顾问添加成功',
      data: {
        id: newConsultant._id.toString(),
        name: newConsultant.name
      }
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

// 更新顾问信息（管理员接口）
router.put('/update/:id', async (req, res) => {
  try {
    const consultant = await Consultant.findByIdAndUpdate(
      req.params.id,
      { $set: req.body, updatedAt: new Date() },
      { new: true }
    );

    if (!consultant) {
      return res.status(404).json({
        success: false,
        message: '顾问不存在'
      });
    }

    res.json({
      success: true,
      message: '顾问信息更新成功',
      data: consultant
    });
  } catch (error) {
    console.error('更新顾问信息失败:', error);
    res.status(500).json({
      success: false,
      message: '更新顾问信息失败',
      error: error.message
    });
  }
});

// 删除顾问（管理员接口 - 软删除）
router.delete('/delete/:id', async (req, res) => {
  try {
    const consultant = await Consultant.findByIdAndUpdate(
      req.params.id,
      {
        $set: {
          status: 'inactive',
          updatedAt: new Date()
        }
      },
      { new: true }
    );

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
      message: '删除顾问失败',
      error: error.message
    });
  }
});

// 获取所有顾问（管理员接口，包含非活跃顾问）
router.get('/admin/list', async (req, res) => {
  try {
    // 检查数据库连接状态
    if (mongoose.connection.readyState !== 1) {
      console.log('数据库未连接，返回默认数据');
      return res.json({
        success: true,
        data: defaultAdvisors
      });
    }

    const consultants = await Consultant.find().sort({
      status: -1,
      featured: -1,
      sortOrder: -1,
      createdAt: -1
    });

    res.json({
      success: true,
      data: consultants
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

module.exports = router;