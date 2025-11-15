# =========================================
# 1. 构建阶段
# =========================================
FROM node:20-alpine AS builder

WORKDIR /app

# 拷贝项目文件
COPY package.json ./
COPY . .

# 安装依赖并构建
RUN npm install && npm run build

# =========================================
# 2. 运行阶段 (最小化镜像)
# =========================================
FROM node:20-alpine AS runner

WORKDIR /app

ENV NODE_ENV=production
ENV NEXT_TELEMETRY_DISABLED=1

# 拷贝必要文件
COPY --from=builder /app/public ./public
COPY --from=builder /app/.next/standalone ./
COPY --from=builder /app/.next/static ./.next/static

EXPOSE 3000

CMD ["node", "server.js"]
