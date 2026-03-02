# Pachca Go SDK

Go клиент для Pachca API, сгенерированный с помощью [ogen](https://ogen.dev).

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
	client, err := pachca.NewPachcaClient(
		"https://api.pachca.com/api/shared/v1",
		"YOUR_TOKEN",
	)
	if err != nil {
		log.Fatal(err)
	}

	ctx := context.Background()

	// Отправка сообщения
	res, err := client.Messages.CreateMessage(ctx, &pachca.MessageCreateRequest{
		Message: pachca.MessageCreateRequestMessage{
			EntityType: pachca.NewOptMessageEntityType(pachca.MessageEntityTypeDiscussion),
			EntityID:   12345,
			Content:    "Привет из Go SDK!",
		},
	})
	if err != nil {
		log.Fatal(err)
	}
	created := res.(*pachca.MessageOperationsCreateMessageCreated)
	fmt.Printf("Сообщение отправлено: %d\n", created.Data.ID)
}
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
