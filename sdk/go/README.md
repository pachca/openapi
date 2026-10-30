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
			Content:  pachca.Ptr("Привет из Go SDK!"),
		},
	})
	if err != nil {
		log.Fatal(err)
	}
	fmt.Printf("Сообщение отправлено: %d\n", msg.ID)
}
```

## Конвенции

- **Вход**: path-параметры передаются аргументами метода. Тело из одного обязательного поля, например роль участника чата, тоже разворачивается в аргумент. Остальные тела передаются одним объектом-запросом.
- **Выход**: если ответ API содержит единственное поле `data`, SDK возвращает его содержимое напрямую. Если рядом с `data` есть `meta` (списки и метод `Новый чат`), SDK возвращает ответ целиком: `data` и `meta`.
- **Значение null**: необязательное поле, которое не задано, в запрос не попадает. Чтобы отправить `null` там, где API его принимает (например, `null` в `webhook.kind` удаляет входящий вебхук бота), назовите поле в `NullFields` модели запроса так, как оно называется в Go: `pachca.BotUpdateRequestWebhook{NullFields: []string{"Kind"}}`.

```go
// Тело из одного поля → аргумент
err := client.Members.UpdateMemberRole(ctx, chatID, userID, pachca.ChatMemberRoleAdmin)
err = client.Messages.PinMessage(ctx, messageID)

// Тело из нескольких полей → объект-запрос
reaction, err := client.Reactions.AddReaction(ctx, messageID, pachca.ReactionRequest{Code: "👍"})

// Ответ: API возвращает {"data": ...}, SDK возвращает объект напрямую
msg, err := client.Messages.GetMessage(ctx, messageID) // *Message, не *MessageResponse
```

## Пагинация

Для методов с курсорной пагинацией SDK генерирует `*All`-методы, которые автоматически обходят все страницы:

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

Метод `*All` есть у каждого метода с пагинацией, полный список — на странице [Go SDK](https://dev.pachca.com/guides/sdk/go#avtopaginatsiya).

## Повторные запросы

SDK повторяет запросы сам. Паузы между попытками описаны на странице [Go SDK](https://dev.pachca.com/guides/sdk/go#povtornye-zaprosy), общие правила повторов — в разделе [Повторные запросы](https://dev.pachca.com/api/limits#povtornye-zaprosy-retry).

## Свой HTTP-клиент

Для настройки прокси, TLS и других параметров транспорта используйте `NewPachcaClientWithHTTP()` с готовым `*http.Client`. Заголовок `Authorization` такой клиент ставит сам, например своим `http.RoundTripper`, как в полном примере:

```go
transport := &http.Transport{
    Proxy: http.ProxyURL(proxyURL),
}
httpClient := &http.Client{Transport: &bearerTransport{token: token, base: transport}}

client := pachca.NewPachcaClientWithHTTP(pachca.PachcaAPIURL, httpClient)
```

Полный пример: [`examples/httpclient.go`](examples/httpclient.go)

## Загрузка файлов

Загрузка файла идёт в три шага: параметры загрузки, отправка файла по адресу `DirectURL` и сообщение с ключом файла. Подробнее — в разделе [Загрузка файлов](https://dev.pachca.com/api/file-uploads).

```go
filename := "report.pdf"
data, err := os.ReadFile(filename)
if err != nil {
    log.Fatal(err)
}

// 1. Получить параметры загрузки и подставить имя файла в ключ
params, err := client.Files.GetUploadParams(ctx)
if err != nil {
    log.Fatal(err)
}
key := strings.Replace(params.Key, "${filename}", filename, 1)

// 2. Загрузить файл по адресу DirectURL
err = client.Files.UploadFile(ctx, params.DirectURL, pachca.FileUploadRequest{
    ContentDisposition: params.ContentDisposition,
    ACL:                params.ACL,
    Policy:             params.Policy,
    XAMZCredential:     params.XAMZCredential,
    XAMZAlgorithm:      params.XAMZAlgorithm,
    XAMZDate:           params.XAMZDate,
    XAMZSignature:      params.XAMZSignature,
    Key:                key,
    Bucket:             params.Bucket,
    File:               bytes.NewReader(data),
})
if err != nil {
    log.Fatal(err)
}

// 3. Отправить сообщение с файлом
_, err = client.Messages.CreateMessage(ctx, pachca.MessageCreateRequest{
    Message: pachca.MessageCreateRequestMessage{
        EntityID: chatID,
        Content:  pachca.Ptr("Отчёт за неделю"),
        Files: []pachca.MessageCreateRequestFile{
            {Key: key, Name: filename, FileType: pachca.FileTypeFile, Size: pachca.Ptr(int64(len(data)))},
        },
    },
})
```

Полный пример: [`examples/upload.go`](examples/upload.go)

## Обработка ошибок

```go
_, err := client.Messages.GetMessage(ctx, 999999)
if err != nil {
    var apiErr *pachca.ApiError
    if errors.As(err, &apiErr) {
        fmt.Printf("Ошибка API: %s\n", apiErr.Error())
    }
    var oauthErr *pachca.OAuthError
    if errors.As(err, &oauthErr) {
        fmt.Printf("Ошибка авторизации: %s\n", oauthErr.Error())
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
    pachca.MessagesServiceStub
}

func (m *mockMessagesService) GetMessage(ctx context.Context, id int32) (*pachca.Message, error) {
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

Полный пример: [`examples/stub.go`](examples/stub.go)
