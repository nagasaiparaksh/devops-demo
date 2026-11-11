# ---- stage 1: install deps ----
FROM node:20-alpine AS base
WORKDIR /app
COPY app/package*.json ./
RUN npm install
COPY app/ .

# ---- stage 2: run unit tests (build fails if tests fail) ----
FROM base AS test
RUN npm test

# ---- stage 3: small runtime image ----
FROM node:20-alpine AS runtime
WORKDIR /app
ENV NODE_ENV=production
COPY app/package*.json ./
RUN npm install --omit=dev && npm cache clean --force
COPY app/server.js ./
USER node
EXPOSE 3000
CMD ["node", "server.js"]
