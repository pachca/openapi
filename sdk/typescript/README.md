# Pachca TypeScript SDK

Типизированный клиент для [Pachca API](https://dev.pachca.com).

## Установка

```bash
npm install @pachca/sdk
```

## Использование

ESM:

```typescript
import { PachcaClient } from "@pachca/sdk";

const pachca = new PachcaClient("YOUR_TOKEN");

// Отправка сообщения
const message = await pachca.messages.createMessage({
  message: { entityId: chatId, content: "Привет из TypeScript SDK!" },
});

// Список пользователей
const users = await pachca.users.listUsers();
```

CommonJS:

```javascript
const { PachcaClient } = require("@pachca/sdk");

const pachca = new PachcaClient("YOUR_TOKEN");
```

## Конвенции

- **Вход**: path-параметры передаются аргументами метода. Тело из одного обязательного поля, например роль участника чата, тоже разворачивается в аргумент. Остальные тела передаются одним объектом-запросом.
- **Выход**: если ответ API содержит единственное поле `data`, SDK возвращает его содержимое напрямую. Если рядом с `data` есть `meta` (списки и метод `Новый чат`), SDK возвращает ответ целиком: `data` и `meta`.

```typescript
import { ChatMemberRole } from "@pachca/sdk";

// Тело из одного поля → аргумент
await pachca.members.updateMemberRole(chatId, userId, ChatMemberRole.Admin);
await pachca.messages.pinMessage(messageId);

// Тело из нескольких полей → объект-запрос
await pachca.reactions.addReaction(messageId, { code: "👍" });

// Ответ: API возвращает { data: Message }, SDK возвращает Message
const message = await pachca.messages.getMessage(messageId); // Message, не { data: Message }
```

## Пагинация

Для методов с курсорной пагинацией SDK генерирует `*All`-методы, которые автоматически обходят все страницы:

```typescript
import type { Chat } from "@pachca/sdk";

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

Метод `*All` есть у каждого метода с пагинацией, полный список — на странице [TypeScript SDK](https://dev.pachca.com/guides/sdk/typescript#avtopaginatsiya).

## Повторные запросы

SDK повторяет запросы сам. Паузы между попытками описаны на странице [TypeScript SDK](https://dev.pachca.com/guides/sdk/typescript#povtornye-zaprosy), общие правила повторов — в разделе [Повторные запросы](https://dev.pachca.com/api/limits#povtornye-zaprosy-retry).

## Свой HTTP-клиент

Для настройки заголовков, прокси и других параметров HTTP используйте конструктор с объектом конфигурации:

```typescript
import { PachcaClient } from "@pachca/sdk";

const client = new PachcaClient({
  headers: { Authorization: `Bearer ${token}` },
});
```

Полный пример: [`examples/custom-headers.ts`](examples/custom-headers.ts)

## Загрузка файлов

Загрузка файла идёт в три шага: параметры загрузки, отправка файла по адресу `directUrl` и сообщение с ключом файла. Подробнее — в разделе [Загрузка файлов](https://dev.pachca.com/api/file-uploads).

```typescript
import { readFileSync } from "node:fs";
import { FileType } from "@pachca/sdk";

const filename = "report.pdf";
const bytes = readFileSync(filename);

// 1. Получить параметры загрузки и подставить имя файла в ключ
const params = await pachca.files.getUploadParams();
const key = params.key.replace("${filename}", filename);

// 2. Загрузить файл по адресу directUrl
await pachca.files.uploadFile(params.directUrl, {
  contentDisposition: params.contentDisposition,
  acl: params.acl,
  policy: params.policy,
  xAmzCredential: params.xAmzCredential,
  xAmzAlgorithm: params.xAmzAlgorithm,
  xAmzDate: params.xAmzDate,
  xAmzSignature: params.xAmzSignature,
  key,
  bucket: params.bucket,
  file: new Blob([bytes]),
});

// 3. Отправить сообщение с файлом
await pachca.messages.createMessage({
  message: {
    entityId: chatId,
    content: "Отчёт за неделю",
    files: [{ key, name: filename, fileType: FileType.File, size: bytes.length }],
  },
});
```

Полный пример: [`examples/upload.ts`](examples/upload.ts)

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

## Тестирование

Для unit-тестов используйте `PachcaClient.stub()` — создаёт клиент без HTTP-подключения.

Методы без переопределения выбрасывают `Error("Service.method is not implemented")`:

```typescript
import { PachcaClient, MessagesService, Message } from "@pachca/sdk";

// Мок-сервис
class MockMessagesService extends MessagesService {
  async getMessage(id: number): Promise<Message> {
    return { id, content: "Test message", entityId: 123 } as Message;
  }
}

// Тест
const client = PachcaClient.stub({
  messages: new MockMessagesService(),
});

const message = await client.messages.getMessage(1);
expect(message.content).toBe("Test message");
```

Полный пример: [`examples/stub.ts`](examples/stub.ts)
