FROM oven/bun:1.3-alpine
WORKDIR /app
COPY package.json ./
RUN bun install --production
COPY apps ./apps
COPY src ./src
RUN mkdir -p /data && chown -R bun:bun /data /app
USER bun
CMD ["bun","apps/api.ts"]
