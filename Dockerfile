# ==============================================================================
# PromoCuts - Dockerfile de Producao Multi-Stage Endurecido (Next.js Standalone)
# ==============================================================================

# 1. Base
FROM node:20-alpine AS base
RUN apk update && apk upgrade --no-cache && \
    apk add --no-cache libc6-compat tini
WORKDIR /app

# 2. Dependencias
FROM base AS deps
COPY package.json package-lock.json* ./
RUN npm ci

# 3. Builder
FROM base AS builder
WORKDIR /app
COPY --from=deps /app/node_modules ./node_modules
COPY . .

# Variaveis de ambiente para o build do Next.js
ARG NEXT_PUBLIC_SUPABASE_URL
ARG NEXT_PUBLIC_SUPABASE_ANON_KEY
ARG NEXT_PUBLIC_APP_URL
ENV NEXT_PUBLIC_SUPABASE_URL=${NEXT_PUBLIC_SUPABASE_URL}
ENV NEXT_PUBLIC_SUPABASE_ANON_KEY=${NEXT_PUBLIC_SUPABASE_ANON_KEY}
ENV NEXT_PUBLIC_APP_URL=${NEXT_PUBLIC_APP_URL}

# Desativa telemetria do Next.js durante a compilacao
ENV NEXT_TELEMETRY_DISABLED=1
ENV NODE_ENV=production

RUN npm run build

# 4. Runner
FROM base AS runner
WORKDIR /app

ENV NODE_ENV=production
ENV NEXT_TELEMETRY_DISABLED=1
ENV PORT=3000
ENV HOSTNAME="0.0.0.0"

RUN addgroup --system --gid 1001 nodejs && \
    adduser --system --uid 1001 nextjs

COPY --from=builder /app/public ./public

# Configura permissoes restritas para o cache do Next.js standalone
RUN mkdir -p .next && chown -R nextjs:nodejs .next

# Copia arquivos standalone compilados com permissao estrita ao usuario sem privilegios
COPY --from=builder --chown=nextjs:nodejs /app/.next/standalone ./
COPY --from=builder --chown=nextjs:nodejs /app/.next/static ./.next/static

USER nextjs

EXPOSE 3000

# Monitoramento de saude nativo do container
HEALTHCHECK --interval=30s --timeout=5s --start-period=10s --retries=3 \
    CMD wget --no-verbose --tries=1 --spider http://127.0.0.1:3000/ || exit 1

# Gerenciador de processos Tini para graceful shutdown e propagacao correta de sinais UNIX
ENTRYPOINT ["/sbin/tini", "--"]
CMD ["node", "server.js"]
