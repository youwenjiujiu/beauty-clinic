// 陪同顾问管理API
const router = require('express').Router();

// 内存存储（适用于Vercel）
let advisorsStore = [
  {
    id: 'ADV001',
    name: '李顾问',
    avatar: '/images/advisor1.jpg',
    title: '资深医疗顾问',
    experience: '5年',
    specialty: '整形外科陪同',
    rating: 4.9,
    serviceCount: 328,
    tags: ['专业', '细心', '经验丰富'],
    // 内部字段（不对外显示）
    internal: {
      languages: ['zh', 'kr'],
      type: 'senior'
    },
    // 排班信息
    schedule: [],
    status: 'active'
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
    tags: ['耐心', '专业', '细致'],
    internal: {
      languages: ['zh', 'kr'],
      type: 'senior'
    },
    schedule: [],
    status: 'active'
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
    tags: ['友善', '负责', '细心'],
    internal: {
      languages: ['zh', 'kr'],
      type: 'senior'
    },
    schedule: [],
    status: 'active'
  }
];

// 排班存储
let schedulesStore = {};

// 获取所有顾问列表（公开接口）
router.get('/list', (req, res) => {
  try {
    // 过滤掉内部信息，只返回公开信息
    const publicAdvisors = advisorsStore
      .filter(a => a.status === 'active')
      .map(advisor => ({
        id: advisor.id,
        name: advisor.name,
        avatar: advisor.avatar,
        title: advisor.title,
        experience: advisor.experience,
        specialty: advisor.specialty,
        rating: advisor.rating,
        serviceCount: advisor.serviceCount,
        tags: advisor.tags
      }));

    res.json({
      success: true,
      data: publicAdvisors
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      message: '获取顾问列表失败',
      error: error.message
    });
  }
});

// 获取顾问详情（公开接口）
router.get('/detail/:id', (req, res) => {
  try {
    const advisor = advisorsStore.find(a => a.id === req.params.id);

    if (!advisor) {
      return res.status(404).json({
        success: false,
        message: '顾问不存在'
      });
    }

    // 过滤内部信息
    const publicInfo = {
      id: advisor.id,
      name: advisor.name,
      avatar: advisor.avatar,
      title: advisor.title,
      experience: advisor.experience,
      specialty: advisor.specialty,
      rating: advisor.rating,
      serviceCount: advisor.serviceCount,
      tags: advisor.tags,
      reviews: [
        { user: '张**', comment: '非常专业，沟通顺畅', rating: 5 },
        { user: '李**', comment: '服务细心，帮助很大', rating: 5 },
        { user: '王**', comment: '经验丰富，让人放心', rating: 4 }
      ]
    };

    res.json({
      success: true,
      data: publicInfo
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      message: '获取顾问详情失败',
      error: error.message
    });
  }
});

// 获取可用顾问（根据时间筛选）
router.post('/available', (req, res) => {
  try {
    const { date, time } = req.body;

    if (!date || !time) {
      return res.status(400).json({
        success: false,
        message: '请提供日期和时间'
      });
    }

    // 查找该时间段可用的顾问
    const availableAdvisors = advisorsStore.filter(advisor => {
      if (advisor.status !== 'active') return false;

      // 检查该顾问在这个时间是否有排班
      const scheduleKey = `${advisor.id}_${date}`;
      const daySchedule = schedulesStore[scheduleKey];

      if (!daySchedule) {
        // 如果没有设置排班，默认可用
        return true;
      }

      // 检查具体时间段
      const timeSlot = daySchedule.find(s => s.time === time);
      return timeSlot ? timeSlot.available : false;
    });

    // 返回可用顾问的公开信息
    const publicAdvisors = availableAdvisors.map(advisor => ({
      id: advisor.id,
      name: advisor.name,
      avatar: advisor.avatar,
      title: advisor.title,
      rating: advisor.rating,
      available: true
    }));

    res.json({
      success: true,
      data: publicAdvisors,
      count: publicAdvisors.length,
      message: publicAdvisors.length > 0
        ? `${publicAdvisors.length}位顾问可选`
        : '该时段暂无可用顾问'
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      message: '查询可用顾问失败',
      error: error.message
    });
  }
});

