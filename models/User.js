const mongoose = require('mongoose');

const userSchema = new mongoose.Schema({
  // 微信相关
  openId: {
    type: String,
    required: true,
    unique: true,
    index: true
  },
  unionId: {
    type: String,
    sparse: true
  },
  sessionKey: {
    type: String,
    select: false // 不返回给前端
  },

  // 用户基本信息
  nickName: {
    type: String,
    default: ''
  },
  avatarUrl: {
    type: String,
    default: ''
  },
  gender: {
    type: Number,
    default: 0 // 0:未知, 1:男, 2:女
  },
  phone: {
    type: String,
    default: ''
  },
  realName: {
    type: String,
    default: ''
  },

  // 地址信息
  country: String,
  province: String,
  city: String,
  language: {
    type: String,
    default: 'zh_CN'
  },

  // 权限和状态
  isAdmin: {
    type: Boolean,
    default: false
  },
  memberType: {
    type: String,
    enum: ['normal', 'vip', 'svip'],
    default: 'normal'
  },
  status: {
    type: String,
    enum: ['active', 'inactive', 'banned'],
    default: 'active'
  },

  // 应用类型
  appType: {
    type: String,
    enum: ['beauty', 'education', 'other'],
    default: 'beauty'
  },

  // 统计信息
  appointmentCount: {
    type: Number,
    default: 0
  },
  consultationCount: {
    type: Number,
    default: 0
  },
  totalSpent: {
    type: Number,
    default: 0
  },

  // 偏好设置
  preferences: {
    receiveNotifications: {
      type: Boolean,
      default: true
    },
    language: {
      type: String,
      default: 'zh_CN'
    },
    currency: {
      type: String,
      default: 'CNY'
    }
  },

  // 时间戳
  createTime: {
    type: Date,
    default: Date.now
  },
  lastLoginTime: {
    type: Date,
    default: Date.now
  },
  updateTime: {
    type: Date,
    default: Date.now
  }
}, {
  timestamps: true,
  toJSON: {
    transform: function(doc, ret) {
      // 移除敏感信息
      delete ret.sessionKey;
      delete ret.__v;
      return ret;
    }
  }
});

// 索引
userSchema.index({ phone: 1 });
userSchema.index({ createTime: -1 });
userSchema.index({ isAdmin: 1 });

// 中间件：更新时自动更新updateTime
userSchema.pre('save', function(next) {
  this.updateTime = new Date();
  next();
});

// 实例方法
userSchema.methods.isVip = function() {
  return this.memberType === 'vip' || this.memberType === 'svip';
};

userSchema.methods.canManage = function() {
  return this.isAdmin === true;
};

// 静态方法
userSchema.statics.findByOpenId = function(openId) {
  return this.findOne({ openId });
};

userSchema.statics.getAdmins = function() {
  return this.find({ isAdmin: true });
};

userSchema.statics.updateLoginTime = function(userId) {
  return this.findByIdAndUpdate(userId, {
    lastLoginTime: new Date()
  });
};

const User = mongoose.model('User', userSchema);

module.exports = User;