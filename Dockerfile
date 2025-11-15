# ---- 依赖阶段 ----
FROM node:18-alpine AS deps
RUN corepack enable && corepack prepare pnpm@latest --activate
WORKDIR /app
COPY package.json ./
RUN pnpm install --no-optional

# ---- 构建阶段 ----
FROM node:18-alpine AS builder
RUN corepack enable && corepack prepare pnpm@latest --activate
WORKDIR /app
COPY . .
COPY --from=deps /app/node_modules ./node_modules
RUN pnpm run build

# ---- 运行阶段 ----
FROM node:18-alpine AS runner
RUN addgroup -g 1001 -S nodejs && adduser -u 1001 -S nextjs -G nodejs
WORKDIR /app

ENV NODE_ENV=production
ENV NEXT_TELEMETRY_DISABLED=1
ENV HOSTNAME=0.0.0.0
ENV PORT=3000

# 只复制运行必需的最小文件集
COPY --from=builder --chown=nextjs:nodejs /app/public ./public
COPY --from=builder --chown=nextjs:nodejs /app/.next ./.next
COPY --from=builder --chown=nextjs:nodejs /app/node_modules ./node_modules
COPY --from=builder --chown=nextjs:nodejs /app/package.json ./package.json

USER nextjs
EXPOSE 3000
CMD ["npx", "next", "start"]
