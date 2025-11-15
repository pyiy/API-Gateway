# 使用 Node 20 官方镜像
FROM node:20-alpine

WORKDIR /app

# 复制依赖文件
COPY package.json ./

# 安装依赖（不依赖 lock 文件）
RUN npm install --omit=dev --ignore-scripts

# 复制源代码
COPY . .

# 构建应用
RUN npm run build

# 暴露端口
EXPOSE 3000

# 启动应用
CMD ["npm", "start"]
