const mongoose = require('mongoose');
const Clinic = require('../models/Clinic');
const Service = require('../models/Service');
require('dotenv').config();

const clinicsData = [
  {
    name: 'Dr.Petit整形外科',
    nameKr: '닥터쁘띠 성형외과',
    nameEn: 'Dr.Petit Plastic Surgery',
    address: '韩国首尔特别市江南区论岘路563',
    city: '首尔',
    district: '江南区',
    phone: '+82-2-547-1177',
    description: 'Dr.Petit整形外科是韩国知名的整形医院，拥有20年的临床经验，专注于面部轮廓、双眼皮、隆鼻等项目。医院配备最先进的医疗设备，所有医生均具有整形外科专科医师资格。',
    shortDescription: '20年经验的知名整形医院，专注面部轮廓手术',
    specialties: ['双眼皮', '隆鼻', '面部轮廓', '脂肪填充'],
    businessHours: {
      monday: { open: '10:00', close: '19:00' },
      tuesday: { open: '10:00', close: '19:00' },
      wednesday: { open: '10:00', close: '19:00' },
      thursday: { open: '10:00', close: '19:00' },
      friday: { open: '10:00', close: '19:00' },
      saturday: { open: '10:00', close: '16:00' },
      sunday: { open: '', close: '' }
    },
    tags: ['JCI认证', '明星医院', '中文服务'],
    rating: 4.8,
    reviewCount: 326,
    priceRange: '$$$',
    status: 'active',
    verified: true,
    featured: true,
    sortOrder: 1,
    slug: 'dr-petit-plastic-surgery'
  },
  {
    name: 'Dream Beauty医院',
    nameKr: '드림뷰티 성형외과',
    nameEn: 'Dream Beauty Clinic',
    address: '韩国首尔特别市江南区压鸥亭路10',
    city: '首尔',
    district: '江南区',
    phone: '+82-2-512-3456',
    description: 'Dream Beauty医院是一家专注于自然美的整形医院，主打微创手术和注射项目。医院环境优雅，提供一对一VIP服务，深受海外患者喜爱。',
    shortDescription: '专注自然美的高端整形医院',
    specialties: ['微整形', '玻尿酸', '肉毒素', '线雕'],
    businessHours: {
      monday: { open: '09:00', close: '18:00' },
      tuesday: { open: '09:00', close: '18:00' },
      wednesday: { open: '09:00', close: '18:00' },
      thursday: { open: '09:00', close: '18:00' },
      friday: { open: '09:00', close: '18:00' },
      saturday: { open: '10:00', close: '15:00' },
      sunday: { open: '', close: '' }
    },
    tags: ['微创手术', 'VIP服务', '预约制'],
    rating: 4.6,
    reviewCount: 189,
    priceRange: '$$$$',
    status: 'active',
    verified: true,
    featured: true,
    sortOrder: 2,
    slug: 'dream-beauty-clinic'
  },
  {
    name: 'First整形外科',
    nameKr: '퍼스트 성형외과',
    nameEn: 'First Plastic Surgery',
    address: '韩国首尔特别市瑞草区瑞草大路77',
    city: '首尔',
    district: '瑞草区',
    phone: '+82-2-501-7788',
    description: 'First整形外科以安全和精细著称，医院拥有完善的术后护理系统，提供24小时应急服务。主打眼部整形和鼻部整形项目。',
    shortDescription: '以安全精细著称的专业整形医院',
    specialties: ['眼部整形', '鼻部整形', '吸脂', '隆胸'],
    businessHours: {
      monday: { open: '09:30', close: '18:30' },
      tuesday: { open: '09:30', close: '18:30' },
      wednesday: { open: '09:30', close: '18:30' },
      thursday: { open: '09:30', close: '18:30' },
      friday: { open: '09:30', close: '18:30' },
      saturday: { open: '09:30', close: '14:00' },
      sunday: { open: '', close: '' }
    },
    tags: ['24小时应急', '术后护理完善', '医保定点'],
    rating: 4.7,
    reviewCount: 256,
    priceRange: '$$$',
    status: 'active',
    verified: true,
    featured: false,
    sortOrder: 3,
    slug: 'first-plastic-surgery'
  }
];

const servicesData = [
  {
    category: 'eyes',
    categoryName: '眼部整形',
    name: '韩式双眼皮',
    description: '采用韩国最新的双眼皮手术技术，根据个人眼型设计最适合的双眼皮形状',
    benefits: ['自然灵动', '恢复快', '疤痕小'],
    duration: {
      surgery: 60,
      recovery: '5-7天'
    },
    priceRange: {
      min: 8000,
      max: 15000,
      unit: '元'
    },
    popularity: 100,
    isActive: true,
    isFeatured: true
  },
  {
    category: 'nose',
    categoryName: '鼻部整形',
    name: '韩式隆鼻',
    description: '使用自体软骨或假体，打造自然立体的鼻型',
    benefits: ['立体自然', '效果持久', '安全性高'],
    duration: {
      surgery: 90,
      recovery: '7-10天'
    },
    priceRange: {
      min: 15000,
      max: 30000,
      unit: '元'
    },
    popularity: 95,
    isActive: true,
    isFeatured: true
  },
  {
    category: 'face',
    categoryName: '面部轮廓',
    name: 'V-Line瘦脸',
    description: '通过下颌角手术和颊脂垫去除，打造精致V脸',
    benefits: ['小V脸', '轮廓精致', '效果明显'],
    duration: {
      surgery: 120,
      recovery: '10-14天'
    },
    priceRange: {
      min: 30000,
      max: 50000,
      unit: '元'
    },
    popularity: 85,
    isActive: true,
    isFeatured: false
  }
];

async function seedDatabase() {
  try {
    // 连接数据库
    await mongoose.connect(process.env.MONGODB_URI);
    console.log('MongoDB连接成功');

    // 清空现有数据（可选）
    console.log('清空现有数据...');
    await Clinic.deleteMany({});
    await Service.deleteMany({});

    // 插入诊所数据
    console.log('插入诊所数据...');
    const clinics = await Clinic.insertMany(clinicsData);
    console.log(`成功插入 ${clinics.length} 个诊所`);

    // 插入服务数据
    console.log('插入服务数据...');
    const services = await Service.insertMany(servicesData);
    console.log(`成功插入 ${services.length} 个服务项目`);

    console.log('数据库初始化完成！');
    process.exit(0);
  } catch (error) {
    console.error('数据库初始化失败:', error);
    process.exit(1);
  }
}

seedDatabase();