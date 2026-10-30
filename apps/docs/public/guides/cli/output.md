> Расположение: CLI
> Краткое содержание: Форматы вывода Pachca CLI (table, json, yaml, csv), выбор колонок, плоский TSV-режим, пайпы и перенаправление, курсорная пагинация.
> Это Markdown-версия конкретной страницы. Для контекста за её пределами (правила API, полный перечень методов, авторизация) ОБЯЗАТЕЛЬНО открой [llms.txt](https://dev.pachca.com/llms.txt) перед ответом — это сэкономит токены и предотвратит неполный ответ.


# Вывод

## Форматы вывода

CLI поддерживает четыре формата вывода. Формат задаёт флаг `-o`, без него — настройка `defaults.output` из [конфига](/guides/cli/installation#nastroyki). Если не задано ни то ни другое, в интерактивном терминале (TTY) используется таблица, в пайпах и CI — JSON.

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

По умолчанию таблица показывает 4–5 основных полей команды, заголовок колонки — имя поля в верхнем регистре. Выбрать конкретные колонки:

```bash
# Выбрать колонки
pachca users list --columns id,email,role

# Без заголовка (для скриптов)
pachca users list --columns email --no-header

# Не обрезать длинные значения
pachca users list --no-truncate
```

### Плоский вывод

Флаг `--plain` — именованный режим для скриптов: TSV (значения через таб), без заголовка, без цвета и обрезки. Без `--columns` колонки те же, что в таблице, и `id`, если оно есть, идёт первым. Удобно для `cut`/`awk` вместо комбинации `--columns ... --no-header -o csv`:

```bash
# id <tab> title <tab> first_name <tab> last_name <tab> email
pachca users list --plain

# Почта каждого сотрудника: вторая из выбранных колонок
pachca users list --plain --columns id,email | cut -f2

# Выбранные колонки идут в заданном порядке
pachca users list --plain --columns email,role
```

### Пайпы и перенаправление

В пайпах CLI автоматически выводит JSON, если в конфиге не задан другой `defaults.output`, и отключает цвет и спиннер. Данные идут в stdout, а ошибки, предупреждения и прогресс — в stderr.

```bash
# Передать в jq: имя и фамилия каждого сотрудника
pachca users list | jq -r '.[] | "\(.first_name) \(.last_name)"'

# Текст сообщения из файла
pachca messages create --entity-id 123 < message.txt

# Текст из pipe
echo "Деплой завершён" | pachca messages create --entity-id 123

# Скачать файл (для команд с редиректом)
pachca chats download-export 123 --save ./export.zip
```

## Пагинация

Пагинация в API курсорная. Команды списков принимают флаги `--limit`, `--cursor` и `--all`:

```bash
# Первая страница (по умолчанию)
pachca users list --limit 20

# Загрузить все страницы автоматически
pachca users list --all
```

При `--all` CLI проходит все страницы сам и выводит записи в stdout единым массивом. В терминале он показывает прогресс загрузки в stderr.

Без `--all` команда выводит только записи страницы, массив `data`. Блок `meta` с курсорами она не показывает, поэтому курсор следующей страницы берут из полного ответа [прямого запроса](/guides/cli/api-requests) `pachca api`:

```bash
# Полный ответ с meta: курсор следующей страницы
pachca api GET /users --query limit=20 | jq -r '.meta.paginate.next_page'

# Следующая страница по этому курсору
pachca users list --limit 20 --cursor <next_page>
```

Курсор следующей страницы у всех методов лежит в `meta.paginate.next_page`. Признак последней страницы у списочных методов и методов поиска разный, он описан в разделе [Две группы методов с пагинацией](/api/pagination#dve-gruppy-metodov-s-paginatsiey).


## Связанные разделы

- [Флаги и скрипты](/guides/cli/scripting)
- [Команды](/guides/cli/commands)
- [Прямые запросы](/guides/cli/api-requests)
