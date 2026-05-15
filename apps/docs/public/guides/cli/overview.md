
# CLI

[@pachca/cli](https://www.npmjs.com/package/@pachca/cli) npm


`pachca` — официальный CLI: авторизация, сообщения, управление пространством — всё из терминала. Каждый API-метод доступен как команда с типизированными флагами, валидацией и подсказками. Нужен Node.js 20+.

## Начните в терминале

Привычный путь, ничего нового осваивать не нужно — три шага до первого результата:


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


  ### Шаг 3. Первые команды

```bash
    pachca users list

    # ID    Имя              Email               Роль
    # 1234  Иван Иванов      ivan@company.ru     admin
    # 5678  Мария Петрова    maria@company.ru    user

    pachca messages create --entity-id 123 --content "Привет!"
    ```

    Пропущенные обязательные флаги CLI запросит интерактивно. Добавьте `-o json` для JSON.


## Следующий шаг: подключить агента

Те же команды может выполнять агент за вас — рутину делает он, вы остаётесь в контроле. Это не отдельный мир, а апгрейд того же инструмента: агент спрашивает у самого CLI нужный метод (`pachca api ls`) и сразу его вызывает.

[Подключить агента](/guides/ai-agents) тот же CLI, рутину делает агент за вас


## Что умеет CLI

- [Запросы к API](/guides/cli/api-requests) — `pachca api`, список эндпоинтов и справка по API
- [Скрипты и CI](/guides/cli/scripting) — форматы вывода, exit codes, таксономия ошибок
- [Файлы](/guides/cli/files) — загрузка на S3 одной командой
- [Сценарии](/guides/cli/workflows) — готовые пошаговые рецепты под задачу
- [Команды](/guides/cli/commands) — полный справочник всех команд

