FROM node:18-alpine AS base
WORKDIR /app

# Build-time env (picked up by Next.js at build)
ARG NEXT_PUBLIC_API_URL
ARG NEXTAUTH_URL
ARG NEXTAUTH_SECRET
ARG GOOGLE_CLIENT_ID
ARG GOOGLE_CLIENT_SECRET
ARG EMAIL_SERVER
ARG EMAIL_FROM

# Install/build need devDependencies (tailwind, postcss). Use development during build.
ENV NODE_ENV=development \
    PORT=3000 \
    NEXT_TELEMETRY_DISABLED=1 \
    NEXT_PUBLIC_API_URL=${NEXT_PUBLIC_API_URL} \
    NEXTAUTH_URL=${NEXTAUTH_URL} \
    NEXTAUTH_SECRET=${NEXTAUTH_SECRET} \
    GOOGLE_CLIENT_ID=${GOOGLE_CLIENT_ID} \
    GOOGLE_CLIENT_SECRET=${GOOGLE_CLIENT_SECRET} \
    EMAIL_SERVER=${EMAIL_SERVER} \
    EMAIL_FROM=${EMAIL_FROM}

# Install deps
COPY package.json package-lock.json* yarn.lock* pnpm-lock.yaml* ./
RUN if [ -f package-lock.json ]; then npm ci --no-audit --no-fund; \
    elif [ -f yarn.lock ]; then yarn --frozen-lockfile; \
    elif [ -f pnpm-lock.yaml ]; then corepack enable && pnpm i --frozen-lockfile; \
    else npm i --no-audit --no-fund; fi

# Copy sources and build
COPY . .
# Build Next.js
RUN npm run build

# Switch to production for runtime
ENV NODE_ENV=production

EXPOSE 3000
CMD ["npm","start"]
