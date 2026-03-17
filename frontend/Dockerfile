FROM node:20-alpine AS builder
RUN corepack enable && corepack prepare pnpm@9 --activate
WORKDIR /app
COPY pnpm-lock.yaml package.json pnpm-workspace.yaml ./
COPY frontend/package.json frontend/
RUN pnpm install --frozen-lockfile --filter @wpnotes/frontend
COPY frontend/ frontend/
RUN pnpm --filter @wpnotes/frontend build

FROM node:20-alpine
WORKDIR /app
COPY --from=builder /app/frontend/.next/standalone ./
COPY --from=builder /app/frontend/.next/static ./.next/static
COPY --from=builder /app/frontend/public ./public
ENV NODE_ENV=production
EXPOSE 3000
CMD ["node", "server.js"]
