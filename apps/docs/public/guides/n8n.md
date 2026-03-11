
# n8n

## Что такое n8n

n8n — это платформа для автоматизации рабочих процессов с открытым исходным кодом. Ее можно либо разместить на собственном сервере, либо использовать веб-версию. Платформа позволяет создавать различные интеграции с сервисами без знаний программирования и написания кода, используя вместо этого визуальный редактор с узлами (nodes).

В настоящее время в n8n встроено более 400 готовых узлов для популярных зарубежных и российских сервисов. Существуют узлы двух типов:

- **Узел триггера** — это то, что запускает ваш рабочий процесс. То есть некое событие, например, сообщение от бота, нажатие кнопки, обновление статуса проекта и др.
- **Узел действия** — это то, что будет происходит после триггера. То есть сама логика вашего рабочего процесса, например, отправка сообщения в чат, создание задачи в другом приложении, добавление записи в БД и так далее.

n8n автоматически запускает каждое действие по триггеру, соблюдая указанный вами порядок.

![Интерфейс n8n с визуальным редактором workflow](/images/n8n/n8n-interface.avif)

*Визуальный редактор n8n*


## Настройка


  ### Шаг 1. Установка n8n

> **Внимание:** Расширение Пачки доступно пока только в Beta. Это значит, что его нет в веб-версии n8n и для пользования нужно предварительно развернуть на собственном сервере коробочную версию n8n.


    Это можно сделать двумя способами:

    **С помощью команды** (требуется Node.js):

    ```bash
    npx n8n
    ```

    **С помощью Docker**

    ```bash
    docker volume create n8n_data

    docker run -it --rm \
      --name n8n \
      -p 5678:5678 \
      -e GENERIC_TIMEZONE="<YOUR_TIMEZONE>" \
      -e TZ="<YOUR_TIMEZONE>" \
      -e N8N_ENFORCE_SETTINGS_FILE_PERMISSIONS=true \
      -e N8N_RUNNERS_ENABLED=true \
      -v n8n_data:/home/node/.n8n \
      docker.n8n.io/n8nio/n8n
    ```

    Подробные инструкции есть в [официальной документации n8n](https://docs.n8n.io/hosting/) и на [GitHub](https://github.com/n8n-io/n8n). Для корректной работы и безопасной передачи данных советуем проконсультироваться с вашими IT-специалистами.

    Далее нужно настроить аккаунт владельца (Owner Account), указав почту, имя и пароль. Готово!

    ![Настройка аккаунта владельца n8n](/images/n8n/owner-account.avif)

*Настройка Owner Account*


  ### Шаг 2. Настройка расширения Пачки для n8n

Следующий шаг — установка расширения Пачки. Оно есть как на [GitHub](https://github.com/doesntneedname/n8n-nodes-pachca), так и на [npmjs](https://www.npmjs.com/package/n8n-nodes-pachca), поэтому вы сами можете легко ознакомиться с исходным кодом.

    Есть 3 способа установки:

    1. **Первый:** Зайти в Settings → Community nodes и нативно добавить `n8n-nodes-pachca` (рекомендуем)
    2. **Второй:** Использовать команду `npm i n8n-nodes-pachca` в нужной директории
    3. **Третий:** Идти по README-инструкции, которая доступна на [GitHub](https://github.com/doesntneedname/n8n-nodes-pachca)

    ![Установка расширения Пачки через Community nodes](/images/n8n/community-nodes.avif)

*Установка через Community nodes*


  ### Шаг 3. Создание Credentials

Credentials — это данные для авторизации.

    Нажмите **Add Credential**, найдите **Pachca API** в списке и заполните поля:

    - **Base URL:** `https://api.pachca.com/api/shared/v1`
    - **Access Token:** Ваш токен доступа к API Pachca. Токен должен иметь необходимые права доступа для операций, которые вы планируете выполнять. В пачке есть три вида токенов:
      - токен Владельца / Администратора → доступен в разделе «Автоматизации»
      - токен Бота → доступен в настройках бота

    Для удобства можно переименовать созданный Credential. Таких Credentials вы можете сделать неограниченное количество для совершения разных операций.

    ![Создание Credentials для Пачки в n8n](/images/n8n/credentials.avif)

*Настройка Pachca API Credentials*


  ### Шаг 4. Создание Workflow

Workflow — это ваш рабочий стол, тот самый визуальный редактор с узлами (nodes). Тут вы выстраиваете цепочки триггеров и действий для различных сценариев.

    ![Визуальный редактор workflow в n8n](/images/n8n/workflow-editor.avif)

*Редактор workflow*


    В библиотеке Pachca (Beta) находятся все наши методы API. Разберем принципы работы n8n на примере сообщения от лица бота. Триггер — нажатие кнопки Execute Workflow (но может быть и любое другое событие, например, получение вебхука), а действие — Send a message в Пачке, где следующие параметры:

    - **Credential** = то, от чье-го лица будет отправлено сообщение (создали ранее)
    - **Entity ID** = это ID чата
    - **Content** = содержание сообщения

    Главное, не забудьте добавить бота в чат Пачки :)

    ![Пример workflow с отправкой сообщения](/images/n8n/workflow-example.avif)

*Пример отправки сообщения*


    С помощью n8n можно реализовать в Пачке те же самые автоматизации, но в гораздо более лёгкой форме — достаточно заполнить значениями уже готовые блоки и выстроить нужную логику. Визуальный интерфейс позволяет видеть весь процесс целиком и мгновенно тестировать изменения. В платформу встроено более 400 готовых узлов для популярных сервисов, а дополнительные Community nodes можно установить прямо из интерфейса (если они опубликованы на npmjs.com, как Битрикс24). При необходимости можно отправлять HTTP request, например, для работы с любым открытым API, задавать условия if, добавлять кастомный JavaScript или Python код и многое другое.


## Методы API в nodes Pachca (Beta)

Nodes (узлы) в расширении Пачки для n8n совпадают с методами API. Вот список доступных:

### Действия с сообщениями

- **Send a message** — [Новое сообщение](POST /messages)
- **Get a message** — [Информация о сообщении](GET /messages/{id})
- **Get messages from the chat** — [Список сообщений чата](GET /messages)
- **Update a message** — [Редактирование сообщения](PUT /messages/{id})
- **Delete a message** — [Удаление сообщения](DELETE /messages/{id})
- **Pin a message** — [Закрепление сообщения](POST /messages/{id}/pin)
- **Unpin a message** — [Открепление сообщения](DELETE /messages/{id}/pin)
- **Get message readers** — [Список прочитавших сообщение](GET /messages/{id}/read_member_ids)
- **Unfurl message links** — [Unfurl (разворачивание ссылок)](POST /messages/{id}/link_previews)

### Действия с тредами

- **Create a thread** — [Новый тред](POST /messages/{id}/thread)
- **Get a thread** — [Информация о треде](GET /threads/{id})

### Действия с реакциями

- **Add a reaction** — [Новая реакция](POST /messages/{id}/reactions)
- **Remove a reaction** — [Удаление реакции](DELETE /messages/{id}/reactions)
- **Get message reactions** — [Список реакций на сообщение](GET /messages/{id}/reactions)

### Действия с чатом

- **Get all chats** — [Список чатов](GET /chats)
- **Get a chat** — [Информация о чате](GET /chats/{id})
- **Create a chat** — [Новый чат](POST /chats)
- **Update a chat** — [Обновление чата](PUT /chats/{id})
- **Archive a chat** — [Архивация чата](PUT /chats/{id}/archive)
- **Unarchive a chat** — [Разархивация чата](PUT /chats/{id}/unarchive)
- **Get chat members** — [Список участников чата](GET /chats/{id}/members)
- **Add users to chat** — [Добавление пользователей](POST /chats/{id}/members)
- **Remove user from chat** — [Исключение пользователя](DELETE /chats/{id}/members/{user_id})
- **Update user role in chat** — [Редактирование роли](PUT /chats/{id}/members/{user_id})
- **Leave a chat** — [Выход из чата](DELETE /chats/{id}/leave)

### Действия с пользователями

- **Get all users** — [Список сотрудников](GET /users)
- **Get a user** — [Информация о сотруднике](GET /users/{id})
- **Create a user** — [Новый сотрудник](POST /users)
- **Update a user** — [Редактирование сотрудника](PUT /users/{id})
- **Delete a user** — [Удаление сотрудника](DELETE /users/{id})

### Действия с тегами пользователей

- **Get all group tags** — [Список тегов сотрудников](GET /group_tags)
- **Get a group tag** — [Информация о теге](GET /group_tags/{id})
- **Create a group tag** — [Новый тег](POST /group_tags)
- **Update a group tag** — [Редактирование тега](PUT /group_tags/{id})
- **Delete a group tag** — [Удаление тега](DELETE /group_tags/{id})
- **Get users in group tag** — [Список сотрудников тега](GET /group_tags/{id}/users)
- **Add tags to chat** — [Добавление тегов](POST /chats/{id}/group_tags)
- **Remove tag from chat** — [Исключение тега](DELETE /chats/{id}/group_tags/{tag_id})

### Действия со статусом и профилем

- **Get my profile** — [Информация о профиле](GET /profile)
- **Get my status** — [Текущий статус](GET /profile/status)
- **Set my status** — [Новый статус](PUT /profile/status)
- **Clear my status** — [Удаление статуса](DELETE /profile/status)

### Действия с формами

- **Create a form** — [Открытие представления](POST /views/open)
- **Process form submission** — закрытие и отображение ошибок
- **Get form templates**

### Другие действия

- **Get custom properties** — [Список дополнительных полей](GET /custom_properties)
- **Create a task** — [Новое напоминание](POST /tasks)
- **Update a bot** — [Редактирование бота](PUT /bots/{id})
- **Upload a file** — [Загрузка файла](POST /direct_url)

> **Внимание:** Обратите внимание, что некоторые действия возможны только с токеном Владельца/Администратора.

