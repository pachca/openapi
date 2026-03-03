# Pachca TypeScript SDK

Типизированный клиент для [Pachca API](https://dev.pachca.com) на базе [@hey-api/openapi-ts](https://heyapi.dev).

## Установка

```bash
npm install @pachca/sdk
```

## Использование

```typescript
import { Pachca } from "@pachca/sdk";

const pachca = new Pachca({ token: "YOUR_TOKEN" });

// Отправка сообщения
const { data } = await pachca.messages.createMessage({
  body: {
    message: { entity_id: chatId, content: "Привет из TypeScript SDK!" },
  },
});

// Список всех пользователей (автопагинация)
for await (const user of pachca.users.listAllUsers()) {
  console.log(user.first_name);
}
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

## Прямой импорт функций

Для tree-shaking можно импортировать функции напрямую:

```typescript
import { createClient, listUsers } from "@pachca/sdk";

const client = createClient({
  baseUrl: "https://api.pachca.com/api/shared/v1",
  auth: () => "YOUR_TOKEN",
});

const { data } = await listUsers({ client });
```

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
3. `generate-client.ts` — генерирует `Pachca` facade из сгенерированного кода

Названия методов и параметров соответствуют [документации API](https://dev.pachca.com).
