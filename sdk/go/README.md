# Pachca Go SDK

Go клиент для [Pachca API](https://dev.pachca.com).

## Установка

```bash
go get github.com/pachca/openapi/sdk/go/generated
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

## Сервисы

Методы API сгруппированы по сервисам:

| Сервис | Описание |
|--------|---------|
| `client.Messages` | Сообщения, треды, пины |
| `client.Chats` | Каналы и беседы |
| `client.ChatMembers` | Участники чатов |
| `client.Users` | Управление сотрудниками |
| `client.Tags` | Теги (группы) |
| `client.Tasks` | Задачи (напоминания) |
| `client.Search` | Полнотекстовый поиск |
| `client.Reactions` | Реакции на сообщения |
| `client.Bots` | Управление ботами |
| `client.Profile` | Профиль текущего пользователя |
| `client.Security` | Журнал аудита |
| `client.Uploads` | Загрузка файлов |
| `client.Exports` | Экспорт сообщений |
| `client.Forms` | Интерактивные формы |

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

## Примеры

См. [examples/main.go](examples/main.go) — echo-бот из 8 шагов, демонстрирующий CRUD, реакции, треды, пины.

Названия методов и параметров соответствуют [документации API](https://dev.pachca.com).
