> Расположение: n8n
> Краткое содержание: 18 ресурсов и более 60 операций расширения Пачки для n8n: сообщения, чаты, задачи, сотрудники, боты, теги и вебхуки в модели Resource → Operation
> Это Markdown-версия конкретной страницы. Для контекста за её пределами (правила API, полный перечень методов, авторизация) ОБЯЗАТЕЛЬНО открой [llms.txt](https://dev.pachca.com/llms.txt) перед ответом — это сэкономит токены и предотвратит неполный ответ.


# Ресурсы и операции

В расширении Пачки каждый узел **Pachca** работает по модели **Resource → Operation**: вы выбираете ресурс (например, Message) и операцию над ним (например, Create).

![Выпадающий список ресурсов в узле Pachca](/images/n8n/resource-dropdown.avif)

*Выбор ресурса в узле Pachca*


Для каждого ресурса доступен свой набор операций.

![Выпадающий список операций для ресурса Message](/images/n8n/operation-dropdown.avif)

*Операции для ресурса Message*


## Список ресурсов

| # | Ресурс | Операций | Описание | Только v2 |
|---|--------|:---:|----------|:---:|
| 1 | [Message](#message) | 8 | Сообщения: создание, редактирование, удаление, закрепление, unfurl | |
| 2 | [Chat](#chat) | 8 | Чаты: создание, обновление, архивация, экспорт | |
| 3 | [Chat Member](#chat-member) | 7 | Участники чата: добавление, удаление, роли, теги | да |
| 4 | [User](#user) | 10 | Сотрудники: CRUD, аватар, статус | |
| 5 | [Group Tag](#group-tag) | 6 | Теги сотрудников: CRUD, список пользователей | |
| 6 | [Thread](#thread) | 4 | Треды: создание, получение, список | |
| 7 | [Reaction](#reaction) | 3 | Реакции: создание, удаление, список | |
| 8 | [Profile](#profile) | 6 | Мой профиль: информация, аватар, статус | |
| 9 | [OAuth](#oauth) | 1 | Информация о токене | да |
| 10 | [Task](#task) | 5 | Задачи: полный CRUD | |
| 11 | [Bot](#bot) | 10 | Боты: создание, получение, список, редактирование, удаление, вебхук, ротация токена, события | |
| 12 | [File](#file) | 1 | Загрузка файлов через S3 | |
| 13 | [Form](#form) | 1 | Модальные формы | |
| 14 | [Custom Property](#custom-property) | 1 | Дополнительные поля | да |
| 15 | [Read Member](#read-member) | 1 | Список прочитавших сообщение | да |
| 16 | [Search](#search) | 3 | Полнотекстовый поиск | да |
| 17 | [Security](#security) | 1 | Журнал безопасности | да |

> **Внимание:** Для некоторых операций требуются скоупы, которые доступны только определённым ролям (администратор, владелец). При создании персонального токена отображаются только скоупы, доступные вашей роли. Подробнее — в разделе [Авторизация](/api/authorization).


---

## Message

Сообщения: создание, получение, редактирование, удаление, закрепление и открепление.

| Операция | API |
|----------|-----|
| Create | [Новое сообщение](/api/messages/create) |
| Get Many | [Список сообщений чата](/api/messages/list) |
| Get | [Информация о сообщении](/api/messages/get) |
| Update | [Редактирование сообщения](/api/messages/update) |
| Delete | [Удаление сообщения](/api/messages/delete) |
| Pin | [Закрепление сообщения](/api/messages/pin) |
| Unpin | [Открепление сообщения](/api/messages/unpin) |
| Unfurl | [Unfurl (разворачивание ссылок)](/api/messages/unfurl) |

**Ключевые параметры Create:** `entityId` (ID чата или пользователя), `content` (текст, Markdown), `entityType` (discussion, user, thread), `files`, `buttons`, `parentMessageId`.

**Сортировка в Get Many:** параметры `sort` (по умолчанию `id`) и `order` (`asc` / `desc`) определяют порядок выдачи сообщений.

![Настройка Message Get Many с Entity ID и Return All](/images/n8n/message-get-many.avif)

*Настройка Message → Get Many*


---

## Chat

Чаты: создание, получение, обновление, архивация и разархивация.

| Операция | API |
|----------|-----|
| Create | [Новый чат](/api/chats/create) |
| Get Many | [Список чатов](/api/chats/list) |
| Get | [Информация о чате](/api/chats/get) |
| Update | [Редактирование чата](/api/chats/update) |
| Archive | [Архивация чата](/api/chats/archive) |
| Unarchive | [Разархивация чата](/api/chats/unarchive) |
| Request Export | [Экспорт сообщений](/api/chats/request-export) |
| Download Export | [Скачивание экспорта](/api/chats/download-export) |
| Get Many Workspace Chats | [Список чатов пространства](/api/chats/list-company) |

**Сортировка в Get Many:** параметры `sort` (`id` или `last_message_at`) и `order` (`asc` / `desc`). Также доступны фильтры `availability`, `lastMessageAtAfter`, `lastMessageAtBefore`.

**Get Many Workspace Chats** отдаёт беседы и каналы всего пространства, включая закрытые, где владелец токена не состоит. Фильтр `Activity` оставляет только активные или только архивные. Доступно владельцу пространства на тарифе «Корпорация».

**Экспорт чата** выполняется асинхронно: операция **Request Export** ставит задачу (`webhookUrl` обязателен), Пачка присылает вебхук с `export_id`, затем **Download Export** скачивает архив по `id`. Доступно владельцу на тарифе «Корпорация».

---

## Chat Member

Управление участниками чата: добавление, удаление, изменение ролей, управление тегами.

> В v1 эти операции были частью ресурса Chat. В v2 они выделены в отдельный ресурс Chat Member.


| Операция | API |
|----------|-----|
| Get Many | [Список участников чата](/api/members/list) |
| Create | [Добавление пользователей](/api/members/add) |
| Delete | [Исключение пользователя](/api/members/remove) |
| Update | [Редактирование роли](/api/members/update) |
| Leave | [Выход из беседы или канала](/api/members/leave) |
| Add Group Tags | [Добавление тегов](/api/members/add-group-tags) |
| Remove Group Tags | [Исключение тега](/api/members/remove-group-tag) |

---

## User

Сотрудники: полный CRUD, получение и управление статусом.

| Операция | API |
|----------|-----|
| Create | [Новый сотрудник](/api/users/create) |
| Get Many | [Список сотрудников](/api/users/list) |
| Get | [Информация о сотруднике](/api/users/get) |
| Update | [Редактирование сотрудника](/api/users/update) |
| Delete | [Удаление сотрудника](/api/users/delete) |
| Update Avatar | [Загрузка аватара сотрудника](/api/users/update-avatar) |
| Delete Avatar | [Удаление аватара сотрудника](/api/users/remove-avatar) |
| Get Status | [Статус сотрудника](/api/users/get-status) |
| Update Status | [Новый статус сотрудника](/api/users/update-status) |
| Delete Status | [Удаление статуса сотрудника](/api/users/remove-status) |

---

## Group Tag

Теги (группы) сотрудников: создание, обновление, удаление, список пользователей.

| Операция | API |
|----------|-----|
| Create | [Новый тег](/api/group-tags/create) |
| Get Many | [Список тегов сотрудников](/api/group-tags/list) |
| Get | [Информация о теге](/api/group-tags/get) |
| Update | [Редактирование тега](/api/group-tags/update) |
| Delete | [Удаление тега](/api/group-tags/delete) |
| Get Many Users | [Список сотрудников тега](/api/group-tags/list-users) |

---

## Thread

Треды (комментарии к сообщениям): создание, получение, список.

| Операция | API |
|----------|-----|
| Create | [Новый тред](/api/threads/add) |
| Create Standalone | [Новый самостоятельный тред](/api/threads/create) |
| Get | [Информация о треде](/api/threads/get) |
| Get Many | [Список тредов](/api/threads/list) |

---

## Reaction

Реакции на сообщения: создание, удаление, список.

| Операция | API |
|----------|-----|
| Create | [Добавление реакции](/api/reactions/add) |
| Delete | [Удаление реакции](/api/reactions/remove) |
| Get Many | [Список реакций](/api/reactions/list) |

---

## Profile

Профиль текущего пользователя: информация, статус, аватар.

| Операция | API |
|----------|-----|
| Get | [Свой профиль](/api/profile/get) |
| Update Avatar | [Загрузка своего аватара](/api/profile/update-avatar) |
| Delete Avatar | [Удаление своего аватара](/api/profile/delete-avatar) |
| Get Status | [Свой статус](/api/profile/get-status) |
| Update Status | [Новый свой статус](/api/profile/update-status) |
| Delete Status | [Удаление своего статуса](/api/profile/delete-status) |

**Загрузка аватара:** операция Update Avatar принимает бинарные данные из предыдущего узла (например, HTTP Request или Read Binary File). В поле **Input Binary Field** укажите имя бинарного свойства (по умолчанию `data`).

---

## OAuth

Информация о текущем токене: скоупы, даты создания и последнего использования.

| Операция | API |
|----------|-----|
| Get Info | [Информация о токене](/api/oauth/token-info) |

---

## Task

Задачи (напоминания): полный CRUD.

| Операция | API |
|----------|-----|
| Create | [Новое напоминание](/api/tasks/create) |
| Get Many | [Список напоминаний](/api/tasks/list) |
| Get | [Информация о напоминании](/api/tasks/get) |
| Update | [Редактирование напоминания](/api/tasks/update) |
| Delete | [Удаление напоминания](/api/tasks/delete) |

**Типы задач:** `call`, `email`, `event`, `meeting`, `reminder`.

---

## Bot

Боты: создание, получение, список, редактирование, удаление, саморегистрация вебхука, ротация токена, история и удаление событий.

| Операция | API |
|----------|-----|
| Create | [Новый бот](/api/bots/create) |
| Get | [Информация о боте](/api/bots/get) |
| Get Many | [Список ботов](/api/bots/list) |
| Update | [Редактирование бота](/api/bots/update) |
| Delete | [Удаление бота](/api/bots/delete) |
| Update Webhook | [Саморегистрация вебхука бота](/api/bots/update-webhook) |
| Recreate Token | [Ротация токена бота](/api/bots/recreate-token) |
| Recreate Token Self | [Ротация собственного токена бота](/api/bots/recreate-token-self) |
| Get Many Events | [История событий](/api/bots/list-events) |
| Remove Events | [Удаление события](/api/bots/remove-event) |
| Get Many Workspace Bots | [Список ботов пространства](/api/bots/list-company) |

**Get Many Workspace Bots** отдаёт всех ботов пространства, включая недоступных владельцу токена для редактирования. У таких ботов заполнены только `Name` и `Nickname`, остальные настройки приходят пустыми. Доступно владельцу пространства на тарифе «Корпорация».

---

## File

Загрузка файлов через двухшаговый S3 upload.

| Операция | API |
|----------|-----|
| Create | [Загрузка файла](/api/files/uploads) |

Подробнее — в разделе [Продвинутые функции](/guides/n8n/advanced#zagruzka-faylov).

---

## Form

Модальные формы (представления).

| Операция | API |
|----------|-----|
| Create | [Открытие представления](/api/views/open) |

Подробнее — в разделе [Продвинутые функции](/guides/n8n/advanced#formy) и в [документации форм](/guides/forms/overview).

---

## Custom Property

Дополнительные поля пространства.

| Операция | API |
|----------|-----|
| Get | [Список дополнительных полей](/api/custom-properties/list) |

---

## Read Member

Список пользователей, прочитавших сообщение.

| Операция | API |
|----------|-----|
| Get Many Read Member IDs | [Список прочитавших сообщение](/api/read-member/list-readers) |

---

## Search

Полнотекстовый поиск по сообщениям, чатам и пользователям.

| Операция | API |
|----------|-----|
| Get Many Chats | [Поиск чатов](/api/search/list-chats) |
| Get Many Messages | [Поиск сообщений](/api/search/list-messages) |
| Get Many Users | [Поиск сотрудников](/api/search/list-users) |

**Обязательный параметр:** `query` — строка поиска.

---

## Security

Журнал безопасности: отслеживание действий пользователей.

| Операция | API |
|----------|-----|
| Get Many | [Журнал аудита событий](/api/security/list) |

**Фильтры:** `eventKey`, `actorId`, `actorType`, `entityId`, `entityType`, `startTime`, `endTime`.

Подробнее — в [документации журнала аудита](/guides/audit-events).

---

## Пагинация

Все операции Get Many поддерживают автоматическую курсорную пагинацию:

- **Return All** = `true` — получить все результаты автоматически, переключаясь между страницами
- **Return All** = `false` — получить не более **Limit** результатов (по умолчанию 50)

![Переключатель Return All и поле Limit в узле Pachca](/images/n8n/return-all.avif)

*Return All и Limit для операции Get Many*


n8n автоматически отправляет повторные запросы с курсором до получения всех данных.

> Для операций со списками (Get Many) рекомендуется использовать **Return All = false** с разумным **Limit**, чтобы избежать долгих запросов при большом объёме данных.


---

## Simplify

Операции получения данных (Get, Get Many) поддерживают переключатель **Simplify** (включён по умолчанию). Когда Simplify включён, из ответа API возвращаются только ключевые поля — остальные отбрасываются.

| Ресурс | Ключевые поля |
|--------|---------------|
| Message | `id`, `entity_id`, `chat_id`, `content`, `user_id`, `created_at` |
| Chat | `id`, `name`, `channel`, `public`, `members_count`, `created_at` |
| User | `id`, `first_name`, `last_name`, `nickname`, `email`, `role`, `suspended` |
| Task | `id`, `content`, `kind`, `status`, `priority`, `due_at`, `created_at` |
| Bot | `id`, `name`, `created_at` |
| Group Tag | `id`, `name`, `users_count` |
| Reaction | `id`, `code`, `user_id`, `created_at` |

Чтобы получить все поля ответа — выключите **Simplify**.

> Simplify доступен только в v2. В v1 workflow всегда возвращают полный ответ API.


---

## Поисковые выпадающие списки

![Поисковый выпадающий список Chat ID в узле Pachca](/images/n8n/searchable-dropdown.avif)

*Поиск чата по имени в поле Chat ID*


Для поля **Chat ID** доступен поиск по имени: начните вводить текст, и n8n покажет подходящие результаты из вашего пространства Пачки.

Поиск вызывает API-эндпоинт [Поиск чатов](/api/search/list-chats) и работает только с валидным `Access Token` в Credentials.


## Связанные разделы

- [Триггер](/guides/n8n/trigger)
- [Примеры workflow](/guides/n8n/workflows)
- [Продвинутые функции](/guides/n8n/advanced)
