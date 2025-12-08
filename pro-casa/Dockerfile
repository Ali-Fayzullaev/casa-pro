FROM node:20-alpine AS base

# Устанавливаем зависимости
FROM base AS deps
WORKDIR /app

# Для alpine нужны дополнительные пакеты для некоторых npm модулей
RUN apk add --no-cache libc6-compat

# Копируем package файлы
COPY package.json package-lock.json* ./

# Устанавливаем зависимости с retry
RUN npm config set registry https://registry.npmmirror.com && \
    npm ci || npm ci || npm ci

# Builder stage
FROM base AS builder
WORKDIR /app

# Установка PATH для node_modules/.bin
ENV PATH=/app/node_modules/.bin:$PATH

# Сначала копируем node_modules из deps
COPY --from=deps /app/node_modules ./node_modules

# Копируем package.json для npm
COPY package.json ./

# Копируем остальные файлы исходного кода
COPY app ./app
COPY components ./components
COPY hooks ./hooks
COPY lib ./lib
COPY public ./public
COPY next.config.ts tsconfig.json postcss.config.mjs ./

# Отключаем телеметрию Next.js
ENV NEXT_TELEMETRY_DISABLED=1

# Принимаем аргумент для сборки
ARG NEXT_PUBLIC_API_URL
ENV NEXT_PUBLIC_API_URL=$NEXT_PUBLIC_API_URL

# Билдим приложение
RUN npm run build

# Production stage
FROM base AS runner
WORKDIR /app

ENV NODE_ENV=production
ENV NEXT_TELEMETRY_DISABLED=1

# Создаем пользователя nextjs
RUN addgroup --system --gid 1001 nodejs
RUN adduser --system --uid 1001 nextjs

# Копируем необходимые файлы
COPY --from=builder /app/public ./public
COPY --from=builder --chown=nextjs:nodejs /app/.next/standalone ./
COPY --from=builder --chown=nextjs:nodejs /app/.next/static ./.next/static

USER nextjs

EXPOSE 3000

ENV PORT=3000
ENV HOSTNAME="0.0.0.0"

CMD ["node", "server.js"]
