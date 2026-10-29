FROM node:24-alpine AS build
ENV NEXT_TELEMETRY_DISABLED=1 COREPACK_ENABLE_DOWNLOAD_PROMPT=0
RUN corepack enable
WORKDIR /web
COPY package.json pnpm-lock.yaml pnpm-workspace.yaml ./
RUN --mount=type=cache,id=pnpm-store,target=/root/.local/share/pnpm/store \
    pnpm install --frozen-lockfile
COPY . .
# Inlined into the bundle when Next builds.
ARG NEXT_PUBLIC_COMMIT_SHA=
ARG NEXT_PUBLIC_SITE_URL=http://localhost:3150
# Next resolves rewrites when it builds, so /api/* points at compose's api for good.
ARG BLOG_API_URL=http://api:8150
ENV NEXT_PUBLIC_COMMIT_SHA=$NEXT_PUBLIC_COMMIT_SHA \
    NEXT_PUBLIC_SITE_URL=$NEXT_PUBLIC_SITE_URL \
    BLOG_API_URL=$BLOG_API_URL
RUN pnpm build

FROM node:24-alpine
ARG BLOG_API_URL=http://api:8150
ENV NODE_ENV=production NEXT_TELEMETRY_DISABLED=1 HOSTNAME=0.0.0.0 PORT=3150 \
    BLOG_API_URL=$BLOG_API_URL
WORKDIR /app
COPY --from=build /web/.next/standalone ./
COPY --from=build /web/.next/static ./.next/static
RUN mkdir -p .next/cache && chown node:node .next/cache
USER node
EXPOSE 3150
CMD ["node", "server.js"]
