const mongoose = require('mongoose');

const clinicSchema = new mongoose.Schema({
  // 基本信息
  name: {
    type: String,
    required: [true, '请填写诊所名称'],
    index: true
  },
  nameEn: String,
  nameKr: String,

  // 位置信息
  address: {
    type: String,
    required: [true, '请填写详细地址']
  },
  addressKr: String, // 韩文地址
  city: {
    type: String,
    default: '首尔'
  },
  district: {
    type: String,
    required: [true, '请填写所在区域'] // 江南区、瑞草区等
  },
  location: {
    type: {
      type: String,
      enum: ['Point'],
      default: 'Point'
    },
    coordinates: {
      type: [Number], // [longitude, latitude]
      index: '2dsphere'
    }
  },

  // 联系方式
  phone: {
    type: String,
    required: [true, '请填写联系电话']
  },
  wechat: String,
  kakaoTalk: String,
  email: String,
  website: String,

  // 详细信息
  description: {
    type: String,
    required: [true, '请填写诊所简介']
  },
  shortDescription: String,

  // 专长服务
  specialties: [{
    type: String // 双眼皮、隆鼻、轮廓等
  }],

  services: [{
    category: String,
    name: String,
    description: String,
    price: Number,
    priceUnit: String, // "起", "次", "疗程"
    duration: Number // 分钟
  }],

  // 价格明细（医院菜单）
  priceMenu: [{
    category: String, // 分类：眼部、鼻部等
    items: [{
      name: String, // 项目名称
      nameKr: String, // 韩文名称
      price: String, // 价格（可以是范围）
      description: String, // 说明
      unit: String // 单位：次、疗程等
    }]
  }],

  // 经验分享（用户反馈）
  experiences: [{
    userId: String,
    userName: String,
    userAvatar: String,
    content: String,
    rating: Number,
    images: [String],
    date: Date,
    verified: Boolean // 是否已验证
  }],

  // 店铺信息图片
  shopImages: [{
    url: String,
    category: String, // 'exterior', 'interior', 'equipment', 'result', 'doctor', 'environment'
    description: String,
    descriptionKr: String
  }],

  // 医生团队
  doctors: [{
    name: String,
    title: String,
    specialties: [String],
    experience: Number, // 年
    education: [String],
    avatar: String
  }],
  totalDoctors: {
    type: Number,
    default: 0
  },

  // 营业信息
  businessHours: {
    monday: { open: String, close: String },
    tuesday: { open: String, close: String },
    wednesday: { open: String, close: String },
    thursday: { open: String, close: String },
    friday: { open: String, close: String },
    saturday: { open: String, close: String },
    sunday: { open: String, close: String }
  },
  holidays: [Date], // 休息日

  // 图片
  logo: String,
  images: [String],
  coverImage: String,
  gallery: [{
    url: String,
    caption: String,
    type: String // 'exterior', 'interior', 'equipment', 'result'
  }],

  // 认证和标签
  certifications: [{
    name: String,
    issuer: String,
    year: Number
  }],
  tags: [String], // ['JCI认证', '明星医院', '医保定点' 等]

  // 评分和统计
  rating: {
    type: Number,
    default: 0,
    min: 0,
    max: 5
  },
  naverRating: {
    type: Number, // Naver地图评分
    default: 0,
    min: 0,
    max: 5
  },
  reviewCount: {
    type: Number,
    default: 0
  },
  appointmentCount: {
    type: Number,
    default: 0
  },
  viewCount: {
    type: Number,
    default: 0
  },

  // 价格范围
  priceRange: {
    type: String,
    enum: ['$', '$$', '$$$', '$$$$'],
    default: '$$'
  },

  // 支付方式
  paymentMethods: [String], // ['微信', '支付宝', '现金', '信用卡']

  // 优惠活动
  promotions: [{
    title: String,
    description: String,
    discount: Number, // 折扣百分比
    validFrom: Date,
    validTo: Date,
    terms: String
  }],

  // 状态
  status: {
    type: String,
    enum: ['active', 'inactive', 'pending', 'suspended'],
    default: 'active'
  },
  verified: {
    type: Boolean,
    default: false
  },
  featured: {
    type: Boolean,
    default: false
  },
  isHot: {
    type: Boolean,
    default: false
  },

  // SEO
  slug: {
    type: String,
    unique: true,
    sparse: true  // 允许多个 null 值
  },
  metaTitle: String,
  metaDescription: String,
  keywords: [String],

  // 管理信息
  ownerId: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User'
  },
  managedBy: [{
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User'
  }],

  // 成立信息
  establishedYear: Number,

  // 排序权重
  sortOrder: {
    type: Number,
    default: 0
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
clinicSchema.index({ name: 'text', description: 'text' });
clinicSchema.index({ district: 1, rating: -1 });
clinicSchema.index({ specialties: 1 });
clinicSchema.index({ status: 1, featured: -1, sortOrder: -1 });

// 虚拟属性
clinicSchema.virtual('reviews', {
  ref: 'Review',
  localField: '_id',
  foreignField: 'clinicId'
});

// 实例方法
clinicSchema.methods.isOpen = function() {
  const now = new Date();
  const day = ['sunday', 'monday', 'tuesday', 'wednesday', 'thursday', 'friday', 'saturday'][now.getDay()];
  const hours = this.businessHours[day];

  if (!hours || !hours.open || !hours.close) return false;

  const currentTime = now.getHours() * 100 + now.getMinutes();
  const openTime = parseInt(hours.open.replace(':', ''));
  const closeTime = parseInt(hours.close.replace(':', ''));

  return currentTime >= openTime && currentTime <= closeTime;
};

// 静态方法
clinicSchema.statics.findByDistrict = function(district) {
  return this.find({ district, status: 'active' }).sort({ rating: -1 });
};

clinicSchema.statics.findFeatured = function() {
  return this.find({ featured: true, status: 'active' }).sort({ sortOrder: -1 });
};

clinicSchema.statics.search = function(keyword) {
  return this.find({
    $text: { $search: keyword },
    status: 'active'
  });
};

const Clinic = mongoose.model('Clinic', clinicSchema);

module.exports = Clinic;