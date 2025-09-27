const mongoose = require('mongoose');

const appointmentSchema = new mongoose.Schema({
  // 用户信息
  userId: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User',
    required: true
  },
  openId: {
    type: String,
    required: true,
    index: true
  },

  // 诊所信息
  clinicId: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'Clinic',
    required: true
  },
  clinicName: {
    type: String,
    required: true
  },

  // 服务信息
  serviceType: {
    type: String,
    required: true
  },
  serviceName: {
    type: String,
    required: true
  },
  servicePrice: {
    type: Number,
    default: 0
  },

  // 预约时间
  appointmentDate: {
    type: Date,
    required: true
  },
  appointmentTime: {
    type: String, // "09:00", "14:30" 等
    required: true
  },
  duration: {
    type: Number, // 分钟
    default: 60
  },

  // 联系信息
  contactName: {
    type: String,
    required: true
  },
  contactPhone: {
    type: String,
    required: true
  },
  contactEmail: {
    type: String
  },

  // 状态
  status: {
    type: String,
    enum: ['pending', 'confirmed', 'completed', 'cancelled', 'no-show'],
    default: 'pending'
  },

  // 备注
  userRemark: {
    type: String // 用户备注
  },
  clinicRemark: {
    type: String // 诊所备注
  },
  adminRemark: {
    type: String // 管理员备注
  },

  // 支付信息
  paymentStatus: {
    type: String,
    enum: ['unpaid', 'deposit', 'paid', 'refunded'],
    default: 'unpaid'
  },
  depositAmount: {
    type: Number,
    default: 0
  },
  totalAmount: {
    type: Number,
    default: 0
  },
  paymentMethod: {
    type: String,
    enum: ['wechat', 'alipay', 'cash', 'card'],
  },
  paymentTime: Date,

  // 取消信息
  cancelledBy: {
    type: String,
    enum: ['user', 'clinic', 'admin', 'system']
  },
  cancelledAt: Date,
  cancelReason: String,

  // 评价
  reviewId: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'Review'
  },
  hasReviewed: {
    type: Boolean,
    default: false
  },

  // 时间戳
  createdAt: {
    type: Date,
    default: Date.now
  },
  updatedAt: {
    type: Date,
    default: Date.now
  }
}, {
  timestamps: true
});

// 索引
appointmentSchema.index({ userId: 1, appointmentDate: -1 });
appointmentSchema.index({ clinicId: 1, appointmentDate: 1 });
appointmentSchema.index({ status: 1 });
appointmentSchema.index({ appointmentDate: 1, appointmentTime: 1 });

// 实例方法
appointmentSchema.methods.canCancel = function() {
  return this.status === 'pending' || this.status === 'confirmed';
};

appointmentSchema.methods.canReview = function() {
  return this.status === 'completed' && !this.hasReviewed;
};

// 静态方法
appointmentSchema.statics.findByUser = function(userId) {
  return this.find({ userId }).sort({ appointmentDate: -1 });
};

appointmentSchema.statics.findByClinic = function(clinicId, date) {
  const query = { clinicId };
  if (date) {
    const startOfDay = new Date(date);
    startOfDay.setHours(0, 0, 0, 0);
    const endOfDay = new Date(date);
    endOfDay.setHours(23, 59, 59, 999);
    query.appointmentDate = { $gte: startOfDay, $lte: endOfDay };
  }
  return this.find(query).sort({ appointmentDate: 1, appointmentTime: 1 });
};

const Appointment = mongoose.model('Appointment', appointmentSchema);

module.exports = Appointment;