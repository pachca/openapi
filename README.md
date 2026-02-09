# Пачка API Documentation

Turborepo монорепозиторий с документацией API.

## Структура монорепозитория

```
├── apps/
│   └── docs/          # Next.js сайт документации (@pachca/docs)
├── packages/
│   └── spec/          # TypeSpec спецификация (@pachca/spec)
├── turbo.json         # Конфигурация Turborepo
└── package.json       # Корневой package.json (workspaces)
```

### Зависимости между пакетами

```
@pachca/spec (packages/spec)
    │
    │ generate → openapi.yaml
    ▼
@pachca/docs (apps/docs)
    │
    │ build/dev
    ▼
  Next.js сайт
```

`@pachca/docs` зависит от `@pachca/spec` — при `build` или `dev` сначала генерируется OpenAPI.

## Установка

```bash
bun install
```

Package manager: `bun@1.3.4` (указан в `packageManager`).

## Команды

Все команды запускаются из корня через Turborepo:

```bash
# Разработка (с hot reload)
bun turbo dev

# Production сборка
bun turbo build

# Запуск production сервера
bun turbo start
```

### Проверки

```bash
# Все проверки разом
bun turbo check

# Отдельные проверки
bun turbo lint           # ESLint
bun turbo typecheck      # TypeScript
bun turbo knip           # Неиспользуемый код
bun turbo format:check   # Prettier
bun turbo check-urls     # Конфликты URL
```

### Генерация OpenAPI

```bash
bun turbo generate       # TypeSpec → openapi.yaml
```

## Как работает Turborepo

`turbo.json` определяет задачи и их зависимости:

| Задача | Зависит от | Кешируется |
|--------|------------|------------|
| `generate` | — | да |
| `build` | `@pachca/spec#generate` | да |
| `dev` | `@pachca/spec#generate` | нет |
| `check` | `lint`, `typecheck`, `knip`, `format:check` | нет |

При запуске `bun turbo build`:
1. Turborepo проверяет кеш для `generate`
2. Если OpenAPI не изменился — использует кеш
3. Запускает `build` в `apps/docs`
4. Кеширует результат

## Фильтрация по пакету

```bash
# Только docs
bun turbo dev --filter=@pachca/docs

# Только spec
bun turbo generate --filter=@pachca/spec
```

---

# Документация docs

## Главная особенность: все динамическое

Проект **полностью автоматический** — не нужно ручное обновление навигации, маршрутов или индексов.

### OpenAPI → автоматическая генерация

| Что делаете | Что происходит автоматически |
|-------------|------------------------------|
| Добавляете endpoint в OpenAPI | Появляется страница метода + пункт в навигации |
| Удаляете endpoint | Страница и навигация исчезают |
| Добавляете тег | Новая секция в навигации |
| Меняете порядок тегов | Меняется порядок секций |
| Меняете `servers[0].url` | Обновляются все примеры кода |

## Что происходит автоматически

- ✅ **Навигация** — строится из OpenAPI тегов + гайдов
- ✅ **Поиск** — индексирует весь контент, схемы, поля
- ✅ **llms.txt** — генерируется из всех страниц
- ✅ **Примеры кода** — генерируются из схем или используют примеры из OpenAPI
- ✅ **Схемы** — читаются из OpenAPI и кастомных JSON файлов
- ✅ **Обновления** — парсятся из MDX с badge "Новое"

## Структура apps/docs

```
apps/docs/
├── app/                      # Next.js App Router
│   ├── guides/[slug]/page.tsx # Динамическая страница гайдов
│   └── [...slug]/page.tsx    # Динамические страницы API методов
├── components/               # UI компоненты
├── content/
│   ├── guides/*.mdx          # Гайды (метаданные в frontmatter, контент в MDX)
│   └── home.mdx              # Контент главной страницы
├── lib/
│   ├── openapi/              # Парсер OpenAPI
│   ├── search/               # Поиск
│   ├── schemas/              # Кастомные схемы для гайдов
│   └── code-generators/      # Генераторы примеров кода
└── scripts/                  # Вспомогательные скрипты
```

---

# Поиск

