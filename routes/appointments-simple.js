const router = require('express').Router();
const { verifyToken } = require('../middleware/auth');

// 内存存储（用于Vercel环境）
let appointmentsStore = [];
let nextAppointmentId = 1;

// 初始化一些示例预约数据
function initializeAppointments() {
  appointmentsStore = [
    {
      _id: 'apt_001',
      userId: 'test_user',
      clinicId: 'dr-petit',
      clinicName: 'Dr.Petit整形外科',
      service: '双眼皮手术',
      appointmentDate: '2024-12-20',
      appointmentTime: '14:00',
      status: 'completed',
      userName: '测试用户',
      userPhone: '13800138000',
      createTime: new Date('2024-12-01'),
      completeTime: new Date('2024-12-20')
    },
    {
      _id: 'apt_002',
      userId: 'test_user',
      clinicId: 'grand',
      clinicName: 'Grand整形外科',
      service: '面部轮廓',
      appointmentDate: '2024-12-25',
      appointmentTime: '10:00',
      status: 'confirmed',
      userName: '测试用户',
      userPhone: '13800138000',
      createTime: new Date('2024-12-10')
    }
  ];
}

// 初始化数据
initializeAppointments();

/**
 * 检查用户是否在指定诊所有预约记录
 * POST /api/appointments/check
 */
router.post('/check', async (req, res) => {
  try {
    const { userId, clinicId } = req.body;

    if (!userId || !clinicId) {
      return res.status(400).json({
        success: false,
        message: '缺少必要参数'
      });
    }

    // 查找用户在该诊所的预约记录
    const appointments = appointmentsStore.filter(apt =>
      apt.userId === userId &&
      apt.clinicId === clinicId
    );

    if (appointments.length === 0) {
      return res.json({
        success: true,
        hasAppointment: false,
        message: '没有预约记录'
      });
    }

    // 找出最新的预约记录
    const latestAppointment = appointments.sort((a, b) =>
      new Date(b.createTime) - new Date(a.createTime)
    )[0];

    // 判断是否可以反馈（只有completed状态才能反馈）
    const canFeedback = latestAppointment.status === 'completed';

    res.json({
      success: true,
      hasAppointment: true,
      appointmentStatus: latestAppointment.status,
      canFeedback: canFeedback,
      appointmentId: latestAppointment._id,
      appointmentDate: latestAppointment.appointmentDate,
      service: latestAppointment.service
    });
  } catch (error) {
    console.error('检查预约记录失败:', error);
    res.status(500).json({
      success: false,
      message: '检查预约记录失败',
      error: error.message
    });
  }
});

/**
 * 获取所有预约列表
 * GET /api/appointments
 */
router.get('/', verifyToken, async (req, res) => {
  try {
    const { page = 1, limit = 10, status, userId, clinicId } = req.query;

    let filtered = [...appointmentsStore];

    // 根据用户过滤（普通用户只能看自己的预约）
    if (!req.user.isAdmin && req.user.id) {
      filtered = filtered.filter(apt => apt.userId === req.user.id);
    } else if (userId) {
      filtered = filtered.filter(apt => apt.userId === userId);
    }

    // 根据诊所过滤
    if (clinicId) {
      filtered = filtered.filter(apt => apt.clinicId === clinicId);
    }

    // 根据状态过滤
    if (status) {
      filtered = filtered.filter(apt => apt.status === status);
    }

    // 排序（最新的在前）
    filtered.sort((a, b) => new Date(b.createTime) - new Date(a.createTime));

    // 分页
    const startIndex = (page - 1) * limit;
    const endIndex = startIndex + parseInt(limit);
    const paginatedAppointments = filtered.slice(startIndex, endIndex);

    res.json({
      success: true,
      data: {
        appointments: paginatedAppointments,
        total: filtered.length,
        page: parseInt(page),
        totalPages: Math.ceil(filtered.length / limit)
      }
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      message: '获取预约列表失败',
      error: error.message
    });
  }
});

/**
 * 创建新预约
 * POST /api/appointments
 */
