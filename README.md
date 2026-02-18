# Пачка API Documentation

Turborepo монорепозиторий: документация API, SDK для 5 языков, AI-интеграции.

**Сайт**: https://dev.pachca.com

## SDK

| Язык | Пакет | Реестр | Генератор |
|------|-------|--------|-----------|
| [TypeScript](sdk/typescript/README.md) | `@pachca/sdk` | npm | openapi-typescript + openapi-fetch |
| [Python](sdk/python/README.md) | `pachca` | PyPI | openapi-python-client |
| [Go](sdk/go/README.md) | `github.com/pachca/go-sdk` | Go modules | oapi-codegen |
| [Kotlin](sdk/kotlin/README.md) | `com.pachca:sdk` | JitPack | openapi-generator (jvm-ktor) |
| [Swift](sdk/swift/README.md) | `PachcaSDK` | SPM (Git tags) | swift-openapi-generator |

SDK генерируются из `openapi.yaml` и публикуются автоматически при пуше в `main` (`.github/workflows/sdk.yml`):
1. Генерация для всех 5 языков
2. Извлечение версии из `typespec.tsp`
3. Коммит `chore: regenerate SDK v{VERSION}`
4. Теги: `v{VERSION}`, `sdk/go/generated/v{VERSION}`
5. Публикация: npm (TypeScript), PyPI (Python), JitPack (Kotlin). Swift и Go — через Git-теги.

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

### Пайплайн данных

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
  + OG-изображения + sitemap + RSS
```

## Установка

```bash
bun install
```

Package manager: `bun@1.3.4` (указан в `packageManager`).

## Команды

Все команды запускаются из корня через Turborepo:

```bash
bun turbo dev            # Разработка с hot reload
bun turbo build          # Production сборка
bun turbo start          # Запуск production-сервера
```

### Проверки

```bash
bun turbo check          # Все проверки разом
bun turbo lint           # ESLint
bun turbo typecheck      # TypeScript
bun turbo knip           # Неиспользуемый код
bun turbo format:check   # Prettier
bun turbo check-urls     # Конфликты URL маппинга
```

### Генерация

```bash
bun turbo generate       # TypeSpec → openapi.yaml + SDK
```

### Фильтрация

```bash
bun turbo dev --filter=@pachca/docs
bun turbo generate --filter=@pachca/spec
```

## CI/CD

| Workflow | Триггер | Что делает |
|----------|---------|------------|
| `check.yml` | PR в `main` | `bun turbo check` |
| `sdk.yml` | Push в `main` | Генерация SDK → коммит → теги → публикация (npm, PyPI, JitPack) |
| `deploy.yml` | Push в `main` | Docker build → GitLab registry → SSH deploy на production |
| `gitlab.yml` | Push в `main` | Зеркало в GitLab |

### Деплой

Docker multi-stage: builder (bun + node, `turbo check` + `turbo build`) → runner (bun, порт 3000).
Образ пушится в `registry.primaverahq.com/mp/docs`, деплоится по SSH.

## Turborepo пайплайн

| Задача | Зависит от | Кешируется |
|--------|------------|------------|
| `generate` | `setup` | да (inputs: tsp + yaml config → outputs: openapi.yaml, generated/) |
| `generate-llms` | `@pachca/spec#generate` | да (→ llms.txt, llms-full.txt, skill.md, *.md) |
| `build` | `@pachca/spec#generate`, `generate-llms` | да (→ .next/) |
| `dev` | `@pachca/spec#generate`, `generate-llms` | нет (persistent) |
| `check` | `lint`, `typecheck`, `knip`, `format:check` | нет |

При `bun turbo build`:
1. `generate` — компиляция TypeSpec → `openapi.yaml`
2. `generate-llms` — генерация llms.txt, llms-full.txt, skill.md, per-endpoint .md
3. `build` — сборка Next.js

---

# Документация (apps/docs)

## Архитектура

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
| Добавляете обновление | Badge "Новое" (< 7 дней) + RSS feed |

### Маршрутизация

| URL | Источник |
|-----|----------|
| `/` | `content/home.mdx` |
| `/guides/{slug}` | `content/guides/{slug}.mdx` |
| `/{section}/{action}` | OpenAPI endpoint (динамически из тегов и путей) |
| `/{section}/{action}.md` | Статический markdown для endpoint'а |
| `/guides/{slug}.md` | Статический markdown для гайда |
| `/.md` | Rewrite → `/index.md` |
| `/api/og` | Генерация OG-изображений (TT Commons шрифт) |
| `/api/search` | API поиска |
| `/feed.xml` | RSS-лента обновлений |
| `/sitemap.xml` | Карта сайта |
| `/openapi.yaml` | OpenAPI спецификация |

