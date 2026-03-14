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

## Сервисы

Методы API сгруппированы по сервисам:

| Сервис | Описание |
|--------|---------|
| `pachca.messages` | Сообщения, пины |
| `pachca.chats` | Каналы и беседы |
| `pachca.users` | Управление сотрудниками |
| `pachca.tasks` | Задачи (напоминания) |
| `pachca.tags` | Теги (группы) |
| `pachca.members` | Участники чатов |
| `pachca.reactions` | Реакции на сообщения |
| `pachca.threads` | Треды |
| `pachca.profile` | Профиль текущего пользователя |
| `pachca.bots` | Управление ботами |
| `pachca.security` | Журнал аудита |
| `pachca.common` | Поиск, загрузки, формы и др. |

## Пагинация

Для эндпоинтов с курсорной пагинацией SDK генерирует `*All`-методы, которые автоматически обходят все страницы:

```typescript
// Вручную
let cursor: string | undefined;
const chats: Chat[] = [];
do {
  const response = await pachca.chats.listChats({ cursor });
  chats.push(...response.data);
  cursor = response.meta?.paginate?.nextPage;
} while (cursor);

// Автоматически
const allChats = await pachca.chats.listChatsAll();
```

Доступные методы: `listChatsAll`, `listUsersAll`, `listTasksAll`, `listTagsAll`, `listMembersAll`, `listChatMessagesAll`, `listReactionsAll`, `searchChatsAll`, `searchMessagesAll`, `searchUsersAll` и др.

## Повторные запросы

SDK автоматически повторяет запросы при получении ответа `429 Too Many Requests`. Используется заголовок `Retry-After` для определения задержки, с экспоненциальным backoff (до 3 попыток).

## Примеры

См. [examples/main.ts](examples/main.ts) — echo-бот из 8 шагов, демонстрирующий CRUD, реакции, треды, пины.

```bash
PACHCA_TOKEN=<token> PACHCA_CHAT_ID=<id> bun run examples/main.ts
```

## Разработка

Генерация SDK:

```bash
cd sdk/typescript && bun run generate
```

Это запускает 3-шаговый pipeline:
1. `strip-operations.ts` — убирает `*Operations_` из operationId
2. `openapi-ts` — генерирует типы и SDK-функции
3. `generate-client.ts` — генерирует `PachcaClient` facade из сгенерированного кода

Названия методов и параметров соответствуют [документации API](https://dev.pachca.com).
