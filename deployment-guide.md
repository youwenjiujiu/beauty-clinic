# 后端部署方案指南

## 🎯 推荐方案（按难易程度）

### 方案1：Railway（最简单，免费套餐）
Railway 是一个一键部署平台，非常适合快速部署。

**步骤：**
1. 访问 [railway.app](https://railway.app)
2. 用 GitHub 登录
3. 创建新项目 → Deploy from GitHub repo
4. 选择你的仓库
5. 添加 MongoDB 插件
6. 配置环境变量
7. 自动部署完成！

**优点：**
- ✅ 一键部署，超级简单
- ✅ 自动 HTTPS
- ✅ 免费套餐（每月 $5 额度）
- ✅ 内置 MongoDB
- ✅ 自动 CI/CD

**获取部署URL：**
```
https://你的项目名.railway.app
```

---

### 方案2：Vercel + MongoDB Atlas（免费）
适合 Serverless 部署。

**步骤：**

#### 2.1 部署到 Vercel
```bash
# 安装 Vercel CLI
npm i -g vercel

# 在 backend 目录下
cd backend
vercel

# 按提示操作，会自动部署
```

#### 2.2 配置 MongoDB Atlas
1. 访问 [mongodb.com/atlas](https://www.mongodb.com/atlas)
2. 创建免费集群（512MB）
3. 获取连接字符串
4. 在 Vercel 项目设置中添加环境变量

**vercel.json 配置：**
```json
{
  "version": 2,
  "builds": [
    {
      "src": "server.js",
      "use": "@vercel/node"
    }
  ],
  "routes": [
    {
      "src": "/(.*)",
      "dest": "server.js"
    }
  ]
}
```

---

### 方案3：腾讯云轻量服务器（最稳定，月费24元起）

**步骤：**

#### 3.1 购买服务器
1. 访问 [腾讯云轻量服务器](https://cloud.tencent.com/product/lighthouse)
2. 选择配置：
   - 地域：选择靠近用户的地域
   - 镜像：Ubuntu 22.04
   - 套餐：1核2G即可（24元/月）

#### 3.2 部署脚本
```bash
#!/bin/bash
# 保存为 deploy.sh

# 1. 连接服务器
ssh root@你的服务器IP

# 2. 安装 Node.js
curl -fsSL https://deb.nodesource.com/setup_18.x | sudo -E bash -
apt-get install -y nodejs

# 3. 安装 MongoDB
wget -qO - https://www.mongodb.org/static/pgp/server-6.0.asc | apt-key add -
echo "deb [ arch=amd64,arm64 ] https://repo.mongodb.org/apt/ubuntu jammy/mongodb-org/6.0 multiverse" | tee /etc/apt/sources.list.d/mongodb-org-6.0.list
apt-get update
apt-get install -y mongodb-org
systemctl start mongod
systemctl enable mongod

# 4. 安装 PM2
npm install -g pm2

# 5. 克隆代码
git clone https://github.com/你的仓库.git
cd beauty-clinic-miniapp/backend

# 6. 安装依赖
npm install

# 7. 配置环境变量
cp .env.example .env
nano .env  # 编辑配置

# 8. 启动服务
pm2 start server.js --name dudu-backend
pm2 startup
pm2 save

# 9. 配置 Nginx（可选，用于 HTTPS）
apt-get install -y nginx
```

#### 3.3 配置域名和 HTTPS
```nginx
# /etc/nginx/sites-available/api.conf
server {
    listen 80;
    server_name api.你的域名.com;

    location / {
        proxy_pass http://localhost:3000;
        proxy_http_version 1.1;
        proxy_set_header Upgrade $http_upgrade;
        proxy_set_header Connection 'upgrade';
        proxy_set_header Host $host;
        proxy_cache_bypass $http_upgrade;
    }
}

# 启用站点
ln -s /etc/nginx/sites-available/api.conf /etc/nginx/sites-enabled/
nginx -t
systemctl reload nginx

# 安装 SSL 证书（免费）
apt-get install -y certbot python3-certbot-nginx
certbot --nginx -d api.你的域名.com
```

---

### 方案4：阿里云函数计算 FC（按量付费）

**优点：**
- ✅ 按请求付费，没有请求不收费
- ✅ 自动扩缩容
- ✅ 免运维

**部署步骤：**
1. 安装 Serverless Devs
```bash
npm install -g @serverless-devs/s
s config add --AccessKeyID xxx --AccessKeySecret xxx
```

2. 创建 s.yaml
```yaml
edition: 1.0.0
name: dudu-backend
access: default

services:
  dudu-api:
    component: fc
    props:
      region: cn-hangzhou
      service:
        name: dudu-service
      function:
        name: api
        runtime: nodejs14
        codeUri: ./
        handler: server.handler
        memorySize: 512
        timeout: 60
      triggers:
        - name: http
          type: http
          config:
            authType: anonymous
            methods:
              - GET
              - POST
              - PUT
              - DELETE
```

3. 部署
```bash
s deploy
```

---

## 📊 方案对比

| 方案 | 难度 | 费用 | 稳定性 | 扩展性 | 适合场景 |
|------|------|------|--------|--------|----------|
| Railway | ⭐ | 免费-$5/月 | ⭐⭐⭐ | ⭐⭐⭐ | 开发测试 |
| Vercel | ⭐⭐ | 免费 | ⭐⭐⭐ | ⭐⭐⭐⭐ | 小型项目 |
| 腾讯云 | ⭐⭐⭐ | 24元/月起 | ⭐⭐⭐⭐⭐ | ⭐⭐⭐⭐ | 正式生产 |
| 阿里云FC | ⭐⭐⭐ | 按量付费 | ⭐⭐⭐⭐ | ⭐⭐⭐⭐⭐ | 流量波动大 |

---

## 🚀 快速开始（Railway 方案）

### 1. 准备代码
```bash
# 在 backend 目录创建 Dockerfile
cat > Dockerfile << 'EOF'
FROM node:18-alpine

WORKDIR /app

COPY package*.json ./
RUN npm ci --only=production

COPY . .

EXPOSE 3000

CMD ["node", "server.js"]
EOF
```

### 2. 推送到 GitHub
```bash
git add .
git commit -m "Add backend"
git push
```

### 3. 在 Railway 部署
1. 访问 [railway.app](https://railway.app)
2. New Project → Deploy from GitHub repo
3. 选择你的仓库
4. 添加插件 → MongoDB
5. 在 Variables 中添加：
   - `WX_APP_ID`
   - `WX_APP_SECRET`
   - `JWT_SECRET`
   - `ADMIN_OPENIDS`

### 4. 获取部署地址
部署完成后，Railway 会提供一个 URL：
```
https://dudu-backend.railway.app
```

### 5. 更新小程序配置
```javascript
// app.js
globalData: {
  apiBaseUrl: 'https://dudu-backend.railway.app',
  // ...
}
```

---

## 📱 小程序配置

### 1. 配置服务器域名
在微信小程序后台：
1. 开发 → 开发设置 → 服务器域名
2. 添加 request 合法域名：
   - `https://dudu-backend.railway.app`（Railway）
   - `https://你的域名.vercel.app`（Vercel）
   - `https://api.你的域名.com`（自己的服务器）

### 2. 更新前端 API 地址
```javascript
// app.js
globalData: {
  // 开发环境
  apiBaseUrl: 'http://localhost:3000',

  // 生产环境
  // apiBaseUrl: 'https://dudu-backend.railway.app',
}
```

---

## 🔍 部署后测试

### 1. 测试健康检查
```bash
curl https://你的域名/health
```

### 2. 测试登录接口
在小程序中正常登录，查看是否能获取 token。

### 3. 查看日志
```bash
# Railway
railway logs

# 腾讯云（PM2）
pm2 logs

# Vercel
vercel logs
```

---

## 💡 最佳实践

### 1. 环境变量管理
**不要**把密钥提交到代码仓库！

```bash
# .gitignore
.env
.env.local
.env.production
```

### 2. 数据库备份
```bash
# MongoDB 备份脚本
mongodump --uri="mongodb://..." --out=/backup/$(date +%Y%m%d)

# 定时任务（每天凌晨3点）
crontab -e
0 3 * * * /usr/bin/mongodump --uri="..." --out=/backup/$(date +\%Y\%m\%d)
```

### 3. 监控告警
- 使用 UptimeRobot 监控服务可用性
- 配置错误日志告警
- 监控 API 响应时间

### 4. 安全建议
- 使用 HTTPS
- 配置 CORS 白名单
- 实施请求限流
- 定期更新依赖

---

## 🆘 常见问题

### Q1: 小程序提示"不在合法域名列表"
**A:** 在小程序后台配置服务器域名，必须是 HTTPS。

### Q2: MongoDB 连接失败
**A:** 检查防火墙，确保 27017 端口开放（或使用 MongoDB Atlas）。

### Q3: 部署后登录失败
**A:** 检查环境变量是否正确配置，特别是 `WX_APP_ID` 和 `WX_APP_SECRET`。

### Q4: 如何查看生产环境日志？
**A:**
- Railway: `railway logs`
- PM2: `pm2 logs`
- Docker: `docker logs container-name`

---

## 📞 需要帮助？

1. **Railway 部署问题**：查看 [Railway 文档](https://docs.railway.app)
2. **MongoDB 问题**：查看 [MongoDB Atlas 文档](https://docs.atlas.mongodb.com)
3. **微信小程序问题**：查看 [微信开发文档](https://developers.weixin.qq.com/miniprogram/dev/)

选择适合你的方案，按步骤操作即可完成部署！