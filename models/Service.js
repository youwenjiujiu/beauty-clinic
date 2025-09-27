const mongoose = require('mongoose');

const serviceSchema = new mongoose.Schema({
  // 分类信息
  category: {
    type: String,
    required: true,
    enum: ['eyes', 'nose', 'face', 'body', 'skin', 'hair', 'anti-aging', 'other']
  },
  categoryName: {
    type: String,
    required: true // 双眼皮、隆鼻、轮廓等
  },

  // 服务信息
  name: {
    type: String,
    required: true
  },
  nameEn: String,
  nameKr: String,

  // 描述
  description: {
    type: String,
    required: true
  },
  benefits: [String], // 功效列表
  process: String, // 手术过程
  duration: {
    surgery: Number, // 手术时长（分钟）
    recovery: String // 恢复期（如"3-7天"）
  },

  // 价格信息
  priceRange: {
    min: Number,
    max: Number,
    unit: {
      type: String,
      default: '元'
    },
    note: String // 价格说明
  },

  // 适用人群
  suitableFor: [String],
  notSuitableFor: [String],

  // 注意事项
  preCareTips: [String], // 术前注意
  postCareTips: [String], // 术后护理

  // 风险提示
  risks: [String],
  sideEffects: [String],

  // 图片
  images: [String],
  beforeAfterImages: [{
    before: String,
    after: String,
    description: String
  }],

  // 热门程度
  popularity: {
    type: Number,
    default: 0
  },
  viewCount: {
    type: Number,
    default: 0
  },

  // 状态
  isActive: {
    type: Boolean,
    default: true
  },
  isFeatured: {
    type: Boolean,
    default: false
  },

  // SEO
  slug: String,
  keywords: [String],

  // 排序
  sortOrder: {
    type: Number,
    default: 0
  },

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
serviceSchema.index({ category: 1, sortOrder: -1 });
serviceSchema.index({ name: 'text', description: 'text' });
serviceSchema.index({ popularity: -1 });

const Service = mongoose.model('Service', serviceSchema);

module.exports = Service;