const mongoose = require('mongoose');

// 搜索历史模型（用于统计热门搜索）
const searchHistorySchema = new mongoose.Schema({
  // 搜索关键词
  keyword: {
    type: String,
    required: true,
    index: true
  },

  // 搜索用户
  userId: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User'
  },

  // 用户OpenID
  openId: String,

  // 搜索类型
  searchType: {
    type: String,
    enum: ['clinic', 'service', 'doctor', 'general'],
    default: 'general'
  },

  // 搜索结果数量
  resultCount: {
    type: Number,
    default: 0
  },

  // 是否点击了结果
  hasClicked: {
    type: Boolean,
    default: false
  },

  // 点击的结果ID
  clickedItemId: String,

  // 搜索时间
  searchTime: {
    type: Date,
    default: Date.now
  },

  // IP地址
  ipAddress: String,

  // 设备信息
  deviceInfo: {
    platform: String,
    model: String,
    system: String
  }
}, {
  timestamps: true
});

// 索引
searchHistorySchema.index({ keyword: 1, searchTime: -1 });
searchHistorySchema.index({ userId: 1, searchTime: -1 });
searchHistorySchema.index({ searchTime: -1 });

// 静态方法：获取热门搜索
searchHistorySchema.statics.getHotSearches = async function(limit = 10, days = 7) {
  const dateThreshold = new Date();
  dateThreshold.setDate(dateThreshold.getDate() - days);

  const hotSearches = await this.aggregate([
    {
      $match: {
        searchTime: { $gte: dateThreshold }
      }
    },
    {
      $group: {
        _id: '$keyword',
        count: { $sum: 1 },
        hasClickedCount: {
          $sum: { $cond: ['$hasClicked', 1, 0] }
        },
        avgResultCount: { $avg: '$resultCount' }
      }
    },
    {
      $project: {
        keyword: '$_id',
        count: 1,
        clickRate: {
          $cond: [
            { $eq: ['$count', 0] },
            0,
            { $divide: ['$hasClickedCount', '$count'] }
          ]
        },
        score: {
          // 综合评分：搜索次数 * (1 + 点击率) * 结果数量权重
          $multiply: [
            '$count',
            { $add: [1, { $divide: ['$hasClickedCount', '$count'] }] },
            { $cond: [
              { $gt: ['$avgResultCount', 0] },
              1,
              0.5
            ]}
          ]
        }
      }
    },
    {
      $sort: { score: -1 }
    },
    {
      $limit: limit
    }
  ]);

  return hotSearches.map(item => ({
    keyword: item.keyword,
    count: item.count,
    clickRate: Math.round(item.clickRate * 100),
    isHot: item.count > 10
  }));
};

const SearchHistory = mongoose.model('SearchHistory', searchHistorySchema);

module.exports = SearchHistory;