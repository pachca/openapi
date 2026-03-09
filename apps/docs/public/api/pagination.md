
# Пагинация

API Пачки использует **cursor-based** пагинацию для всех списочных методов. Это обеспечивает стабильную работу при добавлении и удалении записей.

## Параметры

| Параметр | Тип | Описание |
|----------|-----|----------|
| `per` | integer | Количество записей на странице. По умолчанию — 50, максимум — 50 |
| `after` | integer | Курсор для получения следующей страницы |
| `before` | integer | Курсор для получения предыдущей страницы |

## Структура ответа

Каждый списочный метод возвращает блок `meta` с информацией о пагинации:

**Пример ответа с пагинацией**

```json
{
  "data": [...],
  "meta": {
    "paginate": {
      "current_page": 1,
      "last_page": false,
      "per": 50,
      "next_page": "https://api.pachca.com/api/shared/v1/chats?per=50&after=12345"
    }
  }
}
```


Если `last_page: true` — вы получили все записи. Если `false` — используйте `next_page` для следующего запроса.

## Обход всех записей

Для получения всех данных используйте цикл, пока `last_page` не станет `true`:

**Node.js: обход всех записей**

```javascript
const TOKEN = 'ваш_токен';
const BASE = 'https://api.pachca.com/api/shared/v1';
const headers = { Authorization: \`Bearer \${TOKEN}\` };

let url = \`\${BASE}/chats?per=50\`;
const allChats = [];

while (url) {
  const res = await fetch(url, { headers });
  const json = await res.json();
  allChats.push(...json.data);

  url = json.meta.paginate.last_page
    ? null
    : json.meta.paginate.next_page;
}

console.log(\`Всего чатов: \${allChats.length}\`);
```


**Python: обход всех записей**

```python
import requests

TOKEN = "ваш_токен"
BASE = "https://api.pachca.com/api/shared/v1"
headers = {"Authorization": f"Bearer {TOKEN}"}

url = f"{BASE}/chats?per=50"
all_chats = []

while url:
    resp = requests.get(url, headers=headers)
    data = resp.json()
    all_chats.extend(data["data"])

    paginate = data["meta"]["paginate"]
    url = None if paginate["last_page"] else paginate["next_page"]

print(f"Всего чатов: {len(all_chats)}")
```


## Какие методы поддерживают пагинацию

Все методы с префиксом **«Список»** в справочнике API:

- [Список чатов](/api/chats/list)
- [Список сообщений чата](/api/messages/list)
- [Список сотрудников](/api/users/list)
- [Список тегов](/api/group-tags/list)
- [Список участников чата](/api/members/list)
- [Список реакций](/api/reactions/list)
- [Журнал аудита](/api/security/list)
- и другие
