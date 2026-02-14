# Pachca Go SDK

Go клиент для Pachca API.

## Установка

```bash
go get github.com/pachca/go-sdk
```

## Использование

```go
package main

import (
    "context"
    pachca "github.com/pachca/go-sdk"
)

func main() {
    client, _ := pachca.NewClientWithResponses(
        "https://api.pachca.com/api/v1",
        pachca.WithRequestEditorFn(func(ctx context.Context, req *http.Request) error {
            req.Header.Set("Authorization", "Bearer YOUR_TOKEN")
            return nil
        }),
    )

    users, _ := client.GetUsersWithResponse(context.Background())
}
```

Названия методов и параметров соответствуют [документации API](https://dev.pachca.com).
