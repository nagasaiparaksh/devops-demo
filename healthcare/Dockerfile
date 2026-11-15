# ---- stage 1: dependencies ----
FROM node:22-alpine AS base
WORKDIR /app
COPY package*.json ./
RUN npm install
COPY server.js test.js ./

# ---- stage 2: unit + security tests (build fails if they fail) ----
FROM base AS test
RUN npm test

# ---- stage 3: minimal, non-root runtime image ----
FROM node:22-alpine AS runtime
WORKDIR /app
ENV NODE_ENV=production
COPY package*.json ./
RUN npm install --omit=dev && npm cache clean --force
COPY --chown=node:node server.js ./
USER node
EXPOSE 3000
CMD ["node", "server.js"]
