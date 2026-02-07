# Pachca TypeScript SDK

Типизированный клиент для Pachca API на базе [openapi-fetch](https://openapi-ts.dev/openapi-fetch/).

## Установка

```bash
npm install @pachca/typescript
```

## Использование

```typescript
import { createClient } from '@pachca/typescript';

const client = createClient({
  baseUrl: 'https://api.pachca.com/api/v1',
  headers: {
    Authorization: 'Bearer YOUR_TOKEN',
  },
});

const { data, error } = await client.GET('/users');
```

Названия методов и параметров соответствуют [документации API](https://dev.pachca.com).
