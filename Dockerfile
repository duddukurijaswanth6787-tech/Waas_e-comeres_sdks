FROM node:20-alpine AS builder

WORKDIR /app

COPY package.json package-lock.json ./
COPY packages/sdk/package.json ./packages/sdk/
COPY apps/api/package.json ./apps/api/

RUN npm ci

COPY packages/sdk ./packages/sdk
COPY apps/api ./apps/api
COPY tsconfig.base.json tsconfig.json ./

RUN npm run build:sdk
RUN npx prisma generate --schema=apps/api/prisma/schema.prisma
RUN npm run build:api

# Production Runner
FROM node:20-alpine AS runner

WORKDIR /app
ENV NODE_ENV=production
ENV PORT=5000

COPY --from=builder /app ./

EXPOSE 5000

CMD ["node", "apps/api/dist/server.js"]
