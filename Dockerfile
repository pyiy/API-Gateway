# =========================================
# 1. 构建阶段 (基于Node.js Alpine镜像)
# =========================================
FROM node:20-alpine AS builder

# 设置工作目录
WORKDIR /app

# 根据你的包管理器选择 (推荐 pnpm)
# 如果你使用 npm，注释掉这两行
# 如果你使用 yarn，修改为：RUN corepack enable && corepack prepare yarn@stable --activate
RUN corepack enable && corepack prepare pnpm@latest --activate

# 优先拷贝包管理器配置文件以利用Docker层缓存
COPY package.json pnpm-lock.yaml* yarn.lock* package-lock.json* ./

# 安装所有依赖 (包括 devDependencies)
# 自动识别锁文件类型
RUN \
  if [ -f pnpm-lock.yaml ]; then pnpm install --frozen-lockfile; \
  elif [ -f yarn.lock ]; then yarn install --frozen-lockfile; \
  else npm install; \
  fi

# 拷贝源代码
COPY . .

# 构建Next.js应用
RUN \
  if [ -f pnpm-lock.yaml ]; then pnpm build; \
  elif [ -f yarn.lock ]; then yarn build; \
  else npm run build; \
  fi

# =========================================
# 2. 运行阶段 (最小化生产镜像)
# =========================================
FROM node:20-alpine AS runner

# 创建非root用户提高安全性
RUN addgroup -g 1001 -S nodejs && \
    adduser -S nextjs -u 1001

WORKDIR /app

# 设置环境变量
ENV NODE_ENV=production
ENV NEXT_TELEMETRY_DISABLED=1

# 拷贝构建产物 (关键：优化体积)
# standalone 模式会输出包含所有依赖的独立应用
COPY --from=builder --chown=nextjs:nodejs /app/public ./public
COPY --from=builder --chown=nextjs:nodejs /app/.next/standalone ./
COPY --from=builder --chown=nextjs:nodejs /app/.next/static ./.next/static

# 切换到非root用户
USER nextjs

# 暴露端口
EXPOSE 3000

# 配置健康检查 (可选)
HEALTHCHECK --interval=30s --timeout=3s --start-period=5s --retries=3 \
  CMD curl --fail http://localhost:3000/api/health || exit 1

# 启动应用
CMD ["node", "server.js"]
