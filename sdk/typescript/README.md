# Pachca TypeScript SDK

Типизированный клиент для [Pachca API](https://dev.pachca.com).

## Установка

```bash
npm install @pachca/sdk
```

## Использование

```typescript
import { PachcaClient } from "@pachca/sdk";

const pachca = new PachcaClient("YOUR_TOKEN");

// Отправка сообщения
const message = await pachca.messages.createMessage({
  message: { entity_id: chatId, content: "Привет из TypeScript SDK!" },
});

// Список пользователей
const users = await pachca.users.listUsers();
```

## Конвенции

- **Вход**: path-параметры и body-поля (если ≤2) разворачиваются в аргументы метода. Иначе — один объект-запрос.
- **Выход**: если ответ API содержит единственное поле `data`, SDK возвращает его содержимое напрямую.

```typescript
// ≤2 поля → развёрнуто в аргументы
await pachca.reactions.addReaction(messageId, { code: "👍" });
await pachca.messages.pinMessage(messageId);

// >2 полей → объект-запрос
await pachca.messages.createMessage({ message: { entity_id: 123, content: "..." } });

// Ответ: API возвращает { data: Message }, SDK возвращает Message
const message = await pachca.messages.createMessage(...); // Message, не { data: Message }
```

## Пагинация

Для эндпоинтов с курсорной пагинацией SDK генерирует `*All`-методы, которые автоматически обходят все страницы:

```typescript
// Вручную
let cursor: string | undefined;
const chats: Chat[] = [];
for (;;) {
  const response = await pachca.chats.listChats({ cursor });
  if (response.data.length === 0) break;
  chats.push(...response.data);
  cursor = response.meta.paginate.nextPage;
}

// Автоматически
const allChats = await pachca.chats.listChatsAll();
```

Доступные методы: `listChatsAll`, `listUsersAll`, `listTasksAll`, `listTagsAll`, `listMembersAll`, `listChatMessagesAll`, `listReactionsAll`, `searchChatsAll`, `searchMessagesAll`, `searchUsersAll` и др.

## Повторные запросы

SDK автоматически повторяет запросы при получении ответа `429 Too Many Requests`. Используется заголовок `Retry-After` для определения задержки, с экспоненциальным backoff (до 3 попыток).

## Загрузка файлов

Загрузка файла — трёхшаговый процесс:

```typescript
// 1. Получить параметры загрузки
const params = await pachca.common.getUploadParams();

// 2. Загрузить файл на S3
const file = fs.readFileSync("photo.png");
await pachca.common.uploadFile(params, file, "photo.png");

// 3. Прикрепить к сообщению (используя key из params)
```

## Обработка ошибок

```typescript
import { PachcaClient, ApiError, OAuthError } from "@pachca/sdk";

try {
  await pachca.messages.getMessage(999999);
} catch (e) {
  if (e instanceof OAuthError) {
    console.log(`Ошибка авторизации: ${e.message}`);
  } else if (e instanceof ApiError) {
    console.log(`Ошибка API: ${e.errors}`);
  }
}
```
