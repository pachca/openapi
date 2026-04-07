# Пачка API

[![CI](https://github.com/pachca/openapi/actions/workflows/check.yml/badge.svg)](https://github.com/pachca/openapi/actions/workflows/check.yml)
[![npm](https://img.shields.io/npm/v/@pachca/sdk)](https://www.npmjs.com/package/@pachca/sdk)
[![npm](https://img.shields.io/npm/v/@pachca/cli)](https://www.npmjs.com/package/@pachca/cli)
[![npm](https://img.shields.io/npm/v/@pachca/generator)](https://www.npmjs.com/package/@pachca/generator)
[![npm](https://img.shields.io/npm/v/n8n-nodes-pachca)](https://www.npmjs.com/package/n8n-nodes-pachca)
[![PyPI](https://img.shields.io/pypi/v/pachca-sdk)](https://pypi.org/project/pachca-sdk/)
[![License: MIT](https://img.shields.io/badge/License-MIT-yellow.svg)](LICENSE)

Unified Developer Experience Platform для [Pachca API](https://dev.pachca.com) — API корпоративного мессенджера Пачка. Один источник (TypeSpec + workflows.ts + examples.ts) генерирует артефакты для всех каналов: web docs, CLI, SDK, n8n node, agent skills, LLM context.

**Документация**: https://dev.pachca.com · **OpenAPI**: https://dev.pachca.com/openapi.yaml · **Авторизация**: https://dev.pachca.com/api/authorization · **Changelog**: https://dev.pachca.com/updates · **Postman/Bruno**: https://dev.pachca.com/pachca.postman_collection.json

## CLI

```bash
# Zero-install (npx)
npx @pachca/cli messages create --entity-id=123 --content="Привет!" --token $PACHCA_TOKEN

# For regular use
npm install -g @pachca/cli
pachca auth login
pachca messages create --entity-id=123 --content="Привет!"
pachca guide "отправить сообщение"  # CLI guide
```

Все методы API доступны как команды. Типизированные флаги, валидация, 4 формата вывода (table, JSON, YAML, CSV), курсорная пагинация, несколько профилей авторизации, неинтерактивный режим для CI и AI-агентов.

**Документация**: https://dev.pachca.com/guides/cli

## Agent Skills

AI-агенты используют CLI-first скиллы с пошаговыми сценариями, zero-friction авторизацией и автоматической проверкой прав.

### Установка (40+ агентов)

```bash
npx skills add pachca/openapi
```

### Совместимость

| Агент | Путь |
|-------|------|
| Claude Code | `CLAUDE.md` → `AGENTS.md` |
| Codex CLI | `AGENTS.md` |
| OpenCode | `skills/` |
| Cursor, Windsurf, Continue, 40+ других | Автоопределение |
| Ручная установка | `cp -r skills/pachca-* <path>` |

### Доступные скиллы

| Скилл | Описание |
|-------|----------|
| `pachca-profile` | Профиль, статус, кастомные поля |
| `pachca-users` | Сотрудники и теги (группы) |
| `pachca-chats` | Каналы, беседы, участники, экспорт |
| `pachca-messages` | Сообщения, файлы, реакции, кнопки |
| `pachca-bots` | Боты, вебхуки, unfurling |
| `pachca-forms` | Интерактивные формы |
| `pachca-tasks` | Напоминания (задачи) |
| `pachca-search` | Полнотекстовый поиск |
| `pachca-security` | Аудит событий, DLP |
| `pachca` | Router skill — маршрутизация к нужному скиллу |

### Как скиллы помогают агенту

**Без скилла** — агент не знает порядок вызовов:

```
> Отправь файл report.pdf в тред сообщения 123
Агент: POST /messages с file=@report.pdf  ← неверно, файлы не передаются inline
```

**Со скиллом** — агент выполняет CLI-команды по сценарию:

```
> Отправь файл report.pdf в тред сообщения 123
1. pachca uploads create --file-name=report.pdf --file-size=...
2. curl <direct_url> -F ... (загрузка на S3)
3. pachca threads create --message-id=123
4. pachca messages create --entity-type=thread --entity-id=<thread_id> --files='[{"key":"..."}]'
```

Скиллы генерируются автоматически из OpenAPI-спеки при `bun turbo build`. Устанавливайте только из официального репозитория — скиллы содержат исключительно инструкции (нет исполняемого кода).

## n8n

Community node для [n8n](https://n8n.io/) — 18 ресурсов, 65+ операций, Pachca Trigger с авторегистрацией вебхука.

```bash
# В n8n: Settings > Community Nodes > n8n-nodes-pachca
npm install n8n-nodes-pachca
```

Автоматически генерируется из OpenAPI-спецификации, полная обратная совместимость с v1.

**Документация**: [dev.pachca.com/guides/n8n](https://dev.pachca.com/guides/n8n/overview) · **[README](integrations/n8n/README.md)**

## SDK

| Язык | Пакет | Реестр |
|------|-------|--------|
| [TypeScript](sdk/typescript/README.md) | `@pachca/sdk` | npm |
| [Python](sdk/python/generated/README.md) | `pachca-sdk` | PyPI |
| [Go](sdk/go/README.md) | `github.com/pachca/go-sdk` | Go modules |
| [Kotlin](sdk/kotlin/README.md) | `com.pachca:sdk` | JitPack |
| [Swift](sdk/swift/README.md) | `PachcaSDK` | SPM |
| [C#](sdk/csharp/generated/README.md) | `Pachca.Sdk` | NuGet |

Все SDK следуют единому паттерну: `PachcaClient(token)` → `client.service.method(request)`.

**Конвенции:**
- **Вход**: path-параметры и body-поля (если ≤2) разворачиваются в аргументы метода. Иначе — один объект-запрос.
- **Выход**: если ответ API содержит единственное поле `data`, SDK возвращает его содержимое напрямую.
- Имена сервисов, методов и полей соответствуют operationId и параметрам из OpenAPI.

**Пример (TypeScript):**

```typescript
import { PachcaClient } from "@pachca/sdk";

const pachca = new PachcaClient("YOUR_TOKEN");
const users = await pachca.users.listUsers();
await pachca.reactions.addReaction(messageId, { code: "👍" }); // ≤2 поля → аргументы
```

SDK генерируются из `openapi.yaml` и публикуются автоматически при пуше в `main`: генерация → коммит `chore: regenerate SDK v{VERSION}` → теги → npm, PyPI, JitPack. Swift и Go — через Git-теги.

### Генератор

Вместо готового SDK можно сгенерировать типизированный клиент прямо в своём проекте:

```bash
npx @pachca/generator --output ./generated --lang typescript
npx @pachca/generator --output ./generated --lang typescript,python,go,kotlin,swift,csharp
```

| Параметр | Описание |
|----------|----------|
| `--spec <path\|url>` | Путь или URL к OpenAPI 3.0 YAML (по умолчанию: `https://dev.pachca.com/openapi.yaml`) |
| `--output <dir>` | Директория для сгенерированного кода |
| `--lang <langs>` | Языки через запятую: `typescript`, `python`, `go`, `kotlin`, `swift`, `csharp` |
| `--examples` | Генерировать `examples.json` с примерами вызовов |

**Документация**: https://dev.pachca.com/guides/sdk/overview

## Тестирование

| Инструмент | Как использовать |
|-----------|-----------------|
| [Scalar](https://client.scalar.com/?url=https://dev.pachca.com/openapi.yaml) | Онлайн-клиент прямо в браузере — без установки |
| [Postman Collection](https://dev.pachca.com/pachca.postman_collection.json) | Скачайте и импортируйте в Postman |
| Bruno | Скачайте тот же файл и импортируйте: File → Import → Postman Collection |

## AI-интеграции

| Файл | Содержимое |
|------|------------|
| [`/llms.txt`](https://dev.pachca.com/llms.txt) | Краткий индекс: все endpoint'ы со ссылками |
| [`/llms-full.txt`](https://dev.pachca.com/llms-full.txt) | Полная документация: гайды + endpoint'ы с параметрами |
| [`/skill.md`](https://dev.pachca.com/skill.md) | AI-agent skill: workflows, capabilities, ссылки |
| `/api/{section}/{action}.md` | Отдельный .md для каждого endpoint'а и гайда |

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
| `generator.yml` | Push в `main` | Snapshot-тесты + npm publish `@pachca/generator` |
| `n8n.yml` | Push/PR в `main` | Генерация n8n node → тест → npm publish → GitHub Release |
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
│   ├── spec/              # TypeSpec спецификация + workflows.ts + examples.ts (@pachca/spec)
│   ├── generator/         # SDK код-генератор для 6 языков (@pachca/generator)
│   ├── openapi-parser/    # Парсер OpenAPI-спеки (@pachca/openapi-parser)
│   └── cli/               # CLI для работы с API (@pachca/cli)
├── sdk/                   # SDK для 6 языков (генерируются @pachca/generator)
│   ├── typescript/        # npm
│   ├── python/            # PyPI
│   ├── go/                # Go modules
│   ├── kotlin/            # JitPack
│   ├── swift/             # SPM
│   └── csharp/            # NuGet
├── integrations/
│   └── n8n/               # n8n community node (генерируется из OpenAPI)
├── skills/                # Agent Skills (генерируются → apps/docs/public/.well-known/skills/)
├── .github/workflows/     # CI/CD (check, sdk, generator, n8n, deploy, gitlab)
├── Package.swift          # Корневой Swift Package (копируется из sdk/swift при CI)
├── jitpack.yml            # JitPack конфиг для Kotlin (JDK 17)
├── Dockerfile             # Multi-stage Docker-сборка docs
├── context7.json          # Context7 AI document discovery
├── turbo.json             # Turborepo пайплайн
└── package.json           # Корневой (workspaces: apps/*, apps/*/*, packages/*, sdk/*, integrations/*)
```

## Пайплайн данных

```
typespec.tsp (packages/spec)
    │
    │ tsp compile
    ▼
openapi.yaml ──────────────────────────┬──────────────────────┐
    │                                  │                      │
    │ overlay:apply                    ▼                      ▼
    ▼                               sdk/* (6 языков)     integrations/n8n
openapi.en.yaml                        │                      │
    │                                  │ CI: generate         │ generate-n8n
    │                                  │ + publish            ▼
    │                                  ▼                   npm (n8n-nodes-pachca)
    │                                npm, PyPI, JitPack,
    │                                SPM, Go modules
    ▼
apps/docs
    │
    │ generate-llms, generate-cli, next build
    ▼
  Сайт + llms.txt + llms-full.txt
  + skill.md + per-endpoint .md
  + Agent Skills (skills/, AGENTS.md, .well-known/)
  + scenarios.json + pachca.postman_collection.json
  + CLI examples (10-й код-генератор)
  + OG-изображения + sitemap + RSS

workflows.ts + examples.ts (packages/spec — единый источник сценариев)
    │
    ├──→ Web (страница сценариев с поиском)
    ├──→ CLI (pachca guide)
    ├──→ Skills (CLI-сценарии в SKILL.md)
    └──→ n8n (примеры значений в нодах)
```

## Turborepo пайплайн

| Задача | Зависит от | Кешируется |
|--------|------------|------------|
| `setup` | — | нет |
| `generate` | `setup` | да (inputs: tsp + yaml config → outputs: openapi.yaml, generated/) |
| `overlay:apply` | `@pachca/spec#generate` | да (→ openapi.en.yaml) |
| `overlay:validate` | `@pachca/spec#generate`, `overlay:apply` | да |
| `generate-llms` | `@pachca/spec#generate` | да (→ llms.txt, llms-full.txt, skill.md, *.md, Agent Skills) |
| `generate-cli` | `@pachca/spec#generate` | да (→ CLI commands, data/*.json) |
| `generate-n8n` | `@pachca/spec#generate`, `overlay:apply` | да (→ n8n nodes, credentials) |
| `test` | `generate-cli`, `generate-n8n` | да |
| `build` | `generate`, `overlay:apply`, `generate-llms`, `generate-cli`, `generate-n8n` | да (→ .next/, dist/) |
| `dev` | `@pachca/spec#generate`, `generate-llms` | нет (persistent) |
| `check` | `lint`, `typecheck`, `knip`, `format:check`, `test`, `overlay:validate` | нет |
| `check-urls` | `@pachca/spec#generate` | да |
| `start` | `build` | нет (persistent) |

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
| `/guides/{category}/{slug}` | `content/guides/{category}/{slug}.mdx` |
| `/api/{slug}` | `content/api/{slug}.mdx` (авторизация, пагинация и др.) |
| `/api/{section}/{action}` | OpenAPI endpoint (динамически из тегов и путей) |
| `/api/{section}/{action}.md` | Статический markdown для endpoint'а |
| `/updates` | `content/updates.mdx` |
| `/updates/{date}` | Обновление за конкретную дату |
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
| `GET /items` | `/api/{section}/list` | `/api/messages/list` |
| `POST /items` | `/api/{section}/create` | `/api/messages/create` |
| `GET /items/{id}` | `/api/{section}/get` | `/api/users/get` |
| `PUT /items/{id}` | `/api/{section}/update` | `/api/chats/update` |
| `DELETE /items/{id}` | `/api/{section}/delete` | `/api/chats/delete` |
| Sub-resources | `/api/{section}/list-{sub}` | `/api/messages/list-reactions` |
| Специальные | По действию | `/api/messages/pin`, `/api/messages/unpin` |

Секция определяется из OpenAPI-тега через `tagToUrlSegment()`. Скрипт `check-url-conflicts.mjs` проверяет конфликты.

### Поиск

FlexSearch с `tokenize: 'forward'`. Русский язык: синонимы (`участники` → `members, users`), стемминг (`участников` → `участник`), стоп-слова, action patterns (`отправить` → `create/post`).

### Ссылки на API методы в тексте

```md
[Список сотрудников](GET /users)
[Новое сообщение](POST /messages)
```

Ссылки резолвятся в реальные URL и рендерятся с method-badge.

### Требования к методам (x-requirements)

Ограничения эндпоинтов описываются через `@extension("x-requirements", ...)` в TypeSpec.
Попадают в OpenAPI YAML как `x-requirements` и рендерятся в трёх местах: в UI как бейджи, в Agent Skills рядом с каждой операцией, в per-endpoint `.md`-файлах.

Поля:
- `scope` — требуемый скоуп токена (например `"messages:read"`)
- `plan` — требуемый тариф (например `"corporation"`)
- `auth` — `false` если авторизация не нужна

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

Создайте `content/guides/{slug}.mdx` (или `content/guides/{category}/{slug}.mdx`, `content/api/{slug}.mdx`) с frontmatter:

```mdx
---
title: Название гайда
description: Краткое описание для SEO
---
```

Добавьте путь в `lib/tabs-config.ts` → гайд появится в навигации, поиске, llms.txt, RSS и получит `.md`-файл.

### Обновление API (changelog)

В `content/updates.mdx`:

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

HSTS (2 года, preload), X-Frame-Options: DENY, nosniff, Permissions-Policy. CORS разрешён для `llms.txt`, `llms-full.txt`, `skill.md`, `*.md`, `/.well-known/skills/*`, `openapi.yaml`, `pachca.postman_collection.json`, `scenarios.json`.

</details>
