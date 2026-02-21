# Пачка API

[![CI](https://github.com/pachca/openapi/actions/workflows/check.yml/badge.svg)](https://github.com/pachca/openapi/actions/workflows/check.yml)
[![npm](https://img.shields.io/npm/v/@pachca/sdk)](https://www.npmjs.com/package/@pachca/sdk)
[![PyPI](https://img.shields.io/pypi/v/pachca)](https://pypi.org/project/pachca/)
[![License: MIT](https://img.shields.io/badge/License-MIT-yellow.svg)](LICENSE)

Репозиторий содержит OpenAPI-спецификацию, SDK для 5 языков и AI-скиллы для [Pachca API](https://dev.pachca.com) — API корпоративного мессенджера Пачка. Используйте для автоматизации: отправки сообщений, управления каналами и сотрудниками, настройки ботов, работы с задачами и аудитом событий.

**Документация**: https://dev.pachca.com · **OpenAPI**: https://dev.pachca.com/openapi.yaml · **Changelog**: https://dev.pachca.com/guides/updates · **Postman/Bruno**: https://dev.pachca.com/pachca.postman_collection.json

## Agent Skills

AI-агенты могут использовать скиллы для работы с API Пачки — пошаговые инструкции с curl-примерами, обработкой ошибок и ограничениями.

### Установка (40+ агентов)

```bash
npx skills add pachca/openapi
```

### Совместимость

| Агент | Путь |
|-------|------|
| Claude Code | `.claude/skills/` |
| Cursor | `.cursor/skills/` |
| Codex CLI | `AGENTS.md` в корне репо |
| OpenCode | `skills/` |
| Windsurf, Continue, 35+ других | Автоопределение |
| Ручная установка | `cp -r skills/pachca-* <path>` |

### Доступные скиллы

| Скилл | Описание |
|-------|----------|
| `pachca-profile` | Профиль, статус, кастомные поля |
| `pachca-users` | Сотрудники и теги (группы) |
| `pachca-chats` | Каналы, беседы, участники, экспорт |
| `pachca-messages` | Сообщения, треды, файлы, реакции, кнопки |
| `pachca-bots` | Боты, вебхуки, unfurling |
| `pachca-forms` | Интерактивные формы |
| `pachca-tasks` | Напоминания (задачи) |
| `pachca-security` | Аудит событий, DLP |

### Как скиллы помогают агенту

**Без скилла** — агент не знает порядок вызовов:

```
> Отправь файл report.pdf в тред сообщения 123
Агент: POST /messages с file=@report.pdf  ← неверно, файлы не передаются inline
```

**Со скиллом** — агент следует пошаговому сценарию:

```
> Отправь файл report.pdf в тред сообщения 123
1. POST /uploads → key, direct_url, policy, подпись
2. POST direct_url (multipart) → загрузка файла на S3
3. POST /messages/123/thread → thread.id
4. POST /messages с entity_type:"thread", entity_id:thread.id, files:[{key:...}]
```

Скиллы генерируются автоматически из OpenAPI-спеки при `bun turbo build`. Устанавливайте только из официального репозитория — скиллы содержат исключительно инструкции (нет исполняемого кода).

## SDK

| Язык | Пакет | Реестр |
|------|-------|--------|
| [TypeScript](sdk/typescript/README.md) | `@pachca/sdk` | npm |
| [Python](sdk/python/README.md) | `pachca` | PyPI |
| [Go](sdk/go/README.md) | `github.com/pachca/go-sdk` | Go modules |
| [Kotlin](sdk/kotlin/README.md) | `com.pachca:sdk` | JitPack |
| [Swift](sdk/swift/README.md) | `PachcaSDK` | SPM |

**Пример (TypeScript):**

```typescript
import { createClient } from '@pachca/sdk';

const client = createClient({
  baseUrl: 'https://api.pachca.com/api/v1',
  headers: { Authorization: 'Bearer YOUR_TOKEN' },
});

const { data, error } = await client.GET('/users');
```

SDK генерируются из `openapi.yaml` и публикуются автоматически при пуше в `main`: генерация → коммит `chore: regenerate SDK v{VERSION}` → теги → npm, PyPI, JitPack. Swift и Go — через Git-теги.

## Тестирование

| Инструмент | Как использовать |
|-----------|-----------------|
| [Postman Collection](https://dev.pachca.com/pachca.postman_collection.json) | Скачайте и импортируйте в Postman |
| Bruno | Скачайте тот же файл и импортируйте: File → Import → Postman Collection |

## AI-интеграции

| Файл | Содержимое |
|------|------------|
| [`/llms.txt`](https://dev.pachca.com/llms.txt) | Краткий индекс: все endpoint'ы со ссылками |
| [`/llms-full.txt`](https://dev.pachca.com/llms-full.txt) | Полная документация: гайды + endpoint'ы с параметрами |
| [`/skill.md`](https://dev.pachca.com/skill.md) | AI-agent skill: workflows, capabilities, ссылки |
| `/{section}/{action}.md` | Отдельный .md для каждого endpoint'а и гайда |

[Context7](https://context7.com/pachca/openapi) — AI-native document discovery.

Все файлы доступны с `Access-Control-Allow-Origin: *` и кешируются через CDN.

## Разработка

```bash
bun install

bun turbo dev            # Разработка с hot reload (localhost:3000)
bun turbo build          # Production сборка
bun turbo check          # Все проверки (lint + typecheck + knip + format)
bun turbo generate       # TypeSpec → openapi.yaml + SDK
```

## CI/CD

| Workflow | Триггер | Что делает |
|----------|---------|------------|
| `check.yml` | PR в `main` | `bun turbo check` |
| `sdk.yml` | Push в `main` | Генерация SDK → коммит → теги → публикация |
| `deploy.yml` | Push в `main` | Docker build → GitLab registry → SSH deploy |
| `gitlab.yml` | Push в `main` | Зеркало в GitLab |

## Контакты

- [GitHub Issues](https://github.com/pachca/openapi/issues)
- support@pachca.com · team@pachca.com

---

<details>
<summary>Для мейнтейнеров: архитектура и внутреннее устройство</summary>

## Структура монорепозитория

```
├── apps/
│   └── docs/              # Next.js 16 сайт документации (@pachca/docs)
├── packages/
│   └── spec/              # TypeSpec спецификация (@pachca/spec)
├── sdk/                   # SDK для 5 языков
│   ├── typescript/        # openapi-typescript → npm
│   ├── python/            # openapi-python-client → PyPI
│   ├── go/                # oapi-codegen → Go modules
│   ├── kotlin/            # openapi-generator → JitPack
│   └── swift/             # swift-openapi-generator → SPM
├── .github/workflows/     # CI/CD (check, sdk, deploy, gitlab)
├── Package.swift          # Корневой Swift Package (копируется из sdk/swift при CI)
├── jitpack.yml            # JitPack конфиг для Kotlin (JDK 17)
├── Dockerfile             # Multi-stage Docker-сборка docs
├── context7.json          # Context7 AI document discovery
├── turbo.json             # Turborepo пайплайн
└── package.json           # Корневой (workspaces: apps/*, packages/*, sdk/*)
```

## Пайплайн данных

```
typespec.tsp (packages/spec)
    │
    │ tsp compile
    ▼
openapi.yaml ──────────────────────────┐
    │                                  │
    ▼                                  ▼
apps/docs                           sdk/* (5 языков)
    │                                  │
    │ generate-llms                    │ CI: generate + publish
    │ next build                       ▼
    ▼                                npm, PyPI, JitPack, SPM, Go modules
  Сайт + llms.txt + llms-full.txt
  + skill.md + per-endpoint .md
  + Agent Skills (skills/, .claude/, .cursor/, AGENTS.md, .well-known/)
  + OG-изображения + sitemap + RSS
```

## Turborepo пайплайн

| Задача | Зависит от | Кешируется |
|--------|------------|------------|
| `generate` | `setup` | да (inputs: tsp + yaml config → outputs: openapi.yaml, generated/) |
| `generate-llms` | `@pachca/spec#generate` | да (→ llms.txt, llms-full.txt, skill.md, *.md, Agent Skills) |
| `build` | `@pachca/spec#generate`, `generate-llms` | да (→ .next/) |
| `dev` | `@pachca/spec#generate`, `generate-llms` | нет (persistent) |
| `check` | `lint`, `typecheck`, `knip`, `format:check` | нет |

## Архитектура docs (apps/docs)

Next.js 16 (App Router, Turbopack) + MDX + FlexSearch (+ русские синонимы/стемминг) + Shiki + Mermaid + GSAP.

Всё динамическое — навигация, маршруты, поиск, примеры кода генерируются из OpenAPI.

### Что генерируется автоматически

| Действие | Результат |
|----------|-----------|
| Добавляете endpoint в TypeSpec | Страница + навигация + поиск + llms.txt + .md-файл |
| Удаляете endpoint | Всё исчезает |
| Добавляете тег | Новая секция в навигации |
| Меняете порядок тегов | Меняется порядок секций |
| Меняете `servers[0].url` | Обновляются все примеры кода |
| Добавляете гайд (.mdx) | Навигация + поиск + llms.txt + RSS |
| Добавляете обновление | Badge «Новое» (< 7 дней) + RSS feed |

### Маршрутизация

| URL | Источник |
|-----|----------|
| `/` | `content/home.mdx` |
| `/guides/{slug}` | `content/guides/{slug}.mdx` |
| `/{section}/{action}` | OpenAPI endpoint (динамически из тегов и путей) |
| `/{section}/{action}.md` | Статический markdown для endpoint'а |
| `/guides/{slug}.md` | Статический markdown для гайда |
| `/.md` | Rewrite → `/index.md` |
| `/api/og` | Генерация OG-изображений |
| `/api/search` | API поиска |
| `/feed.xml` | RSS-лента обновлений |
| `/sitemap.xml` | Карта сайта |
| `/openapi.yaml` | OpenAPI спецификация |
| `/pachca.postman_collection.json` | Postman/Bruno коллекция |

### URL маппинг

| Паттерн | URL | Пример |
|---------|-----|--------|
| `GET /items` | `/{section}/list` | `/messages/list` |
| `POST /items` | `/{section}/create` | `/messages/create` |
| `GET /items/{id}` | `/{section}/get` | `/users/get` |
| `PUT /items/{id}` | `/{section}/update` | `/chats/update` |
| `DELETE /items/{id}` | `/{section}/delete` | `/chats/delete` |
| Sub-resources | `/{section}/list-{sub}` | `/messages/list-reactions` |
| Специальные | По действию | `/messages/pin`, `/messages/unpin` |

Секция определяется из OpenAPI-тега через `tagToUrlSegment()`. Скрипт `check-url-conflicts.mjs` проверяет конфликты.

### Поиск

FlexSearch с `tokenize: 'forward'`. Русский язык: синонимы (`участники` → `members, users`), стемминг (`участников` → `участник`), стоп-слова, action patterns (`отправить` → `create/post`).

### Ссылки на API методы в тексте

```md
[Список сотрудников](GET /users)
[Новое сообщение](POST /messages)
```

Ссылки резолвятся в реальные URL и рендерятся с method-badge.

### Специальные теги (превращаются в callout-блоки)

- `#admin_access_token_required`
- `#owner_access_token_required`
- `#corporation_price_only`
- `#files_not_supported`
- `#unfurling_bot_access_token_required`
- `#bot_access_token_required`
- `#access_token_not_required`

### MDX компоненты

Регистрируются в `components/mdx/mdx-components.tsx` и `components/api/markdown-content.tsx`.

```mdx
<SchemaBlock name="MessageWebhookPayload" />
<ApiCodeExample operationId="SecurityOperations_getAuditEvents" />
<Info>Информация</Info>
<Warning>Предупреждение</Warning>
<Danger>Опасно</Danger>
<Steps><Step title="Шаг 1">Описание</Step></Steps>
<Limit title="Название" limit="~4" period="1 сек" entity="chat_id" />
<Updates />
<GuideCards />
<ApiCards />
<Mermaid chart={`graph TD; A-->B;`} />
```

### Как добавить новый гайд

Создайте `content/guides/{slug}.mdx` с frontmatter:

```mdx
---
title: Название гайда
description: Краткое описание для SEO
---
```

Добавьте путь в `lib/guides-config.ts` → гайд появится в навигации, поиске, llms.txt, RSS и получит `.md`-файл.

### Обновление API (changelog)

В `content/guides/updates.mdx`:

```md
<!-- update:2025-12-01 -->
## Название обновления

- [Новый метод](POST /messages)
```

Badge «Новое» показывается < 7 дней. Попадает в RSS feed.

### Кастомная схема для гайда

Создайте `lib/schemas/guides/{Name}.json` → используйте `<SchemaBlock name="Name" />`. Индексируется для поиска и попадает в `llms-full.txt`.

### Настройки

- `lib/display-config.ts` — `showSchemaExamples` (по умолчанию `false`)
- `redirects.ts` — permanent (308) редиректы

### Безопасность (next.config.ts)

HSTS (2 года, preload), X-Frame-Options: DENY, nosniff, Permissions-Policy. CORS разрешён для `llms.txt`, `llms-full.txt`, `skill.md`, `*.md`, `/.well-known/skills/*`.

</details>
