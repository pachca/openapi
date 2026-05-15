
# CLI

[@pachca/cli](https://www.npmjs.com/package/@pachca/cli) npm


`pachca` — официальный CLI для Pachca API: авторизация, сообщения, управление пространством — всё из терминала. Каждый метод API доступен как команда с типизированными флагами, валидацией и подсказками. Нужен Node.js 20+.

## Быстрый старт


  ### Шаг 1. Установка

```bash
    npm install -g @pachca/cli
    pachca --version
    ```

    Подробнее — [Установка](/guides/cli/installation) (есть и вариант без установки через `npx`).


  ### Шаг 2. Авторизация

```bash
    pachca auth login
    # или для CI: pachca auth login --token YOUR_ACCESS_TOKEN
    ```

    Подробнее — [Авторизация](/guides/cli/authentication).


  ### Шаг 3. Первый запрос

```bash
    pachca users list

    # ID    Имя              Email               Роль
    # 1234  Иван Иванов      ivan@company.ru     admin
    # 5678  Мария Петрова    maria@company.ru    user

    pachca messages create --entity-id 123 --content "Привет!"
    ```

    Пропущенные обязательные флаги CLI запросит интерактивно. Добавьте `-o json` для JSON-вывода.


## Два способа работы

**1. Типизированные команды.** Каждый метод API — отдельная команда `pachca <секция> <действие>` с флагами, валидацией и подсказками. Так написаны все примеры в документации и интеграции. Справка по любой команде — флаг `--help`:

```bash
pachca messages create --entity-id 123 --content "Привет"
pachca messages create --help   # параметры, флаги, примеры команды
pachca commands                 # список всех команд
```

Полный справочник — [Команды](/guides/cli/commands), готовые пошаговые рецепты под задачу — [Сценарии](/guides/cli/workflows).

**2. Прямые запросы (`pachca api`).** Для нестандартных вызовов и отладки — прямой HTTP-запрос к любому методу. Эта же команда работает как встроенный справочник по API: список эндпоинтов и справку по каждому (параметры, тело, пример) можно получить прямо в терминале, **не открывая сайт документации** — особенно удобно агентам:

```bash
pachca api ls                          # список всех эндпоинтов
pachca api POST /messages --describe   # параметры, тело, пример
pachca api POST /messages -f message[content]="Привет"
```

Подробнее — [Прямые запросы](/guides/cli/api-requests).

## Разделы

- [Команды](/guides/cli/commands) — Полный справочник: каждый метод API как команда со всеми флагами
- [Скрипты и CI](/guides/cli/scripting) — Форматы вывода, пагинация, exit codes, таксономия ошибок
- [Сценарии](/guides/cli/workflows) — Готовые пошаговые рецепты под типовые задачи
- [Файлы](/guides/cli/files) — Загрузка файла на S3 одной командой
- [Прямые запросы](/guides/cli/api-requests) — `pachca api` и встроенный справочник по API в терминале
- [AI агенты](/guides/ai-agents) — Те же команды выполняет агент — рутину берёт на себя

