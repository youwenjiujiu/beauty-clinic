// 测试advisors路由是否可以正常加载
try {
  const advisorsRouter = require('./routes/advisors');
  console.log('✅ Advisors路由加载成功');
  console.log('路由类型:', typeof advisorsRouter);
  console.log('是否为Express Router:', advisorsRouter && advisorsRouter.name === 'router');

  // 检查路由栈
  if (advisorsRouter && advisorsRouter.stack) {
    console.log('路由栈长度:', advisorsRouter.stack.length);
    advisorsRouter.stack.forEach(layer => {
      if (layer.route) {
        console.log('- 路由:', layer.route.path, Object.keys(layer.route.methods));
      }
    });
  }
} catch (error) {
  console.error('❌ 加载advisors路由失败:', error.message);
  console.error(error.stack);
}