// 设置顾问排班（管理员接口）
router.post('/schedule', (req, res) => {
  try {
    const { advisorId, date, slots } = req.body;

    if (!advisorId || !date || !slots) {
      return res.status(400).json({
        success: false,
        message: '请提供完整的排班信息'
      });
    }

    const advisor = advisorsStore.find(a => a.id === advisorId);
    if (!advisor) {
      return res.status(404).json({
        success: false,
        message: '顾问不存在'
      });
    }

    // 存储排班信息
    const scheduleKey = `${advisorId}_${date}`;
    schedulesStore[scheduleKey] = slots;

    res.json({
      success: true,
      message: '排班设置成功',
      data: {
        advisorId,
        date,
        slots
      }
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      message: '设置排班失败',
      error: error.message
    });
  }
});

// 获取顾问排班（管理员接口）
router.get('/schedule/:advisorId', (req, res) => {
  try {
    const { advisorId } = req.params;
    const { startDate, endDate } = req.query;

    const advisor = advisorsStore.find(a => a.id === advisorId);
    if (!advisor) {
      return res.status(404).json({
        success: false,
        message: '顾问不存在'
      });
    }

    // 获取指定日期范围的排班
    const schedules = {};
    Object.keys(schedulesStore).forEach(key => {
      if (key.startsWith(`${advisorId}_`)) {
        const date = key.split('_')[1];
        schedules[date] = schedulesStore[key];
      }
    });

    res.json({
      success: true,
      data: {
        advisorId,
        advisorName: advisor.name,
        schedules
      }
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      message: '获取排班失败',
      error: error.message
    });
  }
});

// 添加新顾问（管理员接口）
router.post('/add', (req, res) => {
  try {
    const { name, title, experience, specialty, tags, languages } = req.body;

    if (!name || !title) {
      return res.status(400).json({
        success: false,
        message: '请提供顾问姓名和职称'
      });
    }

    const newAdvisor = {
      id: `ADV${String(advisorsStore.length + 1).padStart(3, '0')}`,
      name,
      avatar: '/images/default-avatar.jpg',
      title: title || '医疗顾问',
      experience: experience || '1年',
      specialty: specialty || '综合陪同',
      rating: 5.0,
      serviceCount: 0,
      tags: tags || ['专业', '细心'],
      internal: {
        languages: languages || ['zh', 'kr'],
        type: 'senior'
      },
      schedule: [],
      status: 'active'
    };

    advisorsStore.push(newAdvisor);

    res.json({
      success: true,
      message: '顾问添加成功',
      data: {
        id: newAdvisor.id,
        name: newAdvisor.name
      }
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      message: '添加顾问失败',
      error: error.message
    });
  }
});

// 更新顾问信息（管理员接口）
router.put('/update/:id', (req, res) => {
  try {
    const advisorIndex = advisorsStore.findIndex(a => a.id === req.params.id);

    if (advisorIndex === -1) {
      return res.status(404).json({
        success: false,
        message: '顾问不存在'
      });
    }

    advisorsStore[advisorIndex] = {
      ...advisorsStore[advisorIndex],
      ...req.body,
      id: advisorsStore[advisorIndex].id // 保持ID不变
    };

    res.json({
      success: true,
      message: '顾问信息更新成功'
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      message: '更新顾问信息失败',
      error: error.message
    });
  }
});

// 删除顾问（管理员接口）
router.delete('/delete/:id', (req, res) => {
  try {
    const index = advisorsStore.findIndex(a => a.id === req.params.id);

    if (index === -1) {
      return res.status(404).json({
        success: false,
        message: '顾问不存在'
      });
    }

    // 软删除，只改变状态
    advisorsStore[index].status = 'inactive';

    res.json({
      success: true,
      message: '顾问删除成功'
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      message: '删除顾问失败',
      error: error.message
    });
  }
});

module.exports = router;