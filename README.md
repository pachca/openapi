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

## Как добавить новый гайд

### Создайте файл `content/guides/{slug}.mdx`

```mdx
---
title: Название гайда
description: Краткое описание для SEO
---

# Название гайда

Ваш контент в Markdown/MDX формате.

<SchemaBlock name="SomeSchema" />
```

### Опционально: frontmatter параметры

| Параметр | Обязательный | Описание |
|----------|--------------|----------|
| `title` | Да | Заголовок для навигации и SEO |
| `description` | Нет | Описание для SEO |
| `hideTableOfContents` | Нет | Скрыть оглавление (`true`/`false`) |

### (Опционально) Настройте порядок в `lib/guides-config.ts`

```ts
const GUIDES_ORDER = [
  '/',
  '/guides/webhook',
  '/guides/{slug}',  // ← ваш новый гайд
];
```

### Готово!

После этого гайд автоматически появится в:
- ✅ Навигации сайта
- ✅ `/llms.txt` (со ссылкой и описанием)
- ✅ `/llms-full.txt` (с полным контентом)
- ✅ Поиске (все содержимое индексируется)

## Как добавить обновление API (changelog)

Откройте `content/guides/updates.mdx` и добавьте новое обновление после вступительного текста:

```md
<!-- update:2025-12-01 -->
## Название обновления

Описание изменений.

- [Новый метод](POST /messages)
```

**Всё!** Обновление автоматически:
- ✅ Появится на странице `/guides/updates`
- ✅ Попадет в `/llms-full.txt`
- ✅ Получит badge "Новое" в навигации (если < 14 дней)

## Как добавить кастомную схему

Создайте файл `lib/schemas/guides/MySchema.json`:

```json
{
  "title": "Заголовок схемы",
  "schema": {
    "type": "object",
    "properties": {
      "field1": { 
        "type": "string", 
        "description": "Описание"
      }
    }
  }
}
```

Используйте в MDX:

```mdx
<SchemaBlock name="MySchema" />
```

**Никакой дополнительной регистрации не требуется!**

## Компоненты для MDX

### Схемы данных

```mdx
<!-- Из OpenAPI -->
<SchemaBlock name="MessageWebhookPayload" />

<!-- Кастомная схема -->
<SchemaBlock name="MyCustomSchema" />

<!-- С кастомным заголовком -->
<SchemaBlock name="ExportMessage" title="Структура в экспорте" />
```

### Блоки кода

```mdx
<CodeBlock language="json" title="Пример">
{`{
  "message": "Hello"
}`}
</CodeBlock>
```

### Callout

```mdx
<Info>Информация</Info>
<Warning>Предупреждение</Warning>
```

### Ссылки

Ссылки на API методы (работают везде: OpenAPI, MDX, обновления):

```mdx
[Название метода](POST /messages)
[Редактирование](PUT /chats/{id})
```

Ссылки на гайды (обычный markdown):

```mdx
[Название гайда](/guides/errors)
```

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

## Что происходит автоматически

- ✅ **Навигация** — строится из OpenAPI тегов + гайдов
- ✅ **Поиск** — индексирует весь контент, схемы, поля
- ✅ **llms.txt** — генерируется из всех страниц
- ✅ **Примеры кода** — генерируются из схем или используют примеры из OpenAPI
- ✅ **Схемы** — читаются из OpenAPI и кастомных JSON файлов
- ✅ **Обновления** — парсятся из MDX с badge "Новое"

## Контакты

- support@pachca.com
- team@pachca.com
