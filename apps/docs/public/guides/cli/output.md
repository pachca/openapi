> Это Markdown-версия конкретной страницы. Для контекста за её пределами (правила API, полный перечень методов, авторизация) ОБЯЗАТЕЛЬНО открой [llms.txt](https://dev.pachca.com/llms.txt) перед ответом — это сэкономит токены и предотвратит неполный ответ.


# Вывод

## Форматы вывода

CLI поддерживает четыре формата вывода. В интерактивном терминале (TTY) по умолчанию используется таблица, в пайпах и CI — JSON.

```bash
# Таблица (по умолчанию в терминале)
pachca users list

# JSON
pachca users list -o json

# YAML
pachca users list -o yaml

# CSV (для Excel / Google Sheets)
pachca users list -o csv
```

### Колонки и заголовки

По умолчанию таблица показывает 4-5 основных полей. Выбрать конкретные колонки:

```bash
# Выбрать колонки
pachca users list --columns id,email,role

# Без заголовка (для скриптов)
pachca users list --columns email --no-header

# Не обрезать длинные значения
pachca users list --no-truncate
```

### Плоский вывод

Флаг `--plain` — именованный режим для скриптов: TSV (значения через таб), без заголовка, колонка `id` первой, без цвета и обрезки. Удобно для `cut`/`awk` вместо комбинации `--columns ... --no-header -o csv`:

```bash
# id <tab> name <tab> ...
pachca users list --plain

# Вторая колонка (name) каждой строки
pachca users list --plain | cut -f2

# Только нужные колонки сохраняют свой порядок
pachca users list --plain --columns email,role
```

### Пайпы и перенаправление

В пайпах CLI автоматически выводит JSON и отключает цвет и спиннер. Данные идут в stdout, ошибки и прогресс — в stderr.

```bash
# Передать в jq
pachca users list | jq '.[].name'

# Текст сообщения из файла
pachca messages create --entity-id 123 < message.txt

# Текст из pipe
echo "Деплой завершён" | pachca messages create --entity-id 123

# Скачать файл (для команд с редиректом)
pachca common get-exports 123 --save ./export.zip
```

## Пагинация

Pachca использует cursor-based пагинацию. CLI предоставляет три способа навигации:

```bash
# Первая страница (по умолчанию)
pachca users list --limit 20

# Следующая страница вручную
pachca users list --cursor eyJpZCI6NTB9

# Загрузить все страницы автоматически
pachca users list --all
```

При `--all` CLI показывает прогресс загрузки в stderr, а финальный результат выводит в stdout единым массивом.

В API существует **две группы методов с пагинацией**, у которых разная структура `meta` в JSON-выводе:

- **Списочные методы** (`pachca users list`, `pachca chats list`, `pachca messages list` и т.д.) — `meta.paginate` с полями `next_page`, `prev_page`, `has_next`, `has_prev`. Признак конца — `has_next: false`.
- **Методы поиска** (`pachca search list-users`, `pachca search list-chats`, `pachca search list-messages`) — `meta` с полями `total` и `paginate.next_page` (без `prev_page`/`has_next`/`has_prev`). Признак конца — пустой `data` или совпадение числа полученных записей с `total`.

Подробнее — в разделе [Пагинация](/api/pagination).


## Связанные разделы

- [Флаги и скрипты](/guides/cli/scripting)
- [Команды](/guides/cli/commands)
- [Прямые запросы](/guides/cli/api-requests)
