# 使用 Node.js 18 官方镜像
FROM node:18-alpine

# 设置工作目录
WORKDIR /app

# 复制 package.json 和 package-lock.json
COPY package*.json ./

# 安装依赖
RUN npm install --production

# 复制源代码
COPY . .

# 暴露端口（云托管默认使用 80 端口）
EXPOSE 80

# 设置环境变量
ENV PORT=80
ENV NODE_ENV=production

# 启动应用
CMD ["node", "server.js"]