## Структура apps/docs

```
apps/docs/
├── app/
│   ├── layout.tsx            # Корневой layout (SEO, JSON-LD, тема, sidebar)
│   ├── page.tsx              # Главная страница
│   ├── [...slug]/page.tsx    # Динамические страницы API методов
│   ├── guides/[slug]/page.tsx
│   ├── api/og/route.tsx      # OG-изображения
│   ├── api/search/route.ts   # API поиска
│   ├── feed.xml/route.ts     # RSS feed
│   ├── sitemap.xml/          # Карта сайта
│   ├── openapi.yaml/         # OpenAPI spec
│   ├── robots.txt/
│   └── not-found.tsx         # 404
├── components/
│   ├── api/                  # Компоненты API-страниц (26 файлов)
│   ├── layout/               # Layout-компоненты (15 файлов)
│   ├── mdx/                  # MDX-компоненты (6 файлов)
│   └── search/               # Поиск
├── content/
│   ├── home.mdx              # Контент главной
│   └── guides/               # 8 гайдов (webhook, errors, requests-responses,
│                              #   export, forms, dlp, audit-events, updates)
├── lib/
│   ├── openapi/              # Парсер, маппер, типы, генератор примеров, $ref resolver
│   ├── code-generators/      # 9 языков (curl, js, nodejs, python, ruby, php, go, java, dotnet)
│   ├── search/               # FlexSearch индексатор + синонимы/стемминг
│   ├── schemas/guides/       # Кастомные JSON-схемы для гайдов (5 файлов)
│   ├── og/                   # Shared-компоненты OG-изображений
│   ├── utils/                # Транслитерация, type guards
│   ├── navigation.ts         # Построение навигации из тегов + гайдов
│   ├── guides-config.ts      # Порядок гайдов, маппинг тегов
│   ├── content-loader.ts     # Загрузка MDX с frontmatter
│   ├── markdown-generator.ts # OpenAPI → markdown (для llms.txt, .md файлов)
│   ├── updates-parser.ts     # Парсер обновлений (даты, badge "Новое")
│   ├── mdx-expander.ts       # Раскрытие MDX-компонентов в markdown
│   ├── replace-special-tags.ts # Спец-теги → callout'ы
│   └── display-config.ts     # Флаги отображения (showSchemaExamples)
├── scripts/
│   ├── generate-llms.ts      # Генерация llms.txt, llms-full.txt, skill.md, *.md
│   └── check-url-conflicts.mjs # Проверка конфликтов URL
├── redirects.ts              # Редиректы (308)
└── public/                   # Статика (llms.txt, skill.md, per-endpoint .md, изображения)
```

### Ключевые библиотеки

| Библиотека | Назначение |
|------------|------------|
| `next@16.0.10` | Фреймворк (Turbopack dev, standalone output) |
| `next-mdx-remote` | Рендер MDX с кастомными компонентами |
| `shiki` | Подсветка кода |
| `mermaid` | Диаграммы |
| `flexsearch` | Полнотекстовый поиск |
| `gsap` | Анимации (смена темы, переходы страниц) |
| `@radix-ui/*` | Accordion, dropdown, tooltip |
| `lucide-react` | Иконки |

### Безопасность (next.config.ts)

HSTS (2 года, preload), X-Frame-Options: DENY, nosniff, Permissions-Policy (камера/микрофон/гео — запрещены).

CORS разрешён только для `llms.txt`, `llms-full.txt`, `skill.md`, `*.md`.

### SEO

- JSON-LD (WebSite, SearchAction)
- Open Graph + Twitter Cards
- OG-изображения генерируются динамически (`/api/og`)
- sitemap.xml
- robots.txt
- RSS feed (`/feed.xml`)

---

# AI-интеграции

Скрипт `scripts/generate-llms.ts` генерирует при сборке:

| Файл | Содержимое |
|------|------------|
| `llms.txt` | Краткий индекс: список гайдов + все endpoint'ы со ссылками |
| `llms-full.txt` | Полная документация: все гайды + все endpoint'ы с параметрами и примерами |
| `skill.md` | AI-agent skill: авторизация, workflows, capabilities, ограничения, ссылки на гайды |
| `/{section}/{action}.md` | Отдельный .md для каждого endpoint'а |
| `/guides/{slug}.md` | Отдельный .md для каждого гайда |
| `/index.md` (→ `/.md`) | Markdown главной страницы |

