const router = require('express').Router();
const { verifyToken } = require('../middleware/auth');

/**
 * 创建预约
 * POST /api/appointments
 */
router.post('/', verifyToken, async (req, res) => {
  const {
    clinicId,
    serviceType,
    appointmentDate,
    appointmentTime,
    contactName,
    contactPhone,
    remarks
  } = req.body;

  try {
    // 这里应该保存到数据库
    const appointment = {
      id: 'apt_' + Date.now(),
      userId: req.user.id,
      clinicId,
      serviceType,
      appointmentDate,
      appointmentTime,
      contactName,
      contactPhone,
      remarks,
      status: 'pending',
      createTime: new Date()
    };

    res.json({
      success: true,
      message: '预约成功',
      data: appointment
    });
  } catch (error) {
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
    // 这里应该从数据库查询
    const appointments = [
      {
        id: 'apt_001',
        clinicName: 'Dr.Petit整形外科',
        serviceType: '双眼皮手术咨询',
        appointmentDate: '2025-01-15',
        appointmentTime: '14:00',
        status: 'confirmed',
        createTime: '2025-01-10'
      }
    ];

    res.json({
      success: true,
      data: appointments
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      message: '获取预约列表失败'
    });
  }
});

/**
 * 取消预约
 * PUT /api/appointments/:id/cancel
 */
router.put('/:id/cancel', verifyToken, async (req, res) => {
  try {
    // 这里应该更新数据库
    res.json({
      success: true,
      message: '预约已取消'
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      message: '取消预约失败'
    });
  }
});

module.exports = router;