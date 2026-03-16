### Разворачивание ссылок (unfurling)

1. Создай специального Unfurl-бота и укажи отслеживаемые домены

2. При появлении ссылки бот получает вебхук `"event": "link_shared"` с массивом `links`

3. Извлеки данные из своей системы по URL из `links`

4. Отправь превью-данные:
   ```bash
   pachca link-previews add <message_id> --link-previews='{"https://example.com":{"title":"Example","description":"Description"}}'
   ```

> Эндпоинт привязан к конкретному сообщению. Необходим специальный Unfurl-бот с указанными доменами.

