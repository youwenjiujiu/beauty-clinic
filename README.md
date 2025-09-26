# 嘟嘟预约通后端服务

## 快速开始

### 1. 安装依赖
```bash
cd backend
npm install
```

### 2. 配置环境变量
```bash
# 复制环境变量模板
cp .env.example .env

# 编辑 .env 文件，填入你的配置
vim .env
```

必须配置的环境变量：
- `WX_APP_ID`: 微信小程序 AppID
- `WX_APP_SECRET`: 微信小程序 AppSecret
- `JWT_SECRET`: JWT 密钥（生产环境请使用强密码）
- `ADMIN_OPENIDS`: 管理员 OpenID 列表（逗号分隔）

### 3. 安装 MongoDB
```bash
# macOS
brew install mongodb-community
brew services start mongodb-community

# Ubuntu
sudo apt install mongodb
sudo systemctl start mongodb

# Windows
# 下载并安装 MongoDB Community Server
```

### 4. 启动服务器
```bash
# 开发模式（自动重启）
npm run dev

# 生产模式
npm start
```

服务器将运行在 http://localhost:3000

### 5. 测试接口
```bash
# 健康检查
curl http://localhost:3000/health

# 测试登录（需要真实的 code）
curl -X POST http://localhost:3000/api/auth/login \
  -H "Content-Type: application/json" \
  -d '{"code": "你的code", "appType": "beauty"}'
```

## 获取你的 OpenID

### 方法1：通过日志查看
1. 启动后端服务器
2. 使用小程序登录
3. 查看后端控制台日志，会显示：
   ```
   用户登录: oXXXX-XXXXXXXXXXXXXXXXXX
   ```

### 方法2：通过数据库查询
```bash
# 连接 MongoDB
mongosh

# 查询用户
use dudu-appointment
db.users.find({}, {openId: 1, nickName: 1})
```

### 方法3：添加临时日志
在 `routes/auth.js` 的登录接口中添加：
```javascript
console.log('=== 用户 OpenID ===');
console.log('OpenID:', openid);
console.log('==================');
```

## 设置管理员

### 方法1：通过环境变量
编辑 `.env` 文件：
```env
ADMIN_OPENIDS=你的OpenID,其他管理员OpenID
```

### 方法2：在代码中硬编码
编辑 `config/admin.js`：
```javascript
const HARDCODED_ADMINS = [
  'oXXXX-你的OpenID',
];
```

### 方法3：通过 API 动态添加
```bash
# 先获取管理员 token
TOKEN="你的管理员token"

# 添加新管理员
curl -X POST http://localhost:3000/api/admin/add \
  -H "Authorization: Bearer $TOKEN" \
  -H "Content-Type: application/json" \
  -d '{"openId": "要添加的OpenID"}'
```

## 部署到生产环境

### 1. 使用 PM2
```bash
# 安装 PM2
npm install -g pm2

# 启动服务
pm2 start server.js --name dudu-backend

# 查看日志
pm2 logs dudu-backend

# 设置开机自启
pm2 startup
pm2 save
```

### 2. 使用 Docker
```bash
# 构建镜像
docker build -t dudu-backend .

# 运行容器
docker run -d \
  -p 3000:3000 \
  --env-file .env \
  --name dudu-backend \
  dudu-backend
```

### 3. 部署到云服务器
- 阿里云 ECS
- 腾讯云 CVM
- AWS EC2

### 4. 配置 HTTPS（推荐）
```bash
# 使用 Nginx 反向代理
server {
    listen 443 ssl;
    server_name api.dudu-appointment.com;

    ssl_certificate /path/to/cert.pem;
    ssl_certificate_key /path/to/key.pem;

    location / {
        proxy_pass http://localhost:3000;
        proxy_set_header Host $host;
        proxy_set_header X-Real-IP $remote_addr;
    }
}
```

## API 文档

### 认证接口

#### 登录
```
POST /api/auth/login
Body: { code, appType }
Response: { token, userInfo, isAdmin }
```

#### 验证 Token
```
GET /api/auth/validate
Headers: Authorization: Bearer <token>
Response: { userId, isAdmin, expiresAt }
```

### 用户接口

#### 获取个人信息
```
GET /api/users/me
Headers: Authorization: Bearer <token>
```

#### 更新个人信息
```
PUT /api/users/me
Headers: Authorization: Bearer <token>
Body: { nickName, avatarUrl, phone }
```

### 管理员接口

#### 获取管理员列表
```
GET /api/admin/list
Headers: Authorization: Bearer <token>
需要管理员权限
```

#### 添加管理员
```
POST /api/admin/add
Headers: Authorization: Bearer <token>
Body: { openId }
需要管理员权限
```

## 常见问题

### 1. MongoDB 连接失败
- 确保 MongoDB 已启动
- 检查连接字符串是否正确
- 默认连接：`mongodb://localhost:27017/dudu-appointment`

### 2. 微信登录失败
- 检查 AppID 和 AppSecret 是否正确
- 确保小程序已发布或在开发者工具中调试
- code 只能使用一次，过期时间 5 分钟

### 3. Token 验证失败
- 检查 JWT_SECRET 是否配置
- Token 格式：`Bearer <token>`
- 默认有效期 7 天

### 4. 管理员权限不生效
- 确认 OpenID 已添加到管理员列表
- 重新登录获取新的 token
- 检查数据库中 user.isAdmin 字段

## 开发调试

### 查看日志
```bash
# PM2
pm2 logs

# Docker
docker logs dudu-backend

# 直接运行
npm run dev
```

### 数据库操作
```bash
# 连接数据库
mongosh

# 选择数据库
use dudu-appointment

# 查看所有用户
db.users.find().pretty()

# 设置管理员
db.users.updateOne(
  { openId: "你的OpenID" },
  { $set: { isAdmin: true } }
)
```

## 支持

如有问题，请联系：
- 微信：DUDU_0o0
- GitHub Issues: https://github.com/your-repo/issues