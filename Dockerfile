# syntax=docker/dockerfile:1

# ---- build: install deps + produce static bundle ----
FROM node:24.15.0-slim AS build
ENV PNPM_HOME="/pnpm"
ENV PATH="$PNPM_HOME:$PATH"
ENV CI=true
# pin pnpm to the version used locally (corepack default pulls a newer one)
RUN corepack enable && corepack prepare pnpm@10.33.0 --activate
WORKDIR /app
COPY package.json pnpm-lock.yaml ./
RUN --mount=type=cache,id=pnpm,target=/pnpm/store pnpm install --frozen-lockfile
COPY . .
# no VITE_API_URL -> the app calls the API at the relative path /api (same origin),
# which the edge nginx proxies to the backend. Keeps the image env-agnostic.
RUN pnpm build

# ---- runtime: nginx serving the SPA ----
FROM nginx:1.27-alpine AS runtime
COPY nginx.conf /etc/nginx/conf.d/default.conf
COPY --from=build /app/dist /usr/share/nginx/html
EXPOSE 80
CMD ["nginx", "-g", "daemon off;"]
