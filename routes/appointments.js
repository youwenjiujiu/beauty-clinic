const router = require('express').Router();
const Appointment = require('../models/Appointment');
const Clinic = require('../models/Clinic');
const { verifyToken } = require('../middleware/auth');

/**
 * 创建预约
 * POST /api/appointments
 */
router.post('/', verifyToken, async (req, res) => {
  try {
    const {
      clinicId,
      serviceType,
      serviceName,
      servicePrice,
      appointmentDate,
      appointmentTime,
      contactName,
      contactPhone,
      contactEmail,
      userRemark
    } = req.body;

    // 验证诊所是否存在
    const clinic = await Clinic.findById(clinicId);
    if (!clinic) {
      return res.status(404).json({
        success: false,
        message: '诊所不存在'
      });
    }

    // 创建预约
    const appointment = new Appointment({
      userId: req.user.userId,
      openId: req.user.openId,
      clinicId,
      clinicName: clinic.name,
      serviceType,
      serviceName: serviceName || serviceType,
      servicePrice: servicePrice || 0,
      appointmentDate: new Date(appointmentDate),
      appointmentTime,
      contactName,
      contactPhone,
      contactEmail,
      userRemark,
      status: 'pending'
    });

    await appointment.save();

    // 更新诊所预约统计
    await Clinic.findByIdAndUpdate(clinicId, {
      $inc: { appointmentCount: 1 }
    });

    res.json({
      success: true,
      message: '预约成功',
      data: appointment
    });
  } catch (error) {
    console.error('创建预约失败:', error);
    res.status(500).json({
      success: false,
      message: '预约失败'
    });
  }
});

/**
 * 获取我的预约列表
 * GET /api/appointments/my
 */
router.get('/my', verifyToken, async (req, res) => {
  try {
    const { status, page = 1, limit = 10 } = req.query;

    const query = { openId: req.user.openId };
    if (status) {
      query.status = status;
    }

    const skip = (page - 1) * limit;

    const appointments = await Appointment
      .find(query)
      .populate('clinicId', 'name address phone logo')
      .sort({ appointmentDate: -1 })
      .skip(skip)
      .limit(parseInt(limit));

    const total = await Appointment.countDocuments(query);

    res.json({
      success: true,
      data: {
        appointments,
        pagination: {
          page: parseInt(page),
          limit: parseInt(limit),
          total,
          pages: Math.ceil(total / limit)
        }
      }
    });
  } catch (error) {
    console.error('获取预约列表失败:', error);
    res.status(500).json({
      success: false,
      message: '获取预约列表失败'
    });
  }
});

/**
 * 获取预约详情
 * GET /api/appointments/:id
 */
router.get('/:id', verifyToken, async (req, res) => {
  try {
    const appointment = await Appointment
      .findById(req.params.id)
      .populate('clinicId')
      .populate('reviewId');

    if (!appointment) {
      return res.status(404).json({
        success: false,
        message: '预约不存在'
      });
    }

    // 验证是否是本人的预约
    if (appointment.openId !== req.user.openId && !req.user.isAdmin) {
      return res.status(403).json({
        success: false,
        message: '无权查看此预约'
      });
    }

    res.json({
      success: true,
      data: appointment
    });
  } catch (error) {
    console.error('获取预约详情失败:', error);
    res.status(500).json({
      success: false,
      message: '获取预约详情失败'
    });
  }
});

/**
 * 取消预约
 * PUT /api/appointments/:id/cancel
 */
router.put('/:id/cancel', verifyToken, async (req, res) => {
  try {
    const { reason } = req.body;

    const appointment = await Appointment.findById(req.params.id);

    if (!appointment) {
      return res.status(404).json({
        success: false,
        message: '预约不存在'
      });
    }

    // 验证是否是本人的预约
    if (appointment.openId !== req.user.openId && !req.user.isAdmin) {
      return res.status(403).json({
        success: false,
        message: '无权操作此预约'
      });
    }

    // 检查是否可以取消
    if (!appointment.canCancel()) {
      return res.status(400).json({
        success: false,
        message: '当前状态不可取消'
      });
    }

    appointment.status = 'cancelled';
    appointment.cancelledBy = req.user.isAdmin ? 'admin' : 'user';
    appointment.cancelledAt = new Date();
    appointment.cancelReason = reason;

    await appointment.save();

    res.json({
      success: true,
      message: '预约已取消',
      data: appointment
    });
  } catch (error) {
    console.error('取消预约失败:', error);
    res.status(500).json({
      success: false,
      message: '取消预约失败'
    });
  }
});

/**
 * 管理员获取所有预约
 * GET /api/appointments/admin/all
 */
router.get('/admin/all', verifyToken, async (req, res) => {
  if (!req.user.isAdmin) {
    return res.status(403).json({
      success: false,
      message: '需要管理员权限'
    });
  }

  try {
    const { clinicId, status, date, page = 1, limit = 20 } = req.query;

    const query = {};
    if (clinicId) query.clinicId = clinicId;
    if (status) query.status = status;
    if (date) {
      const startOfDay = new Date(date);
      startOfDay.setHours(0, 0, 0, 0);
      const endOfDay = new Date(date);
      endOfDay.setHours(23, 59, 59, 999);
      query.appointmentDate = { $gte: startOfDay, $lte: endOfDay };
    }

    const skip = (page - 1) * limit;

    const appointments = await Appointment
      .find(query)
      .populate('clinicId', 'name address')
      .populate('userId', 'nickName phone')
      .sort({ appointmentDate: -1 })
      .skip(skip)
      .limit(parseInt(limit));

    const total = await Appointment.countDocuments(query);

    res.json({
      success: true,
      data: {
        appointments,
        pagination: {
          page: parseInt(page),
          limit: parseInt(limit),
          total,
          pages: Math.ceil(total / limit)
        }
      }
    });
  } catch (error) {
    console.error('获取所有预约失败:', error);
    res.status(500).json({
      success: false,
      message: '获取预约列表失败'
    });
  }
});

/**
 * 管理员更新预约状态
 * PUT /api/appointments/admin/:id/status
 */
router.put('/admin/:id/status', verifyToken, async (req, res) => {
  if (!req.user.isAdmin) {
    return res.status(403).json({
      success: false,
      message: '需要管理员权限'
    });
  }

  try {
    const { status, adminRemark } = req.body;

    const appointment = await Appointment.findById(req.params.id);

    if (!appointment) {
      return res.status(404).json({
        success: false,
        message: '预约不存在'
      });
    }

    appointment.status = status;
    if (adminRemark) {
      appointment.adminRemark = adminRemark;
    }

    await appointment.save();

    res.json({
      success: true,
      data: appointment
    });
  } catch (error) {
    console.error('更新预约状态失败:', error);
    res.status(500).json({
      success: false,
      message: '更新预约状态失败'
    });
  }
});

/**
 * 检查时间段是否可用
 * GET /api/appointments/check-availability
 */
router.get('/check-availability', async (req, res) => {
  try {
    const { clinicId, date, time } = req.query;

    if (!clinicId || !date || !time) {
      return res.status(400).json({
        success: false,
        message: '缺少必要参数'
      });
    }

    const appointmentDate = new Date(date);

    // 检查是否已有预约
    const existingAppointment = await Appointment.findOne({
      clinicId,
      appointmentDate,
      appointmentTime: time,
      status: { $in: ['pending', 'confirmed'] }
    });

    res.json({
      success: true,
      data: {
        available: !existingAppointment
      }
    });
  } catch (error) {
    console.error('检查可用性失败:', error);
    res.status(500).json({
      success: false,
      message: '检查失败'
    });
  }
});

module.exports = router;