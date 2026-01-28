# Пачка API Documentation

Turborepo монорепозиторий с документацией API.

## Структура

```
├── apps/docs/         # Next.js сайт (@pachca/docs)
├── packages/spec/     # TypeSpec спецификация (@pachca/spec)
└── turbo.json         # Turborepo конфиг
```

## Установка

```bash
bun install
```

## Команды

```bash
bun turbo dev          # Разработка (localhost:3000)
bun turbo build        # Production сборка
bun turbo start        # Запуск production
```

### Проверки

```bash
bun turbo check        # Все проверки (lint + typecheck + knip + format)
bun turbo lint         # ESLint
bun turbo typecheck    # TypeScript
bun turbo knip         # Неиспользуемый код
bun turbo format:check # Prettier
bun turbo check-urls   # Конфликты URL
```

### Генерация

```bash
bun turbo generate     # TypeSpec → openapi.yaml
```

## Фильтрация

```bash
bun turbo dev --filter=@pachca/docs    # Только docs
bun turbo generate --filter=@pachca/spec
```

## Как работает

1. `@pachca/spec` генерирует `openapi.yaml` из TypeSpec
2. `@pachca/docs` читает OpenAPI и строит сайт
3. Turborepo кеширует результаты и управляет зависимостями

## Добавить гайд

Создать `apps/docs/content/guides/{slug}.mdx`:

```mdx
---
title: Название
---

# Название

Контент...
```

Автоматически появится в навигации, поиске и llms.txt.

## Добавить обновление

В `apps/docs/content/guides/updates.mdx`:

```md
<!-- update:2025-12-01 -->
## Название

Описание.
```
