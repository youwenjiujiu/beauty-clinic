# Vercel 免费部署步骤

## 准备工作清单

### 1. MongoDB Atlas（已完成 ✅）
- [ ] 注册 MongoDB Atlas 账号
- [ ] 创建免费集群（M0 Sandbox）
- [ ] 设置数据库用户和密码
- [ ] 配置网络访问（0.0.0.0/0）
- [ ] 获取连接字符串

### 2. 获取微信小程序凭证
登录[微信小程序后台](https://mp.weixin.qq.com)：
- 开发 → 开发管理 → 开发设置
- 记录 AppID：`wx........................`
- 生成 AppSecret（只显示一次，要保存好）

### 3. 环境变量配置表

创建 `.env.production` 文件（不要提交到 Git）：

```env
# MongoDB Atlas 连接字符串（替换 <password> 为你的密码）
MONGODB_URI=mongodb+srv://dudu-admin:<password>@dudu-cluster.xxxxx.mongodb.net/dudu-appointment?retryWrites=true&w=majority

# 微信小程序配置
WX_APP_ID=wx........................
WX_APP_SECRET=................................

# JWT 密钥（用这个命令生成：node -e "console.log(require('crypto').randomBytes(32).toString('hex'))"）
JWT_SECRET=

# 管理员 OpenID（部署后通过日志获取）
ADMIN_OPENIDS=

# 生产环境标志
NODE_ENV=production
```

## 部署命令

### 方法1：CLI 部署（最快）
```bash
# 1. 全局安装 Vercel CLI
npm i -g vercel

# 2. 进入后端目录
cd backend

# 3. 部署（第一次会要求登录）
vercel

# 4. 配置环境变量
vercel env add MONGODB_URI production
vercel env add WX_APP_ID production
vercel env add WX_APP_SECRET production
vercel env add JWT_SECRET production
vercel env add ADMIN_OPENIDS production

# 5. 重新部署使环境变量生效
vercel --prod
```

### 方法2：网页部署
1. 访问 [vercel.com/new](https://vercel.com/new)
2. 选择 "Import Git Repository"
3. 授权 GitHub
4. 选择你的仓库
5. 配置环境变量
6. 点击 Deploy

## 部署后获取地址

部署成功后，你会得到一个 URL：
```
https://dudu-backend.vercel.app
```

## 测试部署

```bash
# 1. 测试健康检查
curl https://dudu-backend.vercel.app/health

# 2. 查看函数日志（获取你的 OpenID）
vercel logs
```

## 配置小程序

### 1. 添加服务器域名
微信小程序后台 → 开发 → 开发管理 → 开发设置 → 服务器域名：

request 合法域名添加：
- `https://dudu-backend.vercel.app`

### 2. 更新前端配置
```javascript
// app.js
globalData: {
  apiBaseUrl: 'https://dudu-backend.vercel.app',
  // ...
}
```

## 获取并设置管理员

### 1. 使用小程序登录一次

### 2. 查看 Vercel 日志获取 OpenID
```bash
vercel logs --follow
```
看到类似：`用户登录: oXXXX-XXXXXXXXXXXXXXXXXX`

### 3. 更新管理员配置
```bash
vercel env add ADMIN_OPENIDS production
# 输入你的 OpenID
```

### 4. 重新部署
```bash
vercel --prod
```

## 常见问题

### Q: MongoDB 连接失败？
检查：
1. 密码是否正确（注意特殊字符需要 URL 编码）
2. Network Access 是否配置了 0.0.0.0/0
3. 连接字符串格式是否正确

### Q: 微信登录失败？
检查：
1. AppID 和 AppSecret 是否正确
2. 服务器域名是否在小程序后台配置
3. 使用真机测试（开发者工具可能有问题）

### Q: 部署后 API 报错？
1. 查看日志：`vercel logs`
2. 检查环境变量：`vercel env ls`
3. 重新部署：`vercel --prod`

## 免费额度说明

### Vercel 免费额度
- 100GB 带宽/月
- 100GB-Hours 函数执行时间
- 无限部署次数
- 自动 HTTPS
- 全球 CDN

### MongoDB Atlas 免费额度
- 512MB 存储空间
- 共享集群（M0）
- 足够小型项目使用

## 维护命令

```bash
# 查看部署状态
vercel ls

# 查看日志
vercel logs

# 查看环境变量
vercel env ls

# 更新代码后重新部署
git add .
git commit -m "Update"
git push
vercel --prod

# 回滚到上个版本
vercel rollback
```

---

恭喜！你的后端现在已经免费部署在 Vercel 上了！🎉