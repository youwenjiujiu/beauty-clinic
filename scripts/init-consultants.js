/**
 * 初始化顾问数据到MongoDB
 * 将管理系统的默认顾问数据保存到数据库
 */

require('dotenv').config();
const mongoose = require('mongoose');
const Consultant = require('../models/Consultant');

// 默认顾问数据（与小程序管理系统一致）
const defaultConsultants = [
  {
    name: '小美顾问',
    nameKr: '샤오메이',
    phone: '010-1234-5678',
    wechat: 'xiaomei_service',
    kakaoTalk: 'xiaomei_service',
    avatar: '/images/advisor1.jpg',
    gender: 'female',
    languages: ['中文', '英语'],
    specialties: ['商务咨询', '项目管理'],
    experience: 5,
    serviceAreas: ['西湖区', '拱墅区'],
    serviceTypes: ['陪同翻译', '项目咨询', '预约安排'],
    introduction: '5年商务服务经验，熟悉本地各类服务机构',
    rating: 4.9,
    reviewCount: 156,
    totalServices: 200,
    consultationFee: 0,
    accompanyFee: 300,
    status: 'active',
    featured: true,
    tags: ['资深顾问', '专业服务', '经验丰富']
  },
  {
    name: '李明顾问',
    nameKr: '',
    phone: '010-2345-6789',
    wechat: 'liming_consultant',
    kakaoTalk: 'liming_service',
    avatar: '/images/advisor2.jpg',
    gender: 'male',
    languages: ['中文', '英语'],
    specialties: ['战略咨询', '业务分析'],
    experience: 3,
    serviceAreas: ['上城区', '下城区'],
    serviceTypes: ['陪同翻译', '术后跟进'],
    introduction: '3年商务服务经验，专注战略项目咨询',
    rating: 4.7,
    reviewCount: 89,
    totalServices: 120,
    consultationFee: 0,
    accompanyFee: 250,
    status: 'active',
    featured: false,
    tags: ['专业顾问', '多语言']
  },
  {
    name: '王顾问',
    nameKr: '',
    phone: '010-3456-7890',
    wechat: 'wang_service',
    avatar: '/images/advisor3.jpg',
    gender: 'female',
    languages: ['中文'],
    specialties: ['综合陪同'],
    experience: 2,
    serviceAreas: ['瑞草区'],
    serviceTypes: ['陪同翻译', '预约安排'],
    introduction: '2年服务经验',
    rating: 4.7,
    totalServices: 189,
    status: 'active',
    featured: false,
    tags: ['医疗顾问', '友善', '负责', '细心']
  }
];

async function initConsultants() {
  try {
    console.log('🚀 开始初始化顾问数据...\n');

    // 连接数据库
    const mongoUri = process.env.MONGODB_URI || 'mongodb+srv://duduBeauty:DUDU2025@cluster0.a8qfyfa.mongodb.net/dudu-appointment?retryWrites=true&w=majority&appName=Cluster0';

    await mongoose.connect(mongoUri);
    console.log('✅ 数据库连接成功\n');

    // 检查现有数据
    const existingCount = await Consultant.countDocuments();
    console.log(`📊 当前数据库中有 ${existingCount} 个顾问\n`);

    if (existingCount > 0) {
      console.log('⚠️  数据库中已有顾问数据，是否要清空并重新初始化？');
      console.log('   如需清空，请运行: node scripts/init-consultants.js --force');

      if (process.argv.includes('--force')) {
        console.log('\n🗑️  清空现有数据...');
        await Consultant.deleteMany({});
        console.log('✅ 已清空现有数据\n');
      } else {
        console.log('\n跳过初始化');
        await mongoose.disconnect();
        return;
      }
    }

    // 插入新数据
    console.log('📝 开始插入顾问数据...\n');

    for (const consultantData of defaultConsultants) {
      try {
        const consultant = new Consultant(consultantData);
        await consultant.save();
        console.log(`✅ 已添加: ${consultant.name}`);
      } catch (error) {
        console.error(`❌ 添加 ${consultantData.name} 失败:`, error.message);
      }
    }

    // 验证结果
    const finalCount = await Consultant.countDocuments();
    console.log(`\n✅ 初始化完成！数据库中现有 ${finalCount} 个顾问`);

    // 显示示例数据
    const samples = await Consultant.find().limit(3).select('name status rating');
    console.log('\n📋 示例数据:');
    samples.forEach(doc => {
      console.log(`  - ${doc.name} (状态: ${doc.status}, 评分: ${doc.rating})`);
    });

  } catch (error) {
    console.error('❌ 初始化失败:', error.message);
  } finally {
    await mongoose.disconnect();
    console.log('\n👋 数据库连接已关闭');
  }
}

// 运行初始化
initConsultants();