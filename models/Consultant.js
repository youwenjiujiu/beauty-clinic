const mongoose = require('mongoose');

const consultantSchema = new mongoose.Schema({
  // 基本信息
  name: {
    type: String,
    required: true
  },
  nameKr: String, // 韩文名
  nameEn: String, // 英文名

  // 联系方式
  phone: String,
  wechat: {
    type: String,
    required: true
  },
  kakaoTalk: String,
  whatsapp: String,
  email: String,

  // 个人信息
  avatar: String, // 头像
  gender: {
    type: String,
    enum: ['male', 'female', 'other']
  },
  age: Number,
  languages: [String], // ['中文', '韩语', '英语']

  // 专业信息
  specialties: [String], // 擅长领域：['医美', '整形', '皮肤管理']
  experience: {
    type: Number, // 从业年限
    default: 0
  },
  certification: [String], // 资质认证

  // 服务信息
  serviceAreas: [String], // 服务区域：['江南区', '瑞草区']
  serviceTypes: [{
    type: String,
    enum: ['陪同翻译', '项目咨询', '预约安排', '接送服务', '术后跟进']
  }],

  // 简介
  introduction: String, // 中文简介
  introductionKr: String, // 韩文简介

  // 服务案例
  cases: [{
    title: String,
    description: String,
    images: [String],
    date: Date
  }],

  // 评价
  rating: {
    type: Number,
    default: 5,
    min: 0,
    max: 5
  },
  reviewCount: {
    type: Number,
    default: 0
  },

  // 服务统计
  totalServices: {
    type: Number,
    default: 0
  },

  // 价格（如果收费）
  consultationFee: {
    type: Number,
    default: 0
  },
  accompanyFee: {
    type: Number,
    default: 0
  },

  // 工作时间
  availability: {
    monday: { available: Boolean, hours: String },
    tuesday: { available: Boolean, hours: String },
    wednesday: { available: Boolean, hours: String },
    thursday: { available: Boolean, hours: String },
    friday: { available: Boolean, hours: String },
    saturday: { available: Boolean, hours: String },
    sunday: { available: Boolean, hours: String }
  },

  // 标签
  tags: [String], // ['资深顾问', '医美专家', '双语服务']

  // 状态
  status: {
    type: String,
    enum: ['active', 'inactive', 'busy', 'vacation'],
    default: 'active'
  },

  // 是否推荐
  featured: {
    type: Boolean,
    default: false
  },

  // 排序权重
  sortOrder: {
    type: Number,
    default: 0
  },

  // 二维码（微信、KakaoTalk等）
  qrCodes: {
    wechat: String, // 微信二维码图片URL
    kakaoTalk: String, // KakaoTalk二维码图片URL
    whatsapp: String
  },

  // 关联的机构（可选）
  associatedClinics: [{
    type: mongoose.Schema.Types.ObjectId,
    ref: 'Clinic'
  }],

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
consultantSchema.index({ name: 'text', introduction: 'text' });
consultantSchema.index({ status: 1, featured: -1, sortOrder: -1 });
consultantSchema.index({ serviceAreas: 1 });
consultantSchema.index({ specialties: 1 });

// 实例方法
consultantSchema.methods.isAvailable = function(day) {
  const availability = this.availability[day.toLowerCase()];
  return availability && availability.available && this.status === 'active';
};

// 静态方法
consultantSchema.statics.findFeatured = function() {
  return this.find({ featured: true, status: 'active' }).sort({ sortOrder: -1 });
};

consultantSchema.statics.findByArea = function(area) {
  return this.find({
    serviceAreas: area,
    status: 'active'
  }).sort({ rating: -1 });
};

consultantSchema.statics.findBySpecialty = function(specialty) {
  return this.find({
    specialties: specialty,
    status: 'active'
  }).sort({ rating: -1 });
};

const Consultant = mongoose.model('Consultant', consultantSchema);

module.exports = Consultant;
