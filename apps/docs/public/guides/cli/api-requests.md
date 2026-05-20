> Это Markdown-версия страницы. Используй её содержимое для ответов по этой теме.
> Для общего обзора API — [llms.txt](https://dev.pachca.com/llms.txt).


# Прямые запросы

Команда `pachca api` делает две вещи:

- **прямой HTTP-запрос** к любому методу API — для нестандартных вызовов, отладки или метода без удобной обёртки;
- **встроенный справочник по API** — список эндпоинтов и справку по каждому (параметры, тело, схема, пример) можно получить прямо в терминале, не открывая сайт документации.

Для типовых задач удобнее [типизированные команды](/guides/cli/commands) и готовые [Сценарии](/guides/cli/workflows) — так написаны все примеры в документации и интеграции. Команда `pachca api` дополняет их.

## Прямой HTTP-запрос

```bash
# GET с query params
pachca api GET /messages --query chat_id=123

# POST с типизированными полями (-F конвертирует числа и boolean)
pachca api POST /messages -F message[entity_id]=12345 -f message[content]="Привет"

# PUT со строковым полем (-f гарантирует string)
pachca api PUT /tasks/42 -f task[due_at]="2026-04-01T10:00:00Z"

# Отправить готовый JSON-файл
pachca api POST /messages --input payload.json

# Инлайн JSON-строка (самодостаточная команда — удобно для агентов)
pachca api POST /messages --data '{"message":{"entity_id":123,"content":"Привет"}}'

# Из stdin
cat payload.json | pachca api POST /messages --input -
```

> Команда `pachca api` выводит сырой ответ API без извлечения данных из обёртки `data`


## Встроенный справочник по API

Не нужно искать путь и параметры на сайте документации — список эндпоинтов и справку по каждому CLI показывает прямо в терминале. Данные генерируются из той же OpenAPI-спецификации, из которой собран сам CLI, поэтому всегда совпадают с актуальным API:

```bash
# Список всех эндпоинтов (METHOD PATH SUMMARY SCOPE)
pachca api ls

#  METHOD  PATH        SUMMARY                 SCOPE
#  POST    /chats      Новый чат               chats:create
#  GET     /chats      Список чатов            chats:read
#  POST    /messages   Новое сообщение         messages:create
#  GET     /messages   Список сообщений чата   messages:read
#  ...     весь список эндпоинтов API

# То же машиночитаемо
pachca api ls --json

# [
#   { "method": "POST", "path": "/messages", "summary": "Новое сообщение", "scope": "messages:create" },
#   ...
# ]

# Краткая справка по эндпоинту: параметры, тело, скоуп, эквивалентная команда
pachca api POST /messages --describe

# # POST /messages — Новое сообщение
# > Скоуп: messages:create
#
# ## Тело запроса
# - message: object (required) — Собранный объект параметров создаваемого сообщения
#   - entity_id: integer (required) — Идентификатор сущности
#   - content: string (required) — Текст сообщения
#   ...
#
# ## Эквивалентная команда
#   pachca messages create --entity-id=334 --content="..." --json --token YOUR_ACCESS_TOKEN

# OpenAPI-фрагмент эндпоинта (схемы запроса/ответа)
pachca api GET /messages --spec

# {
#   "method": "GET",
#   "path": "/messages",
#   "parameters": [
#     { "name": "chat_id", "in": "query", "required": true, ... },
#     ...
#   ]
# }

# Полный markdown-референс эндпоинта (как на сайте документации)
pachca api POST /messages --docs

# # Новое сообщение
# Метод: POST · Путь: /messages
# > Скоуп: messages:create
#
# ## Тело запроса
# ...
```

Метод указывается позиционно, поэтому `--describe`/`--spec`/`--docs` всегда однозначны — отдельный `-X` не нужен.

Полезно и агентам: они в основном работают [типизированными командами](/guides/cli/commands) и готовыми [сценариями](/guides/cli/workflows), а когда нужного метода нет под рукой — `api ls`/`--describe` дают точечную справку, не загружая всю документацию в контекст.
