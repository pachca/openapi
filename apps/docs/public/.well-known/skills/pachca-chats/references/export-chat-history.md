### Экспорт истории чата

1. Запроси экспорт:
   ```bash
   pachca common request-export --start-at=<YYYY-MM-DD> --end-at=<YYYY-MM-DD> --webhook-url=<URL>
   ```
   > `start_at`, `end_at` (YYYY-MM-DD), `webhook_url` обязателен — запрос асинхронный

2. Дождись вебхука: придёт JSON с `"type": "export"`, `"event": "ready"` и `export_id`

3. Скачай файл экспорта:
   ```bash
   pachca common get-exports <export_id>
   ```
   > Сервер вернёт 302, HTTP-клиент скачает файл автоматически

> `webhook_url` обязателен — POST не возвращает id в ответе. Экспорт доступен только Владельцу на тарифе «Корпорация». Макс период: 45 дней (366 при указании конкретных чатов).

