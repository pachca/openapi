
# Обзор

REST API Пачки позволяет автоматизировать работу в мессенджере: отправлять сообщения, управлять чатами и сотрудниками, создавать ботов и реагировать на события через вебхуки.

- [Быстрый старт](/guides/quickstart)
- [Авторизация](/api/authorization)
- [CLI](/guides/cli)
- [SDK](/api/sdk)

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
    "skip_invite_mentions": false,
    "link_preview": false
  }
}'
```


## Боты и автоматизации

Создавайте ботов, обрабатывайте команды, добавляйте кнопки и формы в сообщения, получайте события через вебхуки.

- [Боты](/guides/bots) — Создание и настройка ботов
- [Кнопки](/guides/buttons) — Ссылки и действия в сообщениях
- [Формы](/guides/forms/overview) — Модальные окна с полями ввода
- [Входящие вебхуки](/guides/incoming-webhooks) — Сообщения по URL без кода
- [Исходящие вебхуки](/guides/webhook) — События в реальном времени
- [Разворачивание ссылок](/guides/link-previews) — Превью ссылок в сообщениях


## No-code интеграции

Подключайте Пачку к внешним сервисам без написания кода.

- [n8n](/guides/n8n) — Визуальные автоматизации
- [Albato](/guides/albato) — Подключение 250+ сервисов


## Данные и безопасность

Экспорт данных, защита от утечек и мониторинг событий.

- [Экспорт сообщений](/guides/export) — Выгрузка всех сообщений в JSON
- [DLP-система](/guides/dlp) — Защита от утечек данных
- [Журнал аудита](/guides/audit-events) — Мониторинг событий безопасности


## Ресурсы

Спецификации, коллекции и файлы для интеграции.

- [OpenAPI-спецификация](/openapi.yaml) — Описание всех методов в YAML
- [Коллекция Postman](/pachca.postman_collection.json) — Все методы с примерами для Postman и Bruno
- [llms.txt](/llms.txt) — Краткое описание API для LLM
- [llms-full.txt](/llms-full.txt) — Полное описание API для LLM

