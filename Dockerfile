FROM oven/bun:1.3.4 AS builder
WORKDIR /app

RUN apt-get update && apt-get install -y nodejs npm && rm -rf /var/lib/apt/lists/*

COPY bun.lock package.json turbo.json ./
COPY apps/docs/package.json apps/docs/package.json
COPY packages/spec/package.json packages/spec/package.json

RUN bun install
RUN npm install -g turbo

COPY . .

RUN turbo check
RUN turbo build --filter=@pachca/docs

FROM oven/bun:1.3.4 AS runner
WORKDIR /app
ENV NODE_ENV=production
ENV PORT=3000
ENV HOST=0.0.0.0

COPY --from=builder /app /app

EXPOSE 3000

CMD ["bun", "turbo", "start", "--filter=@pachca/docs"]
