
# SDK

SDK для API Пачки автоматически генерируются из [OpenAPI-спецификации](https://dev.pachca.com/openapi.yaml). Они предоставляют типизированные клиенты с автокомплитом и актуальными моделями данных.

## Доступные SDK

- [TypeScript](https://github.com/pachca/openapi/tree/main/sdk/typescript) — npm install @pachca/sdk
- [Python](https://github.com/pachca/openapi/tree/main/sdk/python) — pip install pachca
- [Go](https://github.com/pachca/openapi/tree/main/sdk/go) — go get github.com/pachca/openapi/sdk/go
- [Kotlin](https://github.com/pachca/openapi/tree/main/sdk/kotlin) — Maven / Gradle
- [Swift](https://github.com/pachca/openapi/tree/main/sdk/swift) — Swift Package Manager


## Быстрый пример

### TypeScript

**TypeScript**

```typescript
import { createClient } from '@pachca/sdk';

const client = createClient({
  token: 'ваш_токен',
});

// Получить список чатов
const chats = await client.GET('/chats', {
  params: { query: { per: 10 } }
});

console.log(chats.data);
```


### Python

**Python**

```python
from pachca import Client

client = Client(token="ваш_токен")

# Получить список чатов
chats = client.chats.list(per=10)
print(chats.data)
```


### Go

**Go**

```go
package main

import (
    "context"
    "fmt"
    pachca "github.com/pachca/openapi/sdk/go"
)

func main() {
    client := pachca.NewClient("ваш_токен")

    chats, _ := client.Chats.List(context.Background(), &pachca.ListParams{Per: 10})
    fmt.Println(chats.Data)
}
```


## Ссылки

- [GitHub: pachca/openapi/sdk](https://github.com/pachca/openapi/tree/main/sdk) — исходный код всех SDK
- [OpenAPI-спецификация](https://dev.pachca.com/openapi.yaml) — YAML-файл для генерации
- [@pachca/sdk](https://www.npmjs.com/package/@pachca/sdk)

