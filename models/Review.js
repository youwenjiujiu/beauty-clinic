const mongoose = require('mongoose');

const reviewSchema = new mongoose.Schema({
  // 关联信息
  userId: {
    type: mongoose.Schema.Types.Mixed, // 支持 ObjectId 或字符串
    ref: 'User'
  },
  userName: String, // 用户昵称（无门槛评价用）
  userAvatar: String, // 用户头像（无门槛评价用）
  clinicId: {
    type: mongoose.Schema.Types.Mixed, // 支持 ObjectId 或字符串
    ref: 'Clinic'
  },
  clinicName: String, // 诊所名称（无门槛评价用）
  appointmentId: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'Appointment'
    // 不再必填，无门槛评价不需要
  },
  serviceType: String,

  // 评分（1-5星）
  rating: {
    overall: {
      type: Number,
      required: true,
      min: 1,
      max: 5
    },
    service: {
      type: Number,
      min: 1,
      max: 5
    },
    result: {
      type: Number,
      min: 1,
      max: 5
    },
    environment: {
      type: Number,
      min: 1,
      max: 5
    },
    price: {
      type: Number,
      min: 1,
      max: 5
    }
  },

  // 评价内容
  content: {
    type: String,
    required: true,
    minlength: 10
  },

  // 图片
  images: [String],

  // 匿名
  isAnonymous: {
    type: Boolean,
    default: false
  },

  // 认证
  isVerified: {
    type: Boolean,
    default: false // 真实就医后的评价
  },

  // 有用性
  helpfulCount: {
    type: Number,
    default: 0
  },
  unhelpfulCount: {
    type: Number,
    default: 0
  },
  helpfulUsers: [{
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User'
  }],

  // 回复
  reply: {
    content: String,
    repliedBy: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'User'
    },
    repliedAt: Date
  },

  // 状态
  status: {
    type: String,
    enum: ['pending', 'approved', 'rejected', 'hidden'],
    default: 'pending'
  },

  // 审核
  reviewedBy: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User'
  },
  reviewedAt: Date,
  rejectReason: String,

  // 标签
  tags: [String], // ['效果好', '服务好', '性价比高']

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
reviewSchema.index({ clinicId: 1, status: 1, createdAt: -1 });
reviewSchema.index({ userId: 1, createdAt: -1 });
reviewSchema.index({ appointmentId: 1 });
reviewSchema.index({ 'rating.overall': -1 });

// 中间件：更新诊所评分
reviewSchema.post('save', async function(doc) {
  // 如果没有有效的clinicId，跳过评分更新
  if (!doc.clinicId || typeof doc.clinicId === 'string') {
    return;
  }

  try {
    const Review = this.constructor;
    const Clinic = mongoose.model('Clinic');

    // 计算诊所平均分
    const reviews = await Review.find({
      clinicId: doc.clinicId,
      status: 'approved'
    });

    if (reviews.length > 0) {
      const avgRating = reviews.reduce((sum, r) => sum + r.rating.overall, 0) / reviews.length;

      await Clinic.findByIdAndUpdate(doc.clinicId, {
        rating: Math.round(avgRating * 10) / 10,
        reviewCount: reviews.length
      });
    }
  } catch (error) {
    console.error('更新诊所评分失败:', error);
  }
});

// 实例方法
reviewSchema.methods.markHelpful = async function(userId) {
  if (!this.helpfulUsers.includes(userId)) {
    this.helpfulUsers.push(userId);
    this.helpfulCount++;
    await this.save();
  }
};

// 静态方法
reviewSchema.statics.findByClinic = function(clinicId) {
  return this.find({
    clinicId,
    status: 'approved'
  }).sort({ createdAt: -1 });
};

const Review = mongoose.model('Review', reviewSchema);

module.exports = Review;