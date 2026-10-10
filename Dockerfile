FROM node:24-alpine AS build
WORKDIR /app
COPY package.json package-lock.json ./
RUN npm ci --no-audit --no-fund
COPY . .
ENV NEXT_TELEMETRY_DISABLED=1
RUN npm run build

FROM node:24-alpine
WORKDIR /app
ENV NODE_ENV=production NEXT_TELEMETRY_DISABLED=1 HOST=0.0.0.0 PORT=3100
COPY --from=build --chown=node:node /app /app
RUN mkdir -p /app/.cache && chown -R node:node /app/.cache
USER node
EXPOSE 3100
CMD ["npm", "start"]
