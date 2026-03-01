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

	// Список сотрудников
	users, err := client.Users.ListUsers(ctx, pachca.UserOperationsListUsersParams{})
	if err != nil {
		log.Fatal(err)
	}
	for _, u := range users.Data {
		fmt.Println(u.FirstName, u.LastName)
	}

	// Отправка сообщения
	msg, err := client.Messages.CreateMessage(ctx, &pachca.MessageOperationsCreateMessageReq{
		Message: pachca.MessageOperationsCreateMessageReqMessage{
			EntityType: "discussion",
			EntityID:   12345,
			Content:    "Привет из Go SDK!",
		},
	})
	if err != nil {
		log.Fatal(err)
	}
	fmt.Printf("Сообщение отправлено: %d\n", msg.Data.ID)
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
params, err := client.Uploads.GetUploadParams(ctx)

// 2. Загрузить файл на S3
file, _ := os.Open("photo.png")
err = client.Uploads.UploadFile(ctx, params.Data.DirectURL, params, file, "photo.png")

// 3. Прикрепить к сообщению (используя key из params)
```

## Примеры

См. [examples/main.go](examples/main.go) — echo-бот, демонстрирующий CRUD-операции с сообщениями.

Названия методов и параметров соответствуют [документации API](https://dev.pachca.com).
