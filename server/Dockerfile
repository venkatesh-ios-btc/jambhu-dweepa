# Plain Node API — avoids Railway Railpack/Caddy auto-detection issues.
FROM node:20-bookworm-slim
WORKDIR /app

COPY package.json package-lock.json ./
RUN npm ci --omit=dev

COPY . .

ENV NODE_ENV=production
ENV HOST=0.0.0.0

# Railway sets PORT; keep EXPOSE for documentation.
EXPOSE 8080

CMD ["node", "server.js"]
