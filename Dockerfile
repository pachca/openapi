FROM oven/bun:1.3.4 AS builder
WORKDIR /app

COPY bun.lock package.json turbo.json ./
COPY apps/docs/package.json apps/docs/package.json
COPY packages/spec/package.json packages/spec/package.json
COPY packages/cli/package.json packages/cli/package.json
COPY packages/openapi-parser/package.json packages/openapi-parser/package.json
COPY packages/generator/package.json packages/generator/package.json

RUN bun install

COPY . .

RUN bun x turbo check --filter=@pachca/docs
RUN bun x turbo build --filter=@pachca/docs

FROM oven/bun:1.3.4 AS runner
WORKDIR /app
ENV NODE_ENV=production
ENV PORT=3000
ENV HOST=0.0.0.0

COPY --from=builder /app/apps/docs/.next/standalone ./
COPY --from=builder /app/apps/docs/.next/static ./apps/docs/.next/static
COPY --from=builder /app/apps/docs/public ./apps/docs/public

EXPOSE 3000

CMD ["bun", "run", "apps/docs/server.js"]