Поиск использует [FlexSearch](https://github.com/nextapps-de/flexsearch) с `tokenize: 'forward'` (находит по началу слова: "web" → "webhook").

## Что индексируется

| Источник | Индексируемые данные |
|----------|----------------------|
| API методы | Заголовок, описание, URL, все поля из request/response/параметров, enum значения |
| Гайды | Заголовок, описание, значения в backticks, поля из `<SchemaBlock>` |

## Скоринг результатов

| Критерий | Очки |
|----------|------|
| Schema field match | +12 |
| Exact title match | +10 |
| Title field match | +5 |
| Code value match | +4 |
| Description field match | +3 |
| Guide type | +2 |
| Keywords field match | +1 |

## Code-like запросы

Поиск определяет "code-like" запросы (`snake_case`, `camelCase`, `object.property`) и для них:
- Показывает только страницы с реальным совпадением
- Отключает приблизительный поиск

## Навигация к параметру

При клике на результат с `matchedValue.path`:
1. Переход на страницу
2. Hash с ID параметра (`#param-data-display_avatar_url`)
3. Скролл к параметру

---

# Ссылки и спец-теги

## Ссылки на API методы

Специальный формат (работает в OpenAPI, MDX, обновлениях):

```md
[Список сотрудников](GET /users)
[Новое сообщение](POST /messages)
[Редактирование чата](PUT /chats/{id})
```

## Ссылки на гайды

Обычный markdown:

```md
[Ошибки и лимиты](/guides/errors)
```

## Специальные теги

Превращаются в callout-блоки:

- `#admin_access_token_required`
- `#owner_access_token_required`
- `#corporation_price_only`
- `#files_not_supported`
- `#unfurling_bot_access_token_required`
- `#bot_access_token_required`
- `#access_token_not_required`

---

# MDX компоненты

## SchemaBlock

```mdx
<SchemaBlock name="MessageWebhookPayload" />
<SchemaBlock name="ExportMessage" title="Кастомный заголовок" />
```

## CodeBlock

```mdx
<CodeBlock language="json" title="Пример">
{`{ "message": "Hello" }`}
</CodeBlock>
```

## Callout

```mdx
<Info>Информация</Info>
<Warning>Предупреждение</Warning>
```

## Image

```mdx
<Image src="/images/example.png" alt="Описание" />
<Image src="/images/example.png" alt="Описание" maxWidth={500} />
```

## Limit

```mdx
<Limit 
  title="Название" 
  limit="~4" 
  period="1 сек"
  entity="chat_id"
  howItWorks="Описание"
/>
```

## HttpCodes / ErrorSchema

```mdx
<HttpCodes />
<ErrorSchema />
```

---

# Как добавить контент

## Новый гайд

Создайте файл `content/guides/{slug}.mdx`:

```mdx
---
title: Название гайда
description: Краткое описание для SEO
---

# Название гайда

Ваш контент в Markdown/MDX формате.

<SchemaBlock name="SomeSchema" />
```

### Frontmatter параметры

| Параметр | Обязательный | Описание |
|----------|--------------|----------|
| `title` | Да | Заголовок для навигации и SEO |
| `description` | Нет | Описание для SEO |
| `hideTableOfContents` | Нет | Скрыть оглавление (`true`/`false`) |

### Порядок в навигации

По умолчанию гайд появится в конце. Для изменения порядка добавьте путь в `lib/guides-config.ts`:

```ts
const GUIDES_ORDER = [
  '/',
  '/guides/webhook',
  '/guides/{slug}',  // ← ваш новый гайд
];
```

После создания гайд автоматически появится в навигации, `/llms.txt`, `/llms-full.txt` и поиске.

---

## Обновление API (changelog)

Откройте `content/guides/updates.mdx` и добавьте:

```md
<!-- update:2025-12-01 -->
## Название обновления

Описание изменений.

- [Новый метод](POST /messages)
```

Обновление автоматически появится на `/guides/updates`, в `/llms-full.txt` и получит badge "Новое" (если < 14 дней).

---

## Кастомная схема

Создайте JSON в `lib/schemas/guides/{Name}.json`:

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

Используйте в MDX: `<SchemaBlock name="Name" />`

Схема автоматически отобразится на странице, проиндексируется для поиска и попадёт в `/llms-full.txt`.

### Существующие схемы

| Файл | Используется в |
|------|----------------|
| `DlpRule.json` | dlp.mdx |
| `ExportMessage.json` | export.mdx |
| `ExportChat.json` | export.mdx |
| `ViewSubmitWebhookPayload.json` | forms.mdx |
| `ViewErrorsResponse.json` | forms.mdx |

---

# Настройки отображения

Файл `apps/docs/lib/display-config.ts` управляет отображением элементов документации:

| Параметр | Тип | По умолчанию | Описание |
|----------|-----|--------------|----------|
| `showSchemaExamples` | `boolean` | `false` | Показывать примеры значений у полей и параметров в схемах |

Настройка влияет на:
- Строку «Пример» у каждого поля в дереве схемы (страницы методов и гайдов)
- Примеры значений параметров пути, query и headers
- Примеры в markdown-генерации (`llms.txt`, `llms-full.txt`)

---

## Контакты

- support@pachca.com
- team@pachca.com
