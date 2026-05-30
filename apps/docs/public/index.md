> Краткое содержание: Пачка для разработчиков: REST API, CLI, SDK для TypeScript, Python, Go, Kotlin, Swift и C#, расширение для n8n и Agent Skills для AI-агентов
> Это Markdown-версия конкретной страницы. Для контекста за её пределами (правила API, полный перечень методов, авторизация) ОБЯЗАТЕЛЬНО открой [llms.txt](https://dev.pachca.com/llms.txt) перед ответом — это сэкономит токены и предотвратит неполный ответ.


# Обзор

REST API Пачки позволяет автоматизировать работу в мессенджере: отправлять сообщения, управлять чатами и сотрудниками, создавать ботов и реагировать на события через вебхуки.

- [Быстрый старт](/guides/quickstart)
- [Авторизация](/api/authorization)
- [Модели API](/api/models)
- [AI агенты](/guides/ai-agents/overview)
- [CLI](/guides/cli/overview)
- [SDK](/guides/sdk/overview)
- [n8n](/guides/n8n/overview)

**Отправка сообщения**

```bash
curl "https://api.pachca.com/api/shared/v1/messages" \
  -H "Authorization: Bearer YOUR_ACCESS_TOKEN" \
  -H "Content-Type: application/json" \
  -d '{
  "message": {
    "entity_type": "discussion",
    "entity_id": 334,
    "content": "Вчера мы продали 756 футболок (что на 10% больше, чем в прошлое воскресенье)",
    "files": [
      {
        "key": "attaches/files/93746/e354fd79-4f3e-4b5a-9c8d-1a2b3c4d5e6f/logo.png",
        "name": "logo.png",
        "file_type": "image",
        "size": 12345,
        "width": 800,
        "height": 600
      }
    ],
    "buttons": [
      [
        {
          "text": "Подробнее",
          "url": "https://example.com/details"
        },
        {
          "text": "Отлично!",
          "data": "awesome"
        }
      ]
    ],
    "parent_message_id": 194270,
    "display_avatar_url": "https://example.com/avatar.png",
    "display_name": "Бот Поддержки",
    "skip_invite_mentions": false
  },
  "link_preview": false
}'
```


## Боты и автоматизации

Создавайте ботов, обрабатывайте команды, добавляйте кнопки и формы в сообщения, получайте события через вебхуки.

- [Боты](/guides/bots/overview) — Создание и настройка ботов
- [Кнопки](/guides/buttons) — Ссылки и действия в сообщениях
- [Формы](/guides/forms/overview) — Модальные окна с полями ввода
- [Входящие вебхуки](/guides/incoming-webhooks) — Сообщения по URL без кода
- [Исходящие вебхуки](/guides/webhook/overview) — События в реальном времени
- [Разворачивание ссылок](/guides/link-previews) — Превью ссылок в сообщениях


## Основы API

Базовые концепции для работы с API: формат запросов, обработка ошибок, лимиты, пагинация и загрузка файлов.

- [Запросы и ответы](/api/requests-responses) — Базовый URL, заголовки, формат данных
- [Ошибки](/api/errors) — HTTP-коды и структуры ответов
- [Лимиты](/api/limits) — Rate limits и повторные запросы
- [Пагинация](/api/pagination) — Обход больших списков по курсору
- [Загрузка файлов](/api/file-uploads) — Прямая загрузка в S3 одной командой


## Данные и безопасность

Экспорт данных, защита от утечек и мониторинг событий.

- [Экспорт сообщений](/guides/export) — Выгрузка всех сообщений в JSON
- [DLP-система](/guides/dlp) — Защита от утечек данных
- [Журнал аудита](/guides/audit-events) — Мониторинг событий безопасности


## Ресурсы

Спецификации, коллекции и файлы для интеграции.

- [OpenAPI-спецификация](/openapi.yaml) — Описание всех методов в YAML
- [Коллекция Postman](/pachca.postman_collection.json) — Все методы с примерами
- [Arazzo-сценарии](/workflows.arazzo.yaml) — Многошаговые сценарии API для агентов
- [llms.txt](/llms.txt) — Краткое описание API для LLM
- [llms-full.txt](/llms-full.txt) — Полное описание API для LLM
- [llms-en.txt](/llms-en.txt) — English API documentation for LLM

