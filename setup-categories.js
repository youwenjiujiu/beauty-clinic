const axios = require('axios');

const API_URL = 'https://beauty-clinic-backend-eg0ugkesl-youwenjiujius-projects.vercel.app';

// 医美相关的专科分类配置
const categories = [
  // 主页图标 + 筛选分类（both）
  { id: 'skin', name: '皮肤管理', icon: '🧴', order: 1, type: 'both' },
  { id: 'plastic', name: '整形手术', icon: '💉', order: 2, type: 'both' },
  { id: 'injection', name: '微整注射', icon: '💊', order: 3, type: 'both' },
  { id: 'laser', name: '激光美容', icon: '✨', order: 4, type: 'both' },

  // 仅在筛选分类显示（filter）
  { id: 'body', name: '身体塑形', icon: '💪', order: 5, type: 'filter' },
  { id: 'antiaging', name: '抗衰老', icon: '🌟', order: 6, type: 'filter' },
  { id: 'hair', name: '毛发移植', icon: '👨‍🦱', order: 7, type: 'filter' },
  { id: 'teeth', name: '牙齿美容', icon: '🦷', order: 8, type: 'filter' },
  { id: 'eye', name: '眼部整形', icon: '👁️', order: 9, type: 'filter' },
  { id: 'nose', name: '鼻部整形', icon: '👃', order: 10, type: 'filter' },
  { id: 'face', name: '面部轮廓', icon: '😊', order: 11, type: 'filter' },
  { id: 'breast', name: '胸部整形', icon: '👙', order: 12, type: 'filter' }
];

async function setupCategories() {
  console.log('==========================================');
  console.log('开始配置医美专科分类...');
  console.log('==========================================\n');

  try {
    // 配置分类
    console.log('正在发送分类数据到服务器...');
    const response = await axios.post(`${API_URL}/api/config/categories`, {
      categories: categories
    });

    if (response.data.success) {
      console.log('✅ 分类配置成功！\n');
      console.log('已配置的分类：');
      console.log('==========================================');

      // 显示主页分类
      console.log('\n📱 主页显示的分类（前4个）：');
      const homeCategories = categories.filter(c => c.type === 'both' || c.type === 'home').slice(0, 4);
      homeCategories.forEach(cat => {
        console.log(`  ${cat.icon} ${cat.name} (${cat.id})`);
      });

      // 显示筛选分类
      console.log('\n🔍 筛选面板的分类：');
      const filterCategories = categories.filter(c => c.type === 'both' || c.type === 'filter');
      filterCategories.forEach(cat => {
        console.log(`  ${cat.icon} ${cat.name} (${cat.id})`);
      });

      console.log('\n==========================================');
      console.log(`共配置了 ${categories.length} 个专科分类`);
      console.log('主页图标: 4个');
      console.log(`筛选分类: ${filterCategories.length}个`);
    } else {
      console.error('❌ 配置失败:', response.data.message);
    }

    // 验证配置 - 获取分类
    console.log('\n==========================================');
    console.log('验证配置结果...');
    console.log('==========================================\n');

    // 测试获取所有分类
    console.log('1. 获取所有分类:');
    const allResponse = await axios.get(`${API_URL}/api/config/categories`);
    console.log(`   返回了 ${allResponse.data.data.length} 个分类`);

    // 测试获取筛选分类
    console.log('\n2. 获取筛选分类 (type=filter):');
    const filterResponse = await axios.get(`${API_URL}/api/config/categories?type=filter`);
    const filterCount = filterResponse.data.data.length;
    console.log(`   返回了 ${filterCount} 个筛选分类`);

    // 测试获取主页分类
    console.log('\n3. 获取主页分类 (type=home):');
    const homeResponse = await axios.get(`${API_URL}/api/config/categories?type=home`);
    const homeCount = homeResponse.data.data.length;
    console.log(`   返回了 ${homeCount} 个主页分类`);

    console.log('\n==========================================');
    console.log('✨ 配置完成！小程序现在可以动态加载这些分类了');
    console.log('==========================================');

  } catch (error) {
    console.error('❌ 配置失败:', error.response?.data || error.message);
  }
}

// 执行配置
setupCategories();