[Context7](https://context7.com/pachca/openapi) — AI-native document discovery для dev-инструментов.

Все файлы отдаются с `Access-Control-Allow-Origin: *` и кешируются через CDN (s-maxage: 86400).

Ссылки объявлены в `<head>`: `llms.txt`, `llms-full.txt`, `skill.md`, `openapi.yaml`.

---

# Поиск

[FlexSearch](https://github.com/nextapps-de/flexsearch) с `tokenize: 'forward'` ("web" → "webhook").

## Что индексируется

| Источник | Данные |
|----------|--------|
| API методы | Заголовок, описание, URL, поля request/response/параметров, enum-значения |
| Гайды | Заголовок, описание, значения в backticks, поля из `<SchemaBlock>` |

## Русский язык (`lib/search/synonyms.ts`)

- **Синонимы**: рус↔англ маппинг (`участники` → `members`, `users`; `канал` → `chat`, `чат`, `беседа`)
- **Стемминг**: отсечение русских окончаний (`участников` → `участник`, `канала` → `канал`)
- **Стоп-слова**: фильтрация служебных слов (`как`, `можно`, `нужно`, `для`, `это`)
- **Action patterns**: распознавание действий (`отправить` → `create/post`, `удалить` → `delete`)
- **Цепочка**: запрос → стоп-слова → синонимы → стемминг → синонимы стемов → FlexSearch

## Скоринг

| Критерий | Очки |
|----------|------|
| Content relevance (2+ слова запроса в title+description) | +20 |
| Exact title match | +10 |
| Schema field match | +8 |
| Action intent match (action + entity) | +15 |
| Title field match | +5 |
| Code value match | +4 |
| Content relevance (1 слово) | +3 |
| Description field match | +3 |
| Guide type | +2 |
| Keywords field match | +1 |

Code-like запросы (`snake_case`, `camelCase`, `object.property`) — только точные совпадения, без synonym expansion и стемминга.

При клике на результат с `matchedValue.path` — переход + скролл к параметру (`#param-data-display_avatar_url`).

Suggested queries показываются при пустом поле поиска (`SUGGESTED_QUERIES` в `synonyms.ts`).

---

# URL маппинг

OpenAPI endpoint'ы автоматически маппятся на URL:

| Паттерн | URL | Пример |
|---------|-----|--------|
| `GET /items` | `/{section}/list` | `/messages/list` |
| `POST /items` | `/{section}/create` | `/messages/create` |
| `GET /items/{id}` | `/{section}/get` | `/users/get` |
| `PUT /items/{id}` | `/{section}/update` | `/chats/update` |
| `DELETE /items/{id}` | `/{section}/delete` | `/chats/delete` |
| Sub-resources | `/{section}/list-{sub}` | `/messages/list-reactions` |
| Специальные | По действию | `/messages/pin`, `/messages/unpin` |

Секция определяется из OpenAPI-тега через `tagToUrlSegment()` (русские теги → английские URL).

Скрипт `check-url-conflicts.mjs` проверяет, что маппинг не создаёт конфликтов.

---

# Ссылки и спец-теги

## Ссылки на API методы

Специальный формат (работает в OpenAPI описаниях, MDX, обновлениях):

```md
[Список сотрудников](GET /users)
[Новое сообщение](POST /messages)
[Редактирование чата](PUT /chats/{id})
```

Ссылки автоматически резолвятся в реальные URL и рендерятся с method-badge.

## Ссылки на гайды

```md
[Ошибки и лимиты](/guides/errors)
```

## Специальные теги

Превращаются в callout-блоки (`replace-special-tags.ts`):

- `#admin_access_token_required`
- `#owner_access_token_required`
- `#corporation_price_only`
- `#files_not_supported`
- `#unfurling_bot_access_token_required`
- `#bot_access_token_required`
- `#access_token_not_required`

---

# MDX компоненты

Регистрируются в `components/mdx/mdx-components.tsx` и `components/api/markdown-content.tsx`.

## Схемы и данные

```mdx
<SchemaBlock name="MessageWebhookPayload" />
<SchemaBlock name="ExportMessage" title="Кастомный заголовок" />
<SchemaBlock name="inline" schema={{...}} />

<HttpCodes />
<ErrorSchema />
<MarkdownSyntaxTable />
```

## Callout'ы

```mdx
<Info>Информация</Info>
<Warning>Предупреждение</Warning>
<Danger>Опасно</Danger>
```

## Код

```mdx
<CodeBlock language="json" title="Пример">
{`{ "message": "Hello" }`}
</CodeBlock>

<ApiCodeExample operationId="SecurityOperations_getAuditEvents" />
<ApiCodeExample operationId="SecurityOperations_getAuditEvents" title="С фильтрами" params={{ event_key: "user_login", limit: 50 }} />
```

`operationId` — из OpenAPI (формат `{InterfaceName}_{methodName}`). `params` — переопределяет query-параметры.

## Карточки

```mdx
<GuideCards />
<ApiCards />

<CardGroup>
  <Card title="Заголовок" icon="icon-name" href="/path">Описание</Card>
</CardGroup>
```

`GuideCards` и `ApiCards` генерируются автоматически из навигации.

## Изображения

```mdx
<ImageCard src="/images/example.png" alt="Описание" caption="Подпись" />
<ImageCard src="/images/example.png" alt="Описание" maxWidth={500} />
```

Поддерживает lightbox с zoom/pan/swipe.

## Структура

```mdx
<Steps>
  <Step title="Шаг 1">Описание</Step>
  <Step title="Шаг 2">Описание</Step>
</Steps>

<Tree>
  <TreeFolder name="src">
    <TreeFile name="index.ts" />
  </TreeFolder>
</Tree>
```

## Диаграммы

```mdx
<Mermaid chart={`graph TD; A-->B;`} />
```

Поддерживает светлую/тёмную тему.

## Лимиты и обновления

```mdx
<Limit title="Название" limit="~4" period="1 сек" entity="chat_id" howItWorks="Описание" />

<Updates />
```

---

# Как добавить контент

## Новый гайд

Создайте `content/guides/{slug}.mdx`:

```mdx
---
title: Название гайда
description: Краткое описание для SEO
---

# Название гайда

Контент в MDX формате.

<SchemaBlock name="SomeSchema" />
```

### Frontmatter

| Параметр | Обязательный | Описание |
|----------|--------------|----------|
| `title` | Да | Заголовок для навигации и SEO |
| `description` | Нет | Описание для SEO |
| `hideTableOfContents` | Нет | Скрыть оглавление |
| `useUpdatesComponent` | Нет | Использовать компонент `<Updates />` (для updates.mdx) |

### Порядок в навигации

Добавьте путь в `lib/guides-config.ts`:

```ts
const GUIDES_ORDER = [
  '/',
  '/guides/webhook',
  '/guides/{slug}',  // ← ваш новый гайд
];
```

Гайд автоматически появится в навигации, поиске, `/llms.txt`, `/llms-full.txt`, RSS и получит `.md`-файл.

---

## Обновление API (changelog)

В `content/guides/updates.mdx`:

```md
<!-- update:2025-12-01 -->
## Название обновления

Описание изменений.

- [Новый метод](POST /messages)
```

Badge "Новое" показывается < 7 дней. Попадает в RSS feed.

---

## Кастомная схема

Создайте `lib/schemas/guides/{Name}.json`:

```json
{
  "title": "Заголовок схемы",
  "schema": {
    "type": "object",
    "properties": {
      "field": {
        "type": "string",
        "description": "Описание"
      },
      "status": {
        "type": "string",
        "enum": ["pending", "completed"],
        "x-enum-descriptions": {
          "pending": "в обработке",
          "completed": "завершен"
        }
      }
    },
    "required": ["field"]
  }
}
```

Используйте: `<SchemaBlock name="Name" />`

Индексируется для поиска и попадает в `llms-full.txt`.

### Существующие схемы

| Файл | Используется в |
|------|----------------|
| `DlpRule.json` | dlp.mdx |
| `ExportMessage.json` | export.mdx |
| `ExportChat.json` | export.mdx |
| `ViewSubmitWebhookPayload.json` | forms.mdx |
| `ViewErrorsResponse.json` | forms.mdx |

---

# Настройки

## Отображение

`lib/display-config.ts`:

| Параметр | По умолчанию | Описание |
|----------|--------------|----------|
| `showSchemaExamples` | `false` | Примеры значений у полей в схемах и в markdown-генерации |

## Редиректы

`redirects.ts` — permanent (308), поддерживает wildcard (`:path*`):

```ts
const redirects: Redirect[] = [
  { source: '/old-page', destination: '/new-page' },
];
```

---

## Контакты

- support@pachca.com
- team@pachca.com
