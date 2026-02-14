# Pachca Python SDK

Python клиент для Pachca API.

## Установка

```bash
pip install pachca
```

## Использование

```python
from pachca import Client

client = Client(base_url="https://api.pachca.com/api/v1")
client.set_token("YOUR_TOKEN")

users = client.users.list()
```

Названия методов и параметров соответствуют [документации API](https://dev.pachca.com).
