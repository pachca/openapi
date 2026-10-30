> Расположение: MCP
> Краткое содержание: Все инструменты MCP-сервера Пачки: инструмент на каждый метод публичного API, кроме служебных, какой метод вызывает каждый, кому он доступен, пометки чтения и изменения, как агент отправляет файл, набор по роли, тарифу и типу токена, манифест @pachca/mcp-manifest
> Это Markdown-версия конкретной страницы. Для контекста за её пределами (правила API, полный перечень методов, авторизация) ОБЯЗАТЕЛЬНО открой [llms.txt](https://dev.pachca.com/llms.txt) перед ответом — это сэкономит токены и предотвратит неполный ответ.


# Инструменты MCP

У MCP-сервера Пачки инструмент на каждый метод публичного API, кроме нескольких служебных. Инструмент вызывает свой метод с токеном подключения, поэтому права и ограничения у него те же, что у метода. Ответ собран из ответа метода: в списках каждая запись сокращена до основных полей, полную запись агент получает по запросу. Подробности — на странице метода, ссылка на неё в таблице ниже.

Инструментами не стали:

- **Шаги авторизации OAuth.** Методами [Обмен кода на токен](/api/oauth/exchange-token) и [Отзыв токена](/api/oauth/revoke-token) пользуется сама программа, которую сотрудник подключил через браузер.
- **Загрузка файла в хранилище.** Когда файл передан содержимым, метод [Загрузка файла](/api/files/direct-url) вызывает сервер, а файл с диска загружает в хранилище агент. Подробнее — в разделе [Как агент отправляет файл](#kak-agent-otpravlyaet-fayl).
- **Поток событий.** Держать соединение метода [Поток событий](/api/bots/get-stream) модель не может, а ссылка из его ответа открывает события бота без токена.

## Как агент отправляет файл

Файл к сообщению или черновику агент передаёт одним из двух способов:

- **Содержимым в вызове.** Подходит для небольшого текста, который агент написал сам, например таблицы или отчёта в `.md`. Сервер сам загружает файл и прикладывает его к сообщению, черновику или промо-картинкам бота.
- **Ключом своей загрузки.** Так отправляют документ или картинку с диска: настоящий файл модель содержимым не передаст. Агент получает форму загрузки инструментом `pachca_get_upload_params`, сам отправляет файл в хранилище, например через `curl`, и передаёт ключ и размер файла в сообщение или черновик. Для этого агенту нужен доступ к файлу на вашем компьютере и к хранилищу Пачки, как у Claude Code, Codex или Cursor.

В чате Claude у агента нет доступа к файлам на вашем компьютере, а его среда выполнения кода не может обратиться к хранилищу файлов Пачки. Поэтому там он отправит файл только содержимым, то есть небольшой текст. Аватар принимает только содержимое. Как устроена загрузка в API — в разделе [Файлы](/api/file-uploads).

## Какие инструменты получает программа

Список зависит от токена подключения:

- **Роль.** Управление сотрудниками и тегами есть только у владельца и администратора. Мульти-гость, кроме того, не получает инструменты ботов, создание чатов и выход из них, добавление участников и тегов в чат и список сотрудников тега. Какие права у каждой роли — в разделе [Права и роли](/guides/permissions).
- **Тариф.** Выгрузка сообщений, журнал аудита и списки всех чатов и ботов пространства есть только у владельца на тарифе «Корпорация».
- **Тип токена.** Формы, разворачивание ссылок, история событий, смена адреса своего вебхука и перевыпуск своего токена есть только у токена бота. Черновиков, раздела «Важное» и управления ботами у токена бота нет, подробнее — в разделе [Скоупы](/api/authorization#skoupy).

Роль проверяется на каждом вызове: если программа всё же вызовет инструмент не из списка, метод API ответит отказом и назовёт причину.

Кому доступен каждый инструмент — в колонке **Кому доступен** таблицы ниже: «Все» значит владелец, администратор, сотрудник, мульти-гость и токен бота. Право метода указано на странице метода, а на сайте — и в подсказке у ссылки.

## Все инструменты

Пометка в колонке **Действие** — та же, что получает программа: по ней программа решает, когда спросить подтверждение. Что значит каждая пометка — в разделе [Подтверждение действий](/guides/mcp/overview#podtverzhdenie-deystviy).

| Инструмент | Метод API | Кому доступен | Действие |
|------------|-----------|---------------|----------|
| `pachca_get_token_info` | [Информация о токене](/api/oauth/token-info) | Все | Чтение |
| `pachca_get_my_card` | [Свой профиль](/api/profile/get) | Все | Чтение |
| `pachca_update_my_avatar` | [Загрузка своего аватара](/api/profile/update-avatar) | Все | Опасное изменение |
| `pachca_delete_my_avatar` | [Удаление своего аватара](/api/profile/delete-avatar) | Все | Опасное изменение |
| `pachca_get_my_status` | [Свой статус](/api/profile/get-status) | Все | Чтение |
| `pachca_update_my_status` | [Новый свой статус](/api/profile/update-status) | Все | Опасное изменение |
| `pachca_delete_my_status` | [Удаление своего статуса](/api/profile/delete-status) | Все | Опасное изменение |
| `pachca_list_users` | [Список сотрудников](/api/users/list) | Все | Чтение |
| `pachca_create_user` | [Новый сотрудник](/api/users/create) | Владелец, администратор | Опасное изменение |
| `pachca_get_user` | [Информация о сотруднике](/api/users/get) | Все | Чтение |
| `pachca_update_user` | [Редактирование сотрудника](/api/users/update) | Владелец, администратор | Опасное изменение |
| `pachca_delete_user` | [Удаление сотрудника](/api/users/delete) | Владелец, администратор | Опасное изменение |
| `pachca_update_user_avatar` | [Загрузка аватара сотрудника](/api/users/update-avatar) | Владелец, администратор | Опасное изменение |
| `pachca_delete_user_avatar` | [Удаление аватара сотрудника](/api/users/remove-avatar) | Владелец, администратор | Опасное изменение |
| `pachca_get_user_status` | [Статус сотрудника](/api/users/get-status) | Все | Чтение |
| `pachca_update_user_status` | [Новый статус сотрудника](/api/users/update-status) | Владелец, администратор | Опасное изменение |
| `pachca_delete_user_status` | [Удаление статуса сотрудника](/api/users/remove-status) | Владелец, администратор | Опасное изменение |
| `pachca_list_tags` | [Список тегов](/api/group-tags/list) | Все | Чтение |
| `pachca_create_tag` | [Новый тег](/api/group-tags/create) | Владелец, администратор | Изменение |
| `pachca_get_tag` | [Информация о теге](/api/group-tags/get) | Все | Чтение |
| `pachca_update_tag` | [Редактирование тега](/api/group-tags/update) | Владелец, администратор | Опасное изменение |
| `pachca_delete_tag` | [Удаление тега](/api/group-tags/delete) | Владелец, администратор | Опасное изменение |
| `pachca_get_tag_users` | [Список сотрудников тега](/api/group-tags/list-users) | Все, кроме мульти-гостя | Чтение |
| `pachca_list_chats` | [Список чатов](/api/chats/list) | Все | Чтение |
| `pachca_create_chat` | [Новый чат](/api/chats/create) | Все, кроме мульти-гостя | Изменение |
| `pachca_request_export` | [Экспорт сообщений](/api/chats/request-export) | Владелец на «Корпорации» | Изменение |
| `pachca_download_export` | [Скачать архив экспорта](/api/chats/download-export) | Владелец на «Корпорации» | Чтение |
| `pachca_get_chat` | [Информация о чате](/api/chats/get) | Все | Чтение |
| `pachca_update_chat` | [Редактирование чата](/api/chats/update) | Все | Опасное изменение |
| `pachca_archive_chat` | [Архивация чата](/api/chats/archive) | Все | Опасное изменение |
| `pachca_update_chat_avatar` | [Загрузка аватара чата](/api/chats/update-avatar) | Все | Опасное изменение |
| `pachca_delete_chat_avatar` | [Удаление аватара чата](/api/chats/remove-avatar) | Все | Опасное изменение |
| `pachca_unarchive_chat` | [Разархивация чата](/api/chats/unarchive) | Все | Изменение |
| `pachca_mark_chat_unread` | [Отметка чата непрочитанным](/api/chats/mark-unread) | Все | Изменение |
| `pachca_list_company_chats` | [Список чатов пространства](/api/chats/list-company) | Владелец на «Корпорации» | Чтение |
| `pachca_add_tags_to_chat` | [Добавление тегов](/api/members/add-group-tags) | Все, кроме мульти-гостя | Изменение |
| `pachca_remove_tag_from_chat` | [Исключение тега из чата](/api/members/remove-group-tag) | Все | Опасное изменение |
| `pachca_leave_chat` | [Выход из чата](/api/members/leave) | Все, кроме мульти-гостя | Опасное изменение |
| `pachca_list_members` | [Список участников чата](/api/members/list) | Все | Чтение |
| `pachca_add_members` | [Добавление участников](/api/members/add) | Все, кроме мульти-гостя | Изменение |
| `pachca_update_member_role` | [Редактирование роли участника](/api/members/update) | Все | Опасное изменение |
| `pachca_remove_member` | [Исключение участника](/api/members/remove) | Все | Опасное изменение |
| `pachca_create_thread` | [Новый тред](/api/threads/add) | Все | Изменение |
| `pachca_list_threads` | [Список тредов](/api/threads/list) | Все | Чтение |
| `pachca_create_unattached_thread` | [Новый самостоятельный тред](/api/threads/create) | Все | Изменение |
| `pachca_get_thread` | [Информация о треде](/api/threads/get) | Все | Чтение |
| `pachca_list_chat_messages` | [Список сообщений чата](/api/messages/list) | Все | Чтение |
| `pachca_send_message` | [Новое сообщение](/api/messages/create) | Все | Изменение |
| `pachca_get_message` | [Информация о сообщении](/api/messages/get) | Все | Чтение |
| `pachca_update_message` | [Редактирование сообщения](/api/messages/update) | Все | Опасное изменение |
| `pachca_delete_message` | [Удаление сообщения](/api/messages/delete) | Все | Опасное изменение |
| `pachca_add_link_preview` | [Unfurl (разворачивание ссылок)](/api/messages/unfurl) | Только бот | Опасное изменение |
| `pachca_pin_message` | [Закрепление сообщения](/api/messages/pin) | Все | Изменение |
| `pachca_unpin_message` | [Открепление сообщения](/api/messages/unpin) | Все | Опасное изменение |
| `pachca_list_message_readers` | [Список прочитавших сообщение](/api/read-member/list-readers) | Все | Чтение |
| `pachca_list_reactions` | [Список реакций](/api/reactions/list) | Все | Чтение |
| `pachca_add_reaction` | [Добавление реакции](/api/reactions/add) | Все | Изменение |
| `pachca_remove_reaction` | [Удаление реакции](/api/reactions/remove) | Все | Опасное изменение |
| `pachca_list_important_messages` | [Список важных сообщений](/api/important-messages/list) | Все, кроме бота | Чтение |
| `pachca_add_message_to_important` | [Добавление сообщения в важные](/api/important-messages/create) | Все, кроме бота | Изменение |
| `pachca_remove_message_from_important` | [Удаление сообщения из важных](/api/important-messages/delete) | Все, кроме бота | Опасное изменение |
| `pachca_list_drafts` | [Список черновиков](/api/drafts/list) | Все, кроме бота | Чтение |
| `pachca_create_draft` | [Новый черновик](/api/drafts/create) | Все, кроме бота | Изменение |
| `pachca_get_draft` | [Информация о черновике](/api/drafts/get) | Все, кроме бота | Чтение |
| `pachca_update_draft` | [Редактирование черновика](/api/drafts/update) | Все, кроме бота | Опасное изменение |
| `pachca_delete_draft` | [Удаление черновика](/api/drafts/delete) | Все, кроме бота | Опасное изменение |
| `pachca_list_tasks` | [Список напоминаний](/api/tasks/list) | Все | Чтение |
| `pachca_create_task` | [Новое напоминание](/api/tasks/create) | Все | Изменение |
| `pachca_get_task` | [Информация о напоминании](/api/tasks/get) | Все | Чтение |
| `pachca_update_task` | [Редактирование напоминания](/api/tasks/update) | Все | Опасное изменение |
| `pachca_delete_task` | [Удаление напоминания](/api/tasks/delete) | Все | Опасное изменение |
| `pachca_open_form` | [Открытие представления](/api/views/open) | Только бот | Изменение |
| `pachca_answer_form` | [Ответ на отправку формы](/api/views/submit-response) | Только бот | Изменение |
| `pachca_self_recreate_bot_token` | [Ротация собственного токена бота](/api/bots/recreate-token-self) | Только бот | Опасное изменение |
| `pachca_self_update_bot_webhook` | [Саморегистрация вебхука бота](/api/bots/update-webhook) | Только бот | Опасное изменение |
| `pachca_list_bots` | [Список ботов](/api/bots/list) | Все, кроме мульти-гостя и бота | Чтение |
| `pachca_create_bot` | [Новый бот](/api/bots/create) | Все, кроме мульти-гостя и бота | Опасное изменение |
| `pachca_get_bot` | [Информация о боте](/api/bots/get) | Все, кроме мульти-гостя и бота | Чтение |
| `pachca_update_bot` | [Редактирование бота](/api/bots/update) | Все, кроме мульти-гостя и бота | Опасное изменение |
| `pachca_delete_bot` | [Удаление бота](/api/bots/delete) | Все, кроме мульти-гостя и бота | Опасное изменение |
| `pachca_update_bot_avatar` | [Загрузка аватара бота](/api/bots/update-avatar) | Все, кроме мульти-гостя и бота | Опасное изменение |
| `pachca_delete_bot_avatar` | [Удаление аватара бота](/api/bots/remove-avatar) | Все, кроме мульти-гостя и бота | Опасное изменение |
| `pachca_recreate_bot_token` | [Ротация токена бота](/api/bots/recreate-token) | Все, кроме мульти-гостя и бота | Опасное изменение |
| `pachca_rotate_bot_client_secret` | [Ротация секрета клиента](/api/bots/rotate-client-secret) | Все, кроме мульти-гостя и бота | Опасное изменение |
| `pachca_get_bot_scopes` | [Каталог прав бота](/api/bots/list-scopes) | Все, кроме мульти-гостя и бота | Чтение |
| `pachca_list_bot_tokens` | [Список токенов бота](/api/bots/list-tokens) | Все, кроме мульти-гостя и бота | Чтение |
| `pachca_create_bot_token` | [Новый токен бота](/api/bots/create-token) | Все, кроме мульти-гостя и бота | Изменение |
| `pachca_update_bot_token` | [Изменение токена бота](/api/bots/update-token) | Все, кроме мульти-гостя и бота | Опасное изменение |
| `pachca_delete_bot_token` | [Удаление токена бота](/api/bots/delete-token) | Все, кроме мульти-гостя и бота | Опасное изменение |
| `pachca_reissue_bot_token` | [Перевыпуск токена бота](/api/bots/reissue-token) | Все, кроме мульти-гостя и бота | Опасное изменение |
| `pachca_list_company_bots` | [Список ботов пространства](/api/bots/list-company) | Владелец на «Корпорации» | Чтение |
| `pachca_get_webhook_events` | [История событий](/api/bots/list-events) | Только бот | Чтение |
| `pachca_delete_webhook_event` | [Удаление события истории](/api/bots/remove-event) | Только бот | Опасное изменение |
| `pachca_get_audit_events` | [Журнал аудита событий](/api/security/list) | Владелец на «Корпорации» | Чтение |
| `pachca_search_chats` | [Поиск чатов](/api/search/list-chats) | Все | Чтение |
| `pachca_search_messages` | [Поиск сообщений](/api/search/list-messages) | Все | Чтение |
| `pachca_search_users` | [Поиск сотрудников](/api/search/list-users) | Все | Чтение |
| `pachca_download_file` | [Скачивание файла](/api/files/get) | Все | Чтение |
| `pachca_get_upload_params` | [Получение подписи, ключа и других параметров](/api/files/uploads) | Все | Изменение |
| `pachca_list_custom_fields` | [Список дополнительных полей](/api/custom-properties/list) | Все | Чтение |


## Манифест инструментов

Набор инструментов собирается из спецификации API и публикуется пакетом [@pachca/mcp-manifest](https://www.npmjs.com/package/@pachca/mcp-manifest): имена, описания, схемы аргументов и ответов, права, роли и правила ответа сервера. Описания в нём на английском: их читает модель. Изменения набора — в [журнале изменений пакета](https://github.com/pachca/openapi/blob/main/packages/mcp-manifest/CHANGELOG.md).


## Связанные разделы

- [MCP-сервер](/guides/mcp/overview)
- [Подключение к MCP](/guides/mcp/connect)
- [Права и роли](/guides/permissions)
