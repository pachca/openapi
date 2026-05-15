
# Запросы к API

Большинство задач решаются типизированными командами (`pachca messages create …` — см. [Команды](/guides/cli/commands)). Для всего остального есть `pachca api` — escape hatch для прямых HTTP-запросов:

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

> `pachca api` выводит сырой ответ API без извлечения данных из обёртки `data`


## Список эндпоинтов и справка по API

Не нужно знать эндпоинт заранее или искать его в документации. В CLI встроены команды, которые показывают список всех эндпоинтов и справку по каждому. Эти данные генерируются из той же OpenAPI-спецификации, из которой собран сам CLI, поэтому всегда совпадают с актуальным API:

```bash
# Список всех эндпоинтов (METHOD PATH SUMMARY SCOPE)
pachca api ls
pachca api ls --json          # машиночитаемо

# Краткая справка по эндпоинту: параметры, тело, скоуп, эквивалентная команда
pachca api POST /messages --describe

# OpenAPI-фрагмент эндпоинта (схемы запроса/ответа)
pachca api GET /messages --spec

# Полный markdown-референс эндпоинта
pachca api POST /messages --docs
```

Метод указывается позиционно, поэтому `--describe`/`--spec`/`--docs` всегда однозначны — отдельный `-X` не нужен.

**Зачем это агенту.** Не нужно грузить всю документацию в контекст или ходить на dev-сайт. Агент спрашивает у самого CLI ровно нужный метод — `pachca api ls`, затем `pachca api POST /messages --describe` — и сразу его вызывает. Точечно, быстро, минимум контекста, всегда синхронно с актуальным API. Как это вписывается в подключение агента — в разделе [AI агенты](/guides/ai-agents).
