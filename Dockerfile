FROM oven/bun:1.3.4 AS builder
WORKDIR /app

COPY bun.lock package.json turbo.json ./
COPY apps/docs/package.json apps/docs/package.json
COPY packages/spec/package.json packages/spec/package.json

RUN bun install

COPY . .

RUN bun turbo check
RUN bun turbo build --filter=@pachca/docs

FROM oven/bun:1.3.4 AS runner
WORKDIR /app
ENV NODE_ENV=production
ENV PORT=3000
ENV HOST=0.0.0.0

COPY --from=builder /app /app

EXPOSE 3000

CMD ["bun", "turbo", "start", "--filter=@pachca/docs"]