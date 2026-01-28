# Пачка API Documentation

Современный сайт документации API на Next.js с автоматическим парсингом OpenAPI спецификации.

## Возможности

- Автоматическая генерация страниц методов из `openapi-source/openapi.yaml`
- Динамическая навигация из OpenAPI тегов
- Интерактивные примеры кода (cURL, JavaScript, Python и др.)
- Полнотекстовый поиск по документации (Cmd+K / Ctrl+K)
- Темная/светлая тема с сохранением выбора
- Публичные файлы для LLM: `/llms.txt` и `/llms-full.txt`

## Требования

- Node.js 20+
- npm

## Быстрый старт

```bash
npm install
```

### Подготовьте OpenAPI файл

Проект читает спецификацию из `openapi-source/openapi.yaml`. Обычно это symlink на output TypeSpec:

```bash
ln -sf /path/to/typespec-project/tsp-output/@typespec/openapi3/openapi.yaml openapi-source/openapi.yaml
```

### Запуск в разработке

```bash
npm run dev
```

Откройте http://localhost:3000.

### Production сборка

```bash
npm run build
npm start
```

При запуске `npm run build` автоматически выполняется проверка конфликтов URL (`prebuild` скрипт).

## Структура проекта

```
api-docs/
├── app/                      # Next.js App Router
│   ├── guides/[slug]/page.tsx # Динамическая страница гайдов
│   └── [...slug]/page.tsx    # Динамические страницы API методов
├── components/               # UI компоненты
├── content/
│   ├── guides/*.mdx          # Гайды (метаданные в frontmatter, контент в MDX)
│   └── home.mdx              # Контент главной страницы
├── lib/
│   ├── openapi/              # Парсер OpenAPI
│   ├── search/               # Поиск (см. lib/search/README.md)
│   ├── schemas/              # Кастомные схемы для гайдов
│   ├── guides-config.ts      # Динамическая конфигурация гайдов
│   ├── updates-parser.ts     # Парсер обновлений из MDX
│   └── code-generators/      # Генераторы примеров кода
├── openapi-source/           # OpenAPI спецификация
└── scripts/                  # Вспомогательные скрипты
```

---

## Как изменения OpenAPI влияют на проект

Проект **полностью динамический** — все данные API читаются из `openapi-source/openapi.yaml`.

### Что происходит автоматически при изменении OpenAPI:

| Изменение в OpenAPI | Результат |
|---------------------|-----------|
| Добавлен новый endpoint | Автоматически появляется страница метода и пункт в навигации |
| Удалён endpoint | Страница и навигация исчезают |
| Добавлен новый тег | Появляется новая секция в навигации |
| Удалён тег | Секция исчезает |
| Изменён порядок тегов | Меняется порядок секций в навигации |
| Изменён `servers[0].url` | Обновляются примеры кода во всех генераторах |
| Изменены `summary`/`description` | Обновляются заголовки и описания методов |

### Откуда берутся данные:

- **Порядок секций API** → из массива `tags` в OpenAPI
- **URL страниц методов** → транслитерация тега + action из HTTP метода/пути
- **Base URL для примеров** → из `servers[0].url` в OpenAPI
- **Заголовки методов** → из `summary` или первой строки `description`

### В dev-режиме

Watcher автоматически очищает кеш при изменении OpenAPI файла — изменения видны сразу после обновления страницы.

---

## Как добавить новый гайд

### Создайте файл `content/guides/{slug}.mdx`

Достаточно создать один MDX-файл с frontmatter:

```mdx
---
title: Название гайда
description: Краткое описание для SEO
---

# Название гайда

Ваш контент в Markdown/MDX формате.

## Подзаголовок

Текст, изображения, компоненты...

<SchemaBlock name="SomeSchema" />
```

### Параметры frontmatter

| Параметр | Обязательный | Описание |
|----------|--------------|----------|
| `title` | Да | Заголовок (используется в навигации и SEO) |
| `description` | Нет | Описание для SEO и llms.txt |
| `hideTableOfContents` | Нет | Скрыть оглавление справа (`true`/`false`) |

### (Опционально) Задайте порядок

Новый гайд автоматически появится в конце списка навигации. Чтобы задать порядок, добавьте путь в массив `GUIDES_ORDER` в `lib/guides-config.ts`:

```ts
const GUIDES_ORDER = [
  '/',
  '/guides/webhook',
  // ... другие гайды ...
  '/guides/{slug}',  // ← ваш новый гайд
  '/guides/updates',
];
```

### Результат

После создания гайд автоматически появится в:
- Навигации сайта
- `/llms.txt` (со ссылкой и описанием)
- `/llms-full.txt` (с полным контентом)
- Markdown API (`/api/md/guides/{slug}`)

---

## Как добавить новое обновление (changelog)

История обновлений API хранится в `content/guides/updates.mdx`.

### Добавьте новую секцию после заголовка:

```md
<!-- update:2025-12-01 -->
## Название обновления

Описание обновления.

- [Название метода](POST /path)

Дополнительная информация.
```

### Формат:

- Каждое обновление начинается с HTML-комментария `<!-- update:YYYY-MM-DD -->`
- Затем заголовок второго уровня `## Название обновления`
- Затем контент в markdown формате
- Для ссылок на API методы: `[Название](METHOD /path)`
- Для ссылок на гайды: `[Название гайда](/guides/slug)` (обычный markdown)
- Обновления за последние 14 дней автоматически получают badge "Новое" в навигации

### Результат

Обновление автоматически появится на:
- Странице `/guides/updates`
- В `/llms-full.txt`

---

## Навигация и URL

- Навигация строится динамически из тегов OpenAPI + гайдов из `content/guides/*.mdx`
- URL методов формируется из транслитерации тега и логики `extractActionFromEndpoint()`
- Проверить уникальность URL: `npm run check-urls`

## Описания методов, ссылки и спец-теги

### Ссылки

**Для API методов** используйте специальный формат (в OpenAPI описаниях, гайдах MDX, обновлениях):

```
[описание](METHOD /path)
```

Примеры:
- `[Список сотрудников](GET /users)`
- `[Новое сообщение](POST /messages)`
- `[Редактирование чата](PUT /chats/{id})`

Ссылка автоматически преобразуется в URL страницы метода.

**Для гайдов** используйте обычный markdown:

```
[Название гайда](/guides/slug)
```

Примеры:
- `[Ошибки и лимиты](/guides/errors)`
- `[Исходящий Webhook](/guides/webhook)`

### Специальные теги

Поддерживаются теги в описаниях, которые превращаются в callout-блоки:

- `#admin_access_token_required`
- `#owner_access_token_required`
- `#corporation_price_only`
- `#files_not_supported`
- `#unfurling_bot_access_token_required`
- `#bot_access_token_required`
- `#access_token_not_required`

## Примеры и схемы

- В блоке «Тело запроса» пример показывается **только если** в OpenAPI указаны `example` или `examples`
- Генераторы кода берут явные примеры, а если их нет — генерируют тело из схемы
- Схемы поддерживают `allOf/oneOf/anyOf`, `additionalProperties`, `x-enum-descriptions`

## llms.txt

- `/llms.txt` — краткая версия с перечнем страниц и методов
- `/llms-full.txt` — полная документация в Markdown с параметрами, схемами и примерами

Оба файла генерируются динамически и всегда актуальны.

## Полезные команды

```bash
npm run dev          # Запуск в dev-режиме
npm run build        # Production сборка (с проверкой URL)
npm start            # Запуск production сервера
npm run lint         # Проверка кода
npm run check-urls   # Проверка уникальности URL
```

---

# Поиск в документации

Поиск реализован с использованием [FlexSearch](https://github.com/nextapps-de/flexsearch) — быстрой библиотеки полнотекстового поиска.

## Архитектура поиска

```
lib/search/
├── indexer.ts    # Построение индекса и логика поиска
└── README.md     # Эта документация

components/search/
└── search-dialog.tsx  # UI компонент поиска

app/api/search/
└── route.ts      # API endpoint для поиска
```

## Построение индекса

Индекс строится из двух источников:

### 1. API методы (из OpenAPI)
- Заголовок метода
- Описание
- URL path и метод (GET, POST, etc.)
- **Schema fields** — все поля из request body, response и параметров
- Enum значения с описаниями

### 2. Гайды (из MDX файлов)
- Заголовок страницы
- Описание (первый параграф)
- **Code values** — значения в backticks (`` `value` ``)
- Schema fields из компонентов `<SchemaBlock>`

## FlexSearch конфигурация

```typescript
new FlexSearch.Document({
  document: {
    id: 'id',
    index: [
      { field: 'title', tokenize: 'forward' },
      { field: 'description', tokenize: 'forward' },
      { field: 'keywords', tokenize: 'forward' },
    ],
    store: ['id', 'title', 'description', 'url', 'type', 'category', 'keywords'],
  },
  cache: 100,
});
```

- `tokenize: 'forward'` — позволяет находить по началу слова (например "web" → "webhook")
- `cache: 100` — кеширует 100 последних запросов

## Алгоритм скоринга

Каждый результат получает score на основе качества совпадения:

| Критерий | Очки | Описание |
|----------|------|----------|
| Schema field match | +12 | Переменная найдена как параметр API |
| Exact title match | +10 | Запрос содержится в заголовке |
| Title field match | +5 | FlexSearch нашёл совпадение в title |
| Code value match | +4 | Переменная упоминается в тексте |
| Description field match | +3 | FlexSearch нашёл совпадение в description |
| Guide type | +2 | Небольшой бонус для гайдов |
| Keywords field match | +1 | FlexSearch нашёл совпадение в keywords |

### Пример скоринга

Запрос: `display_avatar_url`

| Результат | Score | Breakdown |
|-----------|-------|-----------|
| Новое сообщение (API) | 13 | 12 (schema field) + 1 (keywords) |
| Последние обновления (guide) | 7 | 4 (code value) + 2 (guide) + 1 (keywords) |

## Code-like запросы

Поиск определяет, является ли запрос "code-like" (похож на переменную):

```typescript
function isCodeLikeQuery(query: string): boolean {
  // snake_case: callback_id, entity_type
  if (query.includes('_')) return true;
  // object.property: data.user
  if (query.includes('.')) return true;
  // camelCase: entityType
  if (/[a-z][A-Z]/.test(query)) return true;
  // single technical word: webhook, token
  if (/^[a-z_]+$/i.test(query)) return true;
  return false;
}
```

Для code-like запросов:
- **Фильтрация**: показываются только страницы, где переменная реально есть
- **Отключается suggest**: нужны точные совпадения, не приблизительные

## Типы совпадений

### Schema Fields (высокий приоритет)
Реальные параметры API из OpenAPI спецификации:
- Request body fields
- Response fields
- Query/path параметры
- Enum значения

### Code Values (низкий приоритет)
Упоминания в тексте MDX файлов:
- Inline code в backticks
- Значения из списков с описаниями

## API Endpoint

```
GET /api/search?q={query}
```

Возвращает до 20 результатов:

```json
{
  "results": [
    {
      "id": "MessageOperations_createMessage",
      "title": "Новое сообщение",
      "description": "Метод для отправки сообщения...",
      "url": "/messages/create",
      "type": "api",
      "category": "Сообщения",
      "matchedValue": {
        "value": "display_avatar_url",
        "description": "ссылка на аватарку отправителя",
        "path": "data.display_avatar_url"
      },
      "score": 13
    }
  ]
}
```

## Навигация к параметру

Если найден конкретный параметр (`matchedValue.path`), клик по результату:
1. Переходит на страницу метода
2. Добавляет hash с ID параметра (`#param-data-display_avatar_url`)
3. Открывает секцию с параметром
4. Скроллит к параметру

## Кеширование

- Индекс строится один раз при первом запросе
- Сохраняется в памяти до перезапуска сервера
- В dev режиме можно сбросить через `clearSearchCache()`

## Совместимость с Next.js

FlexSearch использует `worker_threads`, что вызывает проблемы с Turbopack. Решение в `next.config.ts`:

```typescript
serverExternalPackages: ['flexsearch'],
```

---

# Работа с контентом в MDX

## Компоненты для отображения схем

### SchemaBlock - универсальный компонент

`SchemaBlock` отображает схемы данных из OpenAPI или кастомные схемы из `lib/schemas/guides/`.

#### Использование:

```mdx
# Мой гайд

Описание API...

<!-- Схема из OpenAPI -->
<SchemaBlock name="MessageWebhookPayload" />

<!-- Кастомная схема из lib/schemas/guides/ -->
<SchemaBlock name="DlpRule" />

<!-- С кастомным заголовком -->
<SchemaBlock name="ExportMessage" title="Структура сообщения в экспорте" />

<!-- Без заголовка (схема отображается inline) -->
<SchemaBlock name="DlpRule" hideHeader={true} />
```

#### Параметры:

| Параметр | Тип | Описание |
|----------|-----|----------|
| `name` | string | Имя схемы (из OpenAPI или JSON файл из `lib/schemas/guides/`) |
| `title` | string | Кастомный заголовок (опционально) |
| `hideHeader` | boolean | Скрыть заголовок секции (опционально) |

## Добавление кастомных схем

Кастомные схемы (которых нет в OpenAPI) хранятся как отдельные JSON файлы в `lib/schemas/guides/`.

**Название файла = название схемы** — никакой дополнительной регистрации не нужно.

### 1. Создайте JSON файл

```json
// lib/schemas/guides/MyNewSchema.json

{
  "title": "Заголовок схемы для отображения",
  "schema": {
    "type": "object",
    "properties": {
      "field1": { 
        "type": "string", 
        "description": "Описание поля",
        "example": "example_value"
      },
      "field2": { 
        "type": "integer", 
        "description": "Числовое поле",
        "minimum": 1,
        "maximum": 100
      },
      "status": {
        "type": "string",
        "description": "Статус заказа",
        "enum": ["pending", "completed", "cancelled"],
        "x-enum-descriptions": {
          "pending": "в обработке",
          "completed": "завершен",
          "cancelled": "отменен"
        }
      }
    },
    "required": ["field1"]
  }
}
```

### 2. Используйте в MDX

```mdx
<SchemaBlock name="MyNewSchema" />
```

### Что происходит автоматически:

- ✅ **Отображение** - схема отображается на странице с красивым форматированием
- ✅ **Поиск** - все поля схемы индексируются для поиска
- ✅ **Навигация** - можно перейти к конкретному полю через хеш (#param-field1)
- ✅ **llms-full** - схема включается в экспорт для LLM
- ✅ **MD версия** - автоматически конвертируется в Markdown

### Структура Schema Object

Схемы следуют спецификации OpenAPI Schema Object:

```typescript
interface Schema {
  type?: string | string[];           // 'object', 'string', 'integer', 'array', etc.
  format?: string;                    // 'date-time', 'email', 'uri', etc.
  description?: string;               // Описание поля
  properties?: Record<string, Schema>;// Вложенные свойства (для type: 'object')
  required?: string[];                // Обязательные поля
  items?: Schema;                     // Тип элементов (для type: 'array')
  enum?: any[];                       // Допустимые значения
  'x-enum-descriptions'?: Record<string, string>; // Описания для enum
  default?: any;                      // Значение по умолчанию
  example?: any;                      // Пример значения
  nullable?: boolean;                 // Может быть null
  minLength?: number;                 // Минимальная длина строки
  maxLength?: number;                 // Максимальная длина строки
  minimum?: number;                   // Минимальное числовое значение
  maximum?: number;                   // Максимальное числовое значение
  minItems?: number;                  // Минимальное количество элементов в массиве
  maxItems?: number;                  // Максимальное количество элементов в массиве
  pattern?: string;                   // Regex паттерн для строки
  // ... другие поля OpenAPI Schema
}
```

#### Примеры типов:

**Объект:**
```typescript
{
  type: 'object',
  properties: {
    name: { type: 'string' },
    age: { type: 'integer' }
  },
  required: ['name']
}
```

**Массив:**
```typescript
{
  type: 'array',
  description: 'Список тегов',
  items: { type: 'string' },
  minItems: 1,
  maxItems: 10
}
```

**Enum с описаниями:**
```typescript
{
  type: 'string',
  enum: ['pending', 'active', 'cancelled'],
  'x-enum-descriptions': {
    pending: 'ожидает обработки',
    active: 'активен',
    cancelled: 'отменен'
  }
}
```

**Nullable поле:**
```typescript
{
  type: 'string',
  nullable: true,
  description: 'Может быть null если не указано'
}
```

## Блоки кода

Для отображения примеров кода используйте компонент `CodeBlock`.

### Использование:

```mdx
<CodeBlock language="json" title="Пример запроса">
{`{
  "message": "Hello World",
  "chat_id": 123456
}`}
</CodeBlock>

<CodeBlock language="bash" title="cURL пример">
{`curl -X POST https://api.pachca.com/api/shared/v1/messages \\
  -H "Authorization: Bearer YOUR_TOKEN" \\
  -H "Content-Type: application/json" \\
  -d '{"message": "Hello"}'`}
</CodeBlock>

<CodeBlock language="python">
{`import requests

response = requests.post(
    'https://api.pachca.com/api/shared/v1/messages',
    headers={'Authorization': 'Bearer YOUR_TOKEN'},
    json={'message': 'Hello World'}
)`}
</CodeBlock>
```

### Параметры:

| Параметр | Тип | Описание |
|----------|-----|----------|
| `language` | string | Язык подсветки синтаксиса (json, bash, python, javascript, etc.) |
| `title` | string | Заголовок блока кода (опционально) |
| `children` | string | Код в template literal (обязательно в `{` \` ... \` `}`) |

### Важно:

- Код всегда оборачивается в `{` \`...\` `}` (template literal)
- Используйте правильный язык для подсветки синтаксиса
- `bash` и `shell` автоматически конвертируются в `curl` для единообразия

## Другие компоненты

### Callout (Info/Warning)

```mdx
<Info>
Это информационное сообщение
</Info>

<Warning>
Это предупреждение
</Warning>

<!-- Или универсальный Callout -->
<Callout type="info">
Информация
</Callout>

<Callout type="warning">
Важное предупреждение
</Callout>
```

### Image

```mdx
<Image src="/images/example.png" alt="Описание" />

<!-- С ограничением ширины -->
<Image src="/images/example.png" alt="Описание" maxWidth={500} />
```

### Limit (Rate limiting)

```mdx
<Limit 
  title="Название лимита" 
  limit="~4" 
  period="1 сек"
  entity="chat_id"
  howItWorks="Описание как работает лимит"
/>
```

### HTTP коды

```mdx
<HttpCodes />
```

Отображает таблицу с HTTP кодами ответов.

### ErrorSchema

```mdx
<ErrorSchema />
```

Отображает схемы ошибок API (`ApiError` и `OAuthError`).

## Существующие кастомные схемы

Схемы хранятся как JSON файлы в `lib/schemas/guides/`:

| Файл | Описание | Используется в |
|------|----------|----------------|
| `DlpRule.json` | Структура правила DLP | dlp.mdx |
| `ExportMessage.json` | Структура сообщений в экспорте | export.mdx |
| `ExportChat.json` | Структура чатов в экспорте | export.mdx |
| `ViewSubmitWebhookPayload.json` | Структура вебхука отправки формы | forms.mdx |
| `ViewErrorsResponse.json` | Структура ответа с ошибками формы | forms.mdx |

---

## Контакты

- support@pachca.com
- team@pachca.com