router.post('/', async (req, res) => {
  try {
    const {
      userId,
      userName,
      userPhone,
      clinicId,
      clinicName,
      service,
      appointmentDate,
      appointmentTime,
      notes
    } = req.body;

    // 验证必填字段
    if (!userId || !clinicId || !appointmentDate || !appointmentTime) {
      return res.status(400).json({
        success: false,
        message: '缺少必要的预约信息'
      });
    }

    // 检查是否有重复预约（同一用户、同一诊所、同一时间）
    const existingAppointment = appointmentsStore.find(apt =>
      apt.userId === userId &&
      apt.clinicId === clinicId &&
      apt.appointmentDate === appointmentDate &&
      apt.appointmentTime === appointmentTime &&
      apt.status !== 'cancelled'
    );

    if (existingAppointment) {
      return res.status(400).json({
        success: false,
        message: '该时间段已有预约'
      });
    }

    // 创建新预约
    const newAppointment = {
      _id: `apt_${String(nextAppointmentId++).padStart(3, '0')}`,
      userId,
      userName: userName || '用户' + userId.slice(-4),
      userPhone,
      clinicId,
      clinicName,
      service,
      appointmentDate,
      appointmentTime,
      notes,
      status: 'pending', // 初始状态为待确认
      createTime: new Date()
    };

    appointmentsStore.push(newAppointment);

    res.json({
      success: true,
      data: newAppointment,
      message: '预约创建成功'
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      message: '创建预约失败',
      error: error.message
    });
  }
});

/**
 * 更新预约状态
 * PUT /api/appointments/:id/status
 */
router.put('/:id/status', verifyToken, async (req, res) => {
  try {
    const { id } = req.params;
    const { status } = req.body;

    // 验证状态值
    const validStatuses = ['pending', 'confirmed', 'completed', 'cancelled'];
    if (!validStatuses.includes(status)) {
      return res.status(400).json({
        success: false,
        message: '无效的状态值'
      });
    }

    // 查找预约
    const appointmentIndex = appointmentsStore.findIndex(apt => apt._id === id);
    if (appointmentIndex === -1) {
      return res.status(404).json({
        success: false,
        message: '预约不存在'
      });
    }

    // 更新状态
    appointmentsStore[appointmentIndex].status = status;
    appointmentsStore[appointmentIndex].updateTime = new Date();

    // 如果是完成状态，记录完成时间
    if (status === 'completed') {
      appointmentsStore[appointmentIndex].completeTime = new Date();
    }

    res.json({
      success: true,
      data: appointmentsStore[appointmentIndex],
      message: '状态更新成功'
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      message: '更新状态失败',
      error: error.message
    });
  }
});

/**
 * 取消预约
 * DELETE /api/appointments/:id
 */
router.delete('/:id', verifyToken, async (req, res) => {
  try {
    const { id } = req.params;

    // 查找预约
    const appointmentIndex = appointmentsStore.findIndex(apt => apt._id === id);
    if (appointmentIndex === -1) {
      return res.status(404).json({
        success: false,
        message: '预约不存在'
      });
    }

    // 检查权限（只有管理员或预约者本人可以取消）
    const appointment = appointmentsStore[appointmentIndex];
    if (!req.user.isAdmin && appointment.userId !== req.user.id) {
      return res.status(403).json({
        success: false,
        message: '没有权限取消此预约'
      });
    }

    // 将状态改为已取消（软删除）
    appointmentsStore[appointmentIndex].status = 'cancelled';
    appointmentsStore[appointmentIndex].cancelTime = new Date();

    res.json({
      success: true,
      message: '预约已取消'
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      message: '取消预约失败',
      error: error.message
    });
  }
});

/**
 * 获取预约详情
 * GET /api/appointments/:id
 */
router.get('/:id', verifyToken, async (req, res) => {
  try {
    const { id } = req.params;

    const appointment = appointmentsStore.find(apt => apt._id === id);
    if (!appointment) {
      return res.status(404).json({
        success: false,
        message: '预约不存在'
      });
    }

    // 检查权限（只有管理员或预约者本人可以查看）
    if (!req.user.isAdmin && appointment.userId !== req.user.id) {
      return res.status(403).json({
        success: false,
        message: '没有权限查看此预约'
      });
    }

    res.json({
      success: true,
      data: appointment
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      message: '获取预约详情失败',
      error: error.message
    });
  }
});

/**
 * 管理员：批量更新预约状态
 * POST /api/appointments/batch-status
 */
router.post('/batch-status', verifyToken, async (req, res) => {
  if (!req.user.isAdmin) {
    return res.status(403).json({
      success: false,
      message: '需要管理员权限'
    });
  }

  try {
    const { appointmentIds, status } = req.body;

    if (!appointmentIds || !Array.isArray(appointmentIds) || appointmentIds.length === 0) {
      return res.status(400).json({
        success: false,
        message: '请提供预约ID列表'
      });
    }

    let updatedCount = 0;
    appointmentIds.forEach(id => {
      const index = appointmentsStore.findIndex(apt => apt._id === id);
      if (index !== -1) {
        appointmentsStore[index].status = status;
        appointmentsStore[index].updateTime = new Date();
        if (status === 'completed') {
          appointmentsStore[index].completeTime = new Date();
        }
        updatedCount++;
      }
    });

    res.json({
      success: true,
      message: `成功更新 ${updatedCount} 个预约`
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      message: '批量更新失败',
      error: error.message
    });
  }
});

module.exports = router;