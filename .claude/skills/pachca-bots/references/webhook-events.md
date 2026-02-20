# Типы событий Webhook

Исходящие вебхуки отправляют JSON на указанный URL при наступлении событий.
Подпись: `Pachca-Signature` (HMAC-SHA256 от тела запроса с Signing secret).

## Новые сообщения

Отправляется при новом сообщении в чате, где участвует бот.
Можно фильтровать по командам (начало сообщения).

```json
{
  "event": "new",
  "type": "message",
  "webhook_timestamp": 1744618734,
  "chat_id": 918264,
  "content": "Текст сообщения",
  "user_id": 134412,
  "id": 56431,
  "created_at": "2025-04-14T08:18:54.000Z",
  "parent_message_id": null,
  "entity_type": "discussion",
  "entity_id": 918264,
  "thread": null,
  "url": "https://app.pachca.com/chats/124511?message=56431"
}
```

## Добавление и удаление реакций

Отправляется при добавлении/удалении реакции в чате, где участвует бот.
Поля: `event` (add/remove), `type` (reaction), `code` (emoji), `message_id`, `user_id`.

## Нажатие кнопок

Отправляется при нажатии Data-кнопки в сообщении бота.
Содержит `trigger_id` для открытия форм через `POST /views/open`.

## Изменение состава участников чатов

Отправляется при добавлении/удалении участников в чатах, где состоит бот.

## Изменение состава участников пространства

Глобальное событие (не требует добавления бота в чат). События: invite, confirm, update, suspend, activate, delete.

## Безопасность

1. Проверь подпись: `HMAC-SHA256(Signing secret, raw body)` === `Pachca-Signature`
2. Проверь `webhook_timestamp` — должен быть в пределах 1 минуты
3. Проверь IP отправителя: `37.200.70.177`

```javascript
const signature = crypto.createHmac("sha256", WEBHOOK_SECRET).update(rawBody).digest("hex");
if (signature !== request.headers['pachca-signature']) {
  throw "Invalid signature";
}
```
