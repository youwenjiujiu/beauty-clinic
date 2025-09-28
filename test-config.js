// 测试配置存储
const adminConfig = require('./routes/admin/config');
const publicConfig = require('./routes/publicConfig');

console.log('Admin config module:', typeof adminConfig);
console.log('configStore exists:', !!adminConfig.configStore);

if (adminConfig.configStore) {
  console.log('Districts count:', adminConfig.configStore.filter_options.districts.length);
  console.log('First district:', adminConfig.configStore.filter_options.districts[0]);
}

// 测试公开API路由
const express = require('express');
const app = express();
app.use(express.json());

app.use('/api/config', publicConfig);

app.listen(3001, () => {
  console.log('\n本地测试服务器启动在 http://localhost:3001');
  console.log('测试URL: http://localhost:3001/api/config/filter-options');
});