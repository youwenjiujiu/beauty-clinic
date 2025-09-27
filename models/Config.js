const mongoose = require('mongoose');

// 系统配置模型
const configSchema = new mongoose.Schema({
  // 配置类型
  type: {
    type: String,
    required: true,
    unique: true,
    enum: [
      'hot_searches',      // 热门搜索
      'filter_options',    // 筛选选项
      'banner_images',     // 轮播图
      'service_categories', // 服务分类
      'districts',         // 地区列表
      'tags',             // 标签管理
      'promotion_texts',   // 推广文案
      'contact_info',      // 联系信息
      'app_settings'       // 应用设置
    ]
  },

  // 配置名称
  name: {
    type: String,
    required: true
  },

  // 配置内容（灵活的JSON结构）
  content: {
    type: mongoose.Schema.Types.Mixed,
    required: true
  },

  // 描述
  description: String,

  // 是否启用
  isActive: {
    type: Boolean,
    default: true
  },

  // 排序权重
  sortOrder: {
    type: Number,
    default: 0
  },

  // 最后修改人
  lastModifiedBy: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User'
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
configSchema.index({ type: 1 });
configSchema.index({ isActive: 1 });

const Config = mongoose.model('Config', configSchema);

module.exports = Config;