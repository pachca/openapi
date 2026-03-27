# Pachca Go SDK

Go клиент для [Pachca API](https://dev.pachca.com).

## Установка

```bash
go get github.com/pachca/openapi/sdk/go/generated@latest
```

## Использование

```go
package main

import (
	"context"
	"fmt"
	"log"

	pachca "github.com/pachca/openapi/sdk/go/generated"
)

func main() {
	client := pachca.NewPachcaClient("YOUR_TOKEN")

	ctx := context.Background()

	// Отправка сообщения
	msg, err := client.Messages.CreateMessage(ctx, pachca.MessageCreateRequest{
		Message: pachca.MessageCreateRequestMessage{
			EntityID: 12345,
			Content:  "Привет из Go SDK!",
		},
	})
	if err != nil {
		log.Fatal(err)
	}
	fmt.Printf("Сообщение отправлено: %d\n", msg.ID)
}
```

## Конвенции

- **Вход**: path-параметры и body-поля (если ≤2) разворачиваются в аргументы метода. Иначе — один объект-запрос.
- **Выход**: если ответ API содержит единственное поле `data`, SDK возвращает его содержимое напрямую.

```go
// ≤2 поля → развёрнуто в аргументы
reaction, err := client.Reactions.AddReaction(ctx, messageId, pachca.ReactionRequest{Code: "👍"})
err = client.Messages.PinMessage(ctx, messageId)

// >2 полей → объект-запрос
msg, err := client.Messages.CreateMessage(ctx, pachca.MessageCreateRequest{...})

// Ответ: API возвращает {"data": ...}, SDK возвращает объект напрямую
msg, err := client.Messages.CreateMessage(ctx, ...)  // *Message, не *MessageResponse
```

## Пагинация

Для эндпоинтов с курсорной пагинацией SDK генерирует `*All`-методы, которые автоматически обходят все страницы:

```go
// Вручную
var chats []pachca.Chat
var cursor *string
for {
    result, err := client.Chats.ListChats(ctx, &pachca.ListChatsParams{Cursor: cursor})
    if err != nil { break }
    if len(result.Data) == 0 { break }
    chats = append(chats, result.Data...)
    nextPage := result.Meta.Paginate.NextPage
    cursor = &nextPage
}

// Автоматически
allChats, err := client.Chats.ListChatsAll(ctx, nil)
```

Доступные методы: `ListChatsAll`, `ListUsersAll`, `ListTasksAll`, `ListTagsAll`, `ListMembersAll`, `ListChatMessagesAll`, `ListReactionsAll`, `SearchChatsAll`, `SearchMessagesAll`, `SearchUsersAll` и др.

## Повторные запросы

SDK автоматически повторяет запросы при получении ответа `429 Too Many Requests`. Используется заголовок `Retry-After` для определения задержки, с экспоненциальным backoff (до 3 попыток).

## Загрузка файлов

Загрузка файла — трёхшаговый процесс:

```go
// 1. Получить параметры загрузки
res, err := client.Uploads.GetUploadParams(ctx)
params := res.(*pachca.UploadParams)

// 2. Загрузить файл на S3
file, _ := os.Open("photo.png")
err = client.Uploads.UploadFile(ctx, params, file, "photo.png")

// 3. Прикрепить к сообщению (используя key из params)
```

## Обработка ошибок

```go
msg, err := client.Messages.GetMessage(ctx, 999999)
if err != nil {
    var apiErr *pachca.APIError
    if errors.As(err, &apiErr) {
        fmt.Printf("Ошибка API: %s\n", apiErr.Message)
    }
    var oauthErr *pachca.OAuthError
    if errors.As(err, &oauthErr) {
        fmt.Printf("Ошибка авторизации: %s\n", oauthErr.Message)
    }
}
```

## Тестирование

Для unit-тестов используйте `NewStubPachcaClient()` — создаёт клиент без HTTP-подключения.

Методы без переопределения возвращают `error` с сообщением `"Service.method is not implemented"`:

```go
import (
    "context"
    "testing"

    pachca "github.com/pachca/openapi/sdk/go/generated"
)

// Мок-сервис
type mockMessagesService struct {
    pachca.MessagesService
}

func (m *mockMessagesService) GetMessage(ctx context.Context, id int64) (*pachca.Message, error) {
    return &pachca.Message{ID: id, Content: "Test message", EntityID: 123}, nil
}

// Тест
func TestGetMessage(t *testing.T) {
    client := pachca.NewStubPachcaClient(
        pachca.WithStubMessages(&mockMessagesService{}),
    )

    msg, err := client.Messages.GetMessage(context.Background(), 1)
    if err != nil {
        t.Fatal(err)
    }
    if msg.Content != "Test message" {
        t.Errorf("expected 'Test message', got %q", msg.Content)
    }
}
```
