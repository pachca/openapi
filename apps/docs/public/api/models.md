> Расположение: Основы API
> Краткое содержание: Справочник моделей данных Pachca API: свойства и методы, возвращающие каждый объект — сотрудники, чаты, сообщения, задачи, теги, вебхуки и другие сущности
> Это Markdown-версия конкретной страницы. Для контекста за её пределами (правила API, полный перечень методов, авторизация) ОБЯЗАТЕЛЬНО открой [llms.txt](https://dev.pachca.com/llms.txt) перед ответом — это сэкономит токены и предотвратит неполный ответ.


# Модели

Все модели данных, возвращаемые в ответах API. Каждая модель содержит связанные методы и таблицу свойств.

> Методы [Получение подписи](/api/files/uploads) и [Загрузка файла](/api/files/direct-url) не возвращают модели данных.


## Дополнительное поле

- [Список дополнительных полей](/api/custom-properties/list)

Дополнительное поле

- `id: integer, int32` (required) — Идентификатор поля. Пример: `1678`
- `name: string` (required, max length: 32) — Название поля. Пример: `"Город"`
- `data_type: string` (required) — Тип поля
  Значения: `string` — Строковое значение, `number` — Числовое значение, `date` — Дата, `link` — Ссылка


## Токен доступа

- [Информация о токене](/api/oauth/token-info)

Токен доступа

- `id: integer, int64` (required) — Идентификатор токена. Пример: `4827`
- `token: string` (required) — Маскированный токен (видны первые 8 и последние 4 символа). Пример: `"cH5kR9mN...x7Qp"`
- `name: string` (required, nullable) — Пользовательское имя токена. `null` у токена бота — имя задаётся только при создании токена вручную. Пример: `"Мой API токен"`
- `user_id: integer, int64` (required) — Идентификатор владельца токена. Пример: `12`
- `scopes: array of string` (required) — Список скоупов токена. Пример: `["messages:read","chats:read"]`
- `created_at: date-time` (required) — Дата создания токена. Пример: `"2025-01-15T10:30:00.000Z"`
- `revoked_at: date-time` (required, nullable) — Дата отзыва токена. Всегда `null`: по отозванному токену метод возвращает 401. Пример: `null`
- `expires_in: integer, int32` (required, nullable) — Время жизни токена в секундах. Всегда `null` — токены выдаются бессрочно. Пример: `null`
- `last_used_at: date-time` (required, nullable) — Дата последнего использования токена. `null`, пока по токену не было ни одного запроса. Обновляется не чаще раза в час, поэтому может отставать. Пример: `"2025-02-24T14:20:00.000Z"`


## Статус пользователя

- [Статус сотрудника](/api/users/get-status)
- [Свой статус](/api/profile/get-status)
- [Новый свой статус](/api/profile/update-status)
- [Новый статус сотрудника](/api/users/update-status)
- [Удаление своего статуса](/api/profile/delete-status)
- [Удаление статуса сотрудника](/api/users/remove-status)

Статус пользователя

- `emoji: string` (required) — Emoji символ статуса. Пример: `"🎮"`
- `title: string` (required, max length: 50) — Текст статуса. Пример: `"Очень занят"`
- `expires_at: date-time` (required, nullable) — Срок жизни статуса (ISO-8601, UTC+0) в формате YYYY-MM-DDThh:mm:ss.sssZ. `null`, если срок не задан — такой статус не сбрасывается автоматически. Пример: `"2024-04-08T10:00:00.000Z"`
- `is_away: boolean` (required) — Режим «Нет на месте». Пример: `false`
- `away_message: object` (required, nullable) — Сообщение при режиме «Нет на месте». Отображается в профиле пользователя, а также при отправке ему личного сообщения или упоминании в чате. `null`, если текст автоответа не задан.
  - `text: string` (required, max length: 1024) — Текст сообщения. Пример: `"Я в отпуске до 15 апреля. По срочным вопросам обращайтесь к @ivanov."`


## Аватар

- [Загрузка своего аватара](/api/profile/update-avatar)
- [Удаление своего аватара](/api/profile/delete-avatar)
- [Загрузка аватара сотрудника](/api/users/update-avatar)
- [Удаление аватара сотрудника](/api/users/remove-avatar)

Данные аватара

- `image_url: string` (required) — URL аватара. Пример: `"https://pachca-prod.s3.amazonaws.com/uploads/0001/0001/image.jpg"`


## Сотрудник

- [Новый сотрудник](/api/users/create)
- [Свой профиль](/api/profile/get)
- [Информация о сотруднике](/api/users/get)
- [Список сотрудников](/api/users/list)
- [Список сотрудников тега](/api/group-tags/list-users)
- [Список участников чата](/api/members/list)
- [Поиск сотрудников](/api/search/list-users)
- [Редактирование сотрудника](/api/users/update)
- [Удаление сотрудника](/api/users/delete)

Сотрудник

- `id: integer, int32` (required) — Идентификатор пользователя. Пример: `12`
- `first_name: string` (required, nullable, max length: 255) — Имя. Возвращается `null`, пока приглашённый сотрудник не завершил регистрацию (`invite_status` со значением `sent`). Пример: `"Олег"`
- `last_name: string` (required, nullable, max length: 255) — Фамилия. Если не заполнена, возвращается `null` или пустая строка. Пример: `"Петров"`
- `nickname: string` (required, max length: 255) — Имя пользователя. Пример: `"olegpetrov"`
- `email: string` (required, nullable, max length: 255) — Электронная почта. Возвращает `null` для ботов без права просмотра персональных данных, а также при запросе данных другого пользователя ботом, для которого скрыты персональные данные сотрудников. Пример: `"olegp@example.com"`
- `phone_number: string` (required, nullable, max length: 255) — Телефон. Возвращает `null` для ботов без права просмотра персональных данных, а также при запросе данных другого пользователя ботом, для которого скрыты персональные данные сотрудников. Пример: `"+79001234567"`
- `department: string` (required, nullable, max length: 255) — Департамент. Если не указан, возвращается `null` или пустая строка. Пример: `"Продукт"`
- `title: string` (required, nullable) — Должность. Если не указана, возвращается `null` или пустая строка. Пример: `"CIO"`
- `role: string` (required) — Уровень доступа
  Значения: `admin` — Администратор, `user` — Сотрудник, `multi_guest` — Мульти-гость, `guest` — Гость
- `suspended: boolean` (required) — Деактивация пользователя. Пример: `false`
- `invite_status: string` (required) — Статус приглашения
  Значения: `confirmed` — Принято, `sent` — Отправлено
- `inviter_id: integer, int32` (required, nullable) — Идентификатор сотрудника, который пригласил данного сотрудника. Возвращает `null`, если сотрудник зарегистрировался самостоятельно или если пригласивший сотрудник был удалён. Пример: `185`
- `list_tags: array of string` (required) — Массив тегов, привязанных к сотруднику. Пример: `["Product","Design"]`
- `custom_properties: array of object` (required) — Дополнительные поля сотрудника
  - `id: integer, int32` (required) — Идентификатор поля. Пример: `1678`
  - `name: string` (required, max length: 32) — Название поля. Пример: `"Город"`
  - `data_type: string` (required) — Тип поля
    Значения: `string` — Строковое значение, `number` — Числовое значение, `date` — Дата, `link` — Ссылка
  - `value: string` (required, nullable, max length: 768) — Значение. Возвращается `null`, если поле не заполнено. Число передаётся строкой, дата — в формате ISO 8601. Пример: `"Санкт-Петербург"`
- `user_status: object` (required) — Статус. `null`, если у сотрудника не установлен статус.
  - `emoji: string` (required) — Emoji символ статуса. Пример: `"🎮"`
  - `title: string` (required, max length: 50) — Текст статуса. Пример: `"Очень занят"`
  - `expires_at: date-time` (required, nullable) — Срок жизни статуса (ISO-8601, UTC+0) в формате YYYY-MM-DDThh:mm:ss.sssZ. `null`, если срок не задан — такой статус не сбрасывается автоматически. Пример: `"2024-04-08T10:00:00.000Z"`
  - `is_away: boolean` (required) — Режим «Нет на месте». Пример: `false`
  - `away_message: object` (required, nullable) — Сообщение при режиме «Нет на месте». Отображается в профиле пользователя, а также при отправке ему личного сообщения или упоминании в чате. `null`, если текст автоответа не задан.
    - `text: string` (required, max length: 1024) — Текст сообщения. Пример: `"Я в отпуске до 15 апреля. По срочным вопросам обращайтесь к @ivanov."`
- `bot: boolean` (required) — Является ботом. Пример: `false`
- `sso: boolean` (required) — Использует ли пользователь SSO. Пример: `false`
- `created_at: date-time` (required) — Дата создания (ISO-8601, UTC+0) в формате YYYY-MM-DDThh:mm:ss.sssZ. Пример: `"2020-06-08T09:32:57.000Z"`
- `last_activity_at: date-time` (required, nullable) — Дата последней активности пользователя (ISO-8601, UTC+0) в формате YYYY-MM-DDThh:mm:ss.sssZ. `null`, если сотрудник ещё ни разу не заходил в Пачку — в этом случае `invite_status` возвращает `sent`. Пример: `"2025-01-20T13:40:07.000Z"`
- `time_zone: string` (required, nullable, max length: 32) — Часовой пояс пользователя. `null`, если сотрудник не задал личный часовой пояс — тогда применяется часовой пояс компании. Пример: `"Europe/Moscow"`
- `image_url: string` (required, nullable) — Ссылка на скачивание аватарки пользователя. `null`, если аватарка не загружена. Пример: `"https://app.pachca.com/users/12/photo.jpg"`


## Тег

- [Новый тег](/api/group-tags/create)
- [Добавление тегов](/api/members/add-group-tags)
- [Информация о теге](/api/group-tags/get)
- [Список тегов сотрудников](/api/group-tags/list)
- [Редактирование тега](/api/group-tags/update)
- [Исключение тега](/api/members/remove-group-tag)
- [Удаление тега](/api/group-tags/delete)

Тег

- `id: integer, int32` (required) — Идентификатор тега. Пример: `9111`
- `name: string` (required, max length: 255) — Название тега. Пример: `"Design"`
- `users_count: integer, int32` (required) — Количество сотрудников, которые имеют этот тег. Пример: `6`


## Чат

- [Новый чат](/api/chats/create)
- [Добавление пользователей](/api/members/add)
- [Экспорт сообщений](/api/chats/request-export)
- [Информация о чате](/api/chats/get)
- [Список чатов](/api/chats/list)
- [Поиск чатов](/api/search/list-chats)
- [Скачать архив экспорта](/api/chats/download-export)
- [Редактирование чата](/api/chats/update)
- [Архивация чата](/api/chats/archive)
- [Разархивация чата](/api/chats/unarchive)
- [Редактирование роли](/api/members/update)
- [Выход из беседы или канала](/api/members/leave)
- [Исключение пользователя](/api/members/remove)

Чат

- `id: integer, int32` (required) — Идентификатор созданного чата. Пример: `334`
- `name: string` (required, max length: 255) — Название. Пример: `"🤿 aqua"`
- `created_at: date-time` (required) — Дата и время создания чата (ISO-8601, UTC+0) в формате YYYY-MM-DDThh:mm:ss.sssZ. Пример: `"2021-08-28T15:56:53.000Z"`
- `owner_id: integer, int32` (required) — Идентификатор пользователя, создавшего чат. Пример: `185`
- `member_ids: array of integer` (required) — Массив идентификаторов пользователей, участников. Пример: `[185,186,187]`
- `group_tag_ids: array of integer` (required) — Массив идентификаторов тегов, участников. Пример: `[9111]`
- `channel: boolean` (required) — Является каналом. Пример: `true`
- `archived: boolean` (required) — Находится в архиве. Пример: `false`
- `personal: boolean` (required) — Является личным чатом. Пример: `false`
- `public: boolean` (required) — Открытый доступ. Пример: `false`
- `last_message_at: date-time` (required) — Дата и время создания последнего сообщения в чате (ISO-8601, UTC+0) в формате YYYY-MM-DDThh:mm:ss.sssZ. Пример: `"2021-08-28T15:56:53.000Z"`
- `meet_room_url: string` (required) — Ссылка на Видеочат. Пример: `"https://meet.pachca.com/aqua-94bb21b5"`


## Тред

- [Новый тред](/api/threads/add)
- [Новый самостоятельный тред](/api/threads/create)
- [Информация о треде](/api/threads/get)
- [Список тредов](/api/threads/list)

Тред

- `id: integer, int64` (required) — Идентификатор созданного треда (используется для отправки [новых комментариев](/api/messages/create) в тред). Пример: `265142`
- `chat_id: integer, int64` (required) — Идентификатор чата треда (используется для отправки [новых комментариев](/api/messages/create) в тред и получения [списка комментариев](/api/messages/list)). Пример: `2637266155`
- `message_id: integer, int64` (required, nullable) — Идентификатор сообщения, к которому был создан тред. `null` для самостоятельного треда, созданного без привязки к сообщению. Пример: `154332686`
- `message_chat_id: integer, int64` (required, nullable) — Идентификатор чата сообщения. `null` для самостоятельного треда, созданного без привязки к сообщению. Пример: `2637266154`
- `updated_at: date-time` (required) — Дата и время обновления треда (ISO-8601, UTC+0) в формате YYYY-MM-DDThh:mm:ss.sssZ. Пример: `"2023-02-01T19:20:47.204Z"`


## Сообщение

- [Новое сообщение](/api/messages/create)
- [Закрепление сообщения](/api/messages/pin)
- [Unfurl (разворачивание ссылок)](/api/messages/unfurl)
- [Информация о сообщении](/api/messages/get)
- [Список сообщений чата](/api/messages/list)
- [Поиск сообщений](/api/search/list-messages)
- [Список прочитавших сообщение](/api/read-member/list-readers)
- [Редактирование сообщения](/api/messages/update)
- [Открепление сообщения](/api/messages/unpin)
- [Удаление сообщения](/api/messages/delete)

Сообщение

- `id: integer, int32` (required) — Идентификатор сообщения. Пример: `194275`
- `entity_type: string` (required) — Тип сущности, к которой относится сообщение
  Значения: `discussion` — Беседа или канал, `thread` — Тред, `user` — Пользователь
- `entity_id: integer, int32` (required) — Идентификатор сущности, к которой относится сообщение (беседы/канала, треда или пользователя). Пример: `334`
- `chat_id: integer, int32` (required) — Идентификатор чата, в котором находится сообщение. Пример: `334`
- `root_chat_id: integer, int32` (required) — Идентификатор корневого чата. Для сообщений в тредах — идентификатор чата, в котором был создан тред. Для обычных сообщений совпадает с `chat_id`. Пример: `334`
- `content: string` (required) — Текст сообщения. Пример: `"Вчера мы продали 756 футболок (что на 10% больше, чем в прошлое воскресенье)"`
- `user_id: integer, int32` (required) — Идентификатор пользователя, создавшего сообщение. Пример: `12`
- `created_at: date-time` (required) — Дата и время создания сообщения (ISO-8601, UTC+0) в формате YYYY-MM-DDThh:mm:ss.sssZ. Пример: `"2021-08-28T15:57:23.000Z"`
- `url: string` (required) — Прямая ссылка на сообщение. Пример: `"https://app.pachca.com/chats/334?message=194275"`
- `files: array of object` (required) — Прикрепленные файлы
  - `id: integer, int32` (required) — Идентификатор файла. Пример: `3560`
  - `key: string` (required) — Путь к файлу. Пример: `"attaches/files/12/21zu7934-02e1-44d9-8df2-0f970c259796/congrat.png"`
  - `name: string` (required) — Название файла с расширением. Пример: `"congrat.png"`
  - `file_type: string` (required) — Тип файла
    Значения: `file` — Обычный файл, `image` — Изображение, `audio` — Аудиофайл, `voice` — Голосовое сообщение
  - `url: string` (required) — Прямая ссылка на скачивание файла. Пример: `"https://pachca-prod-uploads.s3.storage.selcloud.ru/attaches/files/12/21zu7934-02e1-44d9-8df2-0f970c259796/congrat.png?response-cache-control=max-age%3D3600%3B&response-content-disposition=attachment&X-Amz-Algorithm=AWS4-HMAC-SHA256&X-Amz-Credential=142155_staply%2F20231107%2Fru-1a%2Fs3%2Faws4_request&X-Amz-Date=20231107T160412&X-Amz-Expires=604800&X-Amz-SignedHeaders=host&X-Amz-Signature=98765asgfadsfdSaDSd4sdfg35asdf67sadf8"`
  - `width: integer, int32` (nullable) — Ширина изображения в пикселях. `null` для файлов, не являющихся изображением, а также если размер не был передан при загрузке. Пример: `1920`
  - `height: integer, int32` (nullable) — Высота изображения в пикселях. `null` для файлов, не являющихся изображением, а также если размер не был передан при загрузке. Пример: `1080`
- `voice_content: object` (required) — Данные голосового сообщения. Заполняется только для голосовых сообщений (`file_type` файла — `voice`), иначе `null`.
  - `duration_ms: integer, int32` (required) — Длительность голосового сообщения в миллисекундах. Пример: `5400`
  - `waveform: string` (required) — Форма волны (амплитуды) для визуализации голосового сообщения. Пример: `"4,8,12,20,16,10,6,3"`
  - `transcript: string` (required, nullable) — Расшифровка голосового сообщения в текст. `null`, пока расшифровка не готова или недоступна. Пример: `"Привет, посмотри пожалуйста последний отчёт"`
- `buttons: array of array` (required, nullable) — Массив строк, каждая из которых представлена массивом кнопок. `null`, если сообщение отправлено без кнопок.
- `thread: object` (required, nullable) — Тред, созданный к этому сообщению. `null`, если тред не создан, а также у сообщений, которые сами находятся внутри треда.
  - `id: integer, int64` (required) — Идентификатор треда. Пример: `265142`
  - `chat_id: integer, int64` (required) — Идентификатор чата треда. Пример: `2637266155`
- `forwarding: object` (required) — Информация о пересланном сообщении. `null`, если сообщение не является пересланным.
  - `original_message_id: integer, int32` (required) — Идентификатор оригинального сообщения. Пример: `194275`
  - `original_chat_id: integer, int32` (required) — Идентификатор чата, в котором находится оригинальное сообщение. Пример: `334`
  - `author_id: integer, int32` (required) — Идентификатор пользователя, создавшего оригинальное сообщение. Пример: `12`
  - `original_created_at: date-time` (required) — Дата и время создания оригинального сообщения (ISO-8601, UTC+0) в формате YYYY-MM-DDThh:mm:ss.sssZ. Пример: `"2025-01-15T10:30:00.000Z"`
  - `original_thread_id: integer, int32` (required, nullable) — Идентификатор треда, в котором находится оригинальное сообщение. Пример: `null`
  - `original_thread_message_id: integer, int32` (required, nullable) — Идентификатор сообщения, к которому был создан тред, в котором находится оригинальное сообщение. `null`, если оригинальное сообщение было не в треде или тред создан без привязки к сообщению. Пример: `null`
  - `original_thread_parent_chat_id: integer, int32` (required, nullable) — Идентификатор чата сообщения, к которому был создан тред, в котором находится оригинальное сообщение. `null`, если оригинальное сообщение было не в треде или тред создан без привязки к сообщению. Пример: `null`
- `parent_message_id: integer, int32` (required, nullable) — Идентификатор сообщения, к которому написан ответ. `null`, если сообщение не является ответом на другое сообщение. Пример: `null`
- `display_avatar_url: string` (nullable) — Ссылка на аватарку отправителя сообщения. Поле присутствует только у сообщений от ботов; у сообщений от сотрудников его в ответе нет. `null`, если бот не переопределял значение при отправке. Пример: `null`
- `display_name: string` (nullable) — Полное имя отправителя сообщения. Поле присутствует только у сообщений от ботов; у сообщений от сотрудников его в ответе нет. `null`, если бот не переопределял значение при отправке. Пример: `null`
- `changed_at: date-time` (required, nullable) — Дата и время последнего изменения сообщения (ISO-8601, UTC+0) в формате YYYY-MM-DDThh:mm:ss.sssZ. У неотредактированного сообщения совпадает с датой создания. `null` у сообщений, отправленных до появления этого поля. Пример: `"2021-08-28T16:10:00.000Z"`
- `deleted_at: date-time` (required, nullable) — Дата и время удаления сообщения (ISO-8601, UTC+0) в формате YYYY-MM-DDThh:mm:ss.sssZ. `null` у неудалённых сообщений. В списке сообщений удалённые не возвращаются. Пример: `null`


## Реакция на сообщение

- [Добавление реакции](/api/reactions/add)
- [Список реакций](/api/reactions/list)
- [Удаление реакции](/api/reactions/remove)

Реакция на сообщение

- `user_id: integer, int32` (required) — Идентификатор пользователя, который добавил реакцию. Пример: `12`
- `created_at: date-time` (required) — Дата и время добавления реакции (ISO-8601, UTC+0) в формате YYYY-MM-DDThh:mm:ss.sssZ. Пример: `"2024-01-20T10:30:00.000Z"`
- `code: string` (required) — Emoji символ реакции. Пример: `"👍"`
- `name: string` (required) — Название emoji реакции. Пример: `":+1::skin-tone-1:"`


## Напоминание

- [Новое напоминание](/api/tasks/create)
- [Информация о напоминании](/api/tasks/get)
- [Список напоминаний](/api/tasks/list)
- [Редактирование напоминания](/api/tasks/update)
- [Удаление напоминания](/api/tasks/delete)

Напоминание

- `id: integer, int32` (required) — Идентификатор напоминания. Пример: `22283`
- `kind: string` (required) — Тип
  Значения: `call` — Позвонить контакту, `meeting` — Встреча, `reminder` — Простое напоминание, `event` — Событие, `email` — Написать письмо
- `content: string` (required) — Описание. Пример: `"Забрать со склада 21 заказ"`
- `due_at: date-time` (required, nullable) — Срок выполнения напоминания (ISO-8601, UTC+0) в формате YYYY-MM-DDThh:mm:ss.sssZ. `null`, если срок не задан. Пример: `"2020-06-05T09:00:00.000Z"`
- `priority: integer, int32` (required) — Приоритет. Пример: `2`
- `user_id: integer, int32` (required) — Идентификатор пользователя-создателя напоминания. Пример: `12`
- `chat_id: integer, int32` (required, nullable) — Идентификатор чата, к которому привязано напоминание. `null`, если напоминание не привязано к чату. Пример: `334`
- `status: string` (required) — Статус напоминания
  Значения: `done` — Выполнено, `undone` — Активно
- `created_at: date-time` (required) — Дата и время создания напоминания (ISO-8601, UTC+0) в формате YYYY-MM-DDThh:mm:ss.sssZ. Пример: `"2020-06-04T10:37:57.000Z"`
- `performer_ids: array of integer` (required) — Массив идентификаторов пользователей, привязанных к напоминанию как «ответственные». Пример: `[12]`
- `all_day: boolean` (required) — Напоминание на весь день (без указания времени). Пример: `false`
- `custom_properties: array of object` (required) — Дополнительные поля напоминания
  - `id: integer, int32` (required) — Идентификатор поля. Пример: `1678`
  - `name: string` (required, max length: 32) — Название поля. Пример: `"Город"`
  - `data_type: string` (required) — Тип поля
    Значения: `string` — Строковое значение, `number` — Числовое значение, `date` — Дата, `link` — Ссылка
  - `value: string` (required, nullable, max length: 768) — Значение. Возвращается `null`, если поле не заполнено. Число передаётся строкой, дата — в формате ISO 8601. Пример: `"Санкт-Петербург"`


## Представление

- [Открытие представления](/api/views/open)

Представление

- `type: string` (required) — Способ открытия представления. Пример: `"modal"`
  Значения: `modal` — Модальное окно
- `trigger_id: string` (required) — Уникальный идентификатор события (полученный, например, в исходящем вебхуке о нажатии кнопки). Пример: `"791a056b-006c-49dd-834b-c633fde52fe8"`
- `private_metadata: string` (max length: 3000) — Необязательная строка, которая будет отправлена в ваше приложение при отправке пользователем заполненной формы. Используйте это поле, например, для передачи в формате `JSON` какой то дополнительной информации вместе с заполненной пользователем формой. Пример: `"{\"timeoff_id\":4378}"`
- `callback_id: string` (max length: 255) — Необязательный идентификатор для распознавания этого представления, который будет отправлен в ваше приложение при отправке пользователем заполненной формы. Используйте это поле, например, для понимания, какую форму должен был заполнить пользователь. Пример: `"timeoff_request_form"`
- `view: object` (required) — Собранный объект представления
  - `title: string` (required, max length: 24) — Заголовок представления. Пример: `"Уведомление об отпуске"`
  - `close_text: string` (default: Отменить, max length: 24) — Текст кнопки закрытия представления. Отображается только в десктоп-вебе. В мобильных приложениях (iOS/Android) кнопка закрытия — это крестик в шапке, и заданный текст там не показывается. Пример: `"Закрыть"`
  - `submit_text: string` (default: Отправить, max length: 24) — Текст кнопки отправки формы. Пример: `"Отправить заявку"`
  - `blocks: array (union)` (required, max items: 100) — Массив блоков представления
    **Возможные типы элементов:**

    - **ViewBlockHeader**: Блок header — заголовок
      - `type: string` (required) — Тип блока
        Значения: `header` — Для заголовков всегда header
      - `text: string` (required, max length: 150) — Текст заголовка
    - **ViewBlockPlainText**: Блок plain_text — обычный текст
      - `type: string` (required) — Тип блока
        Значения: `plain_text` — Для обычного текста всегда plain_text
      - `text: string` (required, max length: 12000) — Текст
    - **ViewBlockMarkdown**: Блок markdown — форматированный текст
      - `type: string` (required) — Тип блока
        Значения: `markdown` — Для форматированного текста всегда markdown
      - `text: string` (required, max length: 12000) — Текст
    - **ViewBlockDivider**: Блок divider — разделитель
      - `type: string` (required) — Тип блока
        Значения: `divider` — Для разделителя всегда divider
    - **ViewBlockInput**: Блок input — текстовое поле ввода
      - `type: string` (required) — Тип блока
        Значения: `input` — Для текстового поля всегда input
      - `name: string` (required, max length: 255) — Название, которое будет передано в ваше приложение как ключ указанного пользователем значения
      - `label: string` (required, max length: 150) — Подпись к полю
      - `placeholder: string` (max length: 150) — Подсказка внутри поля ввода, пока оно пустое
      - `multiline: boolean` (default: false) — Многострочное поле
      - `initial_value: string` (max length: 3000) — Начальное значение в поле
      - `min_length: integer, int32` (min: 0, max: 3000) — Минимальная длина текста, который должен написать пользователь. Если пользователь напишет меньше, он получит ошибку.
      - `max_length: integer, int32` (min: 1, max: 3000) — Максимальная длина текста, который должен написать пользователь. Если пользователь напишет больше, он получит ошибку.
      - `required: boolean` (default: false) — Обязательность
      - `hint: string` (max length: 2000) — Подсказка, которая отображается под полем серым цветом
    - **ViewBlockSelect**: Блок select — выпадающий список
      - `type: string` (required) — Тип блока
        Значения: `select` — Для выпадающего списка всегда select
      - `name: string` (required, max length: 255) — Название, которое будет передано в ваше приложение как ключ указанного пользователем выбора
      - `label: string` (required, max length: 150) — Подпись к выпадающему списку
      - `options: array of object` (max items: 100) — Массив доступных пунктов в выпадающем списке
        - `text: string` (required, max length: 75) — Отображаемый текст
        - `value: string` (required, max length: 150) — Уникальное строковое значение, которое будет передано в ваше приложение при выборе этого пункта
        - `selected: boolean` — Изначально выбранный пункт. Только один пункт может быть выбран.
      - `required: boolean` (default: false) — Обязательность
      - `hint: string` (max length: 2000) — Подсказка, которая отображается под выпадающим списком серым цветом
    - **ViewBlockRadio**: Блок radio — радиокнопки
      - `type: string` (required) — Тип блока
        Значения: `radio` — Для радиокнопок всегда radio
      - `name: string` (required, max length: 255) — Название, которое будет передано в ваше приложение как ключ указанного пользователем выбора
      - `label: string` (required, max length: 150) — Подпись к группе радиокнопок
      - `options: array of object` (max items: 10) — Массив радиокнопок
        - `text: string` (required, max length: 75) — Отображаемый текст
        - `value: string` (required, max length: 150) — Уникальное строковое значение, которое будет передано в ваше приложение при выборе этого пункта
        - `description: string` (max length: 75) — Пояснение, которое будет указано серым цветом в этом пункте под отображаемым текстом
        - `selected: boolean` — Изначально выбранный пункт. Только один пункт может быть выбран.
      - `required: boolean` (default: false) — Обязательность
      - `hint: string` (max length: 2000) — Подсказка, которая отображается под группой радиокнопок серым цветом
    - **ViewBlockCheckbox**: Блок checkbox — чекбоксы
      - `type: string` (required) — Тип блока
        Значения: `checkbox` — Для чекбоксов всегда checkbox
      - `name: string` (required, max length: 255) — Название, которое будет передано в ваше приложение как ключ указанного пользователем выбора
      - `label: string` (required, max length: 150) — Подпись к группе чекбоксов
      - `options: array of object` (max items: 10) — Массив чекбоксов
        - `text: string` (required, max length: 75) — Отображаемый текст
        - `value: string` (required, max length: 150) — Уникальное строковое значение, которое будет передано в ваше приложение при выборе этого пункта
        - `description: string` (max length: 75) — Пояснение, которое будет указано серым цветом в этом пункте под отображаемым текстом
        - `checked: boolean` — Изначально выбранный пункт
      - `required: boolean` (default: false) — Обязательность
      - `hint: string` (max length: 2000) — Подсказка, которая отображается под группой чекбоксов серым цветом
    - **ViewBlockDate**: Блок date — выбор даты
      - `type: string` (required) — Тип блока
        Значения: `date` — Для выбора даты всегда date
      - `name: string` (required, max length: 255) — Название, которое будет передано в ваше приложение как ключ указанного пользователем значения
      - `label: string` (required, max length: 150) — Подпись к полю
      - `initial_date: date` — Начальное значение в поле в формате YYYY-MM-DD
      - `required: boolean` (default: false) — Обязательность
      - `hint: string` (max length: 2000) — Подсказка, которая отображается под полем серым цветом
    - **ViewBlockTime**: Блок time — выбор времени
      - `type: string` (required) — Тип блока
        Значения: `time` — Для выбора времени всегда time
      - `name: string` (required, max length: 255) — Название, которое будет передано в ваше приложение как ключ указанного пользователем значения
      - `label: string` (required, max length: 150) — Подпись к полю
      - `initial_time: string, time` — Начальное значение в поле в формате HH:mm
      - `required: boolean` (default: false) — Обязательность
      - `hint: string` (max length: 2000) — Подсказка, которая отображается под полем серым цветом
    - **ViewBlockFileInput**: Блок file_input — загрузка файлов
      - `type: string` (required) — Тип блока
        Значения: `file_input` — Для загрузки файлов всегда file_input
      - `name: string` (required, max length: 255) — Название, которое будет передано в ваше приложение как ключ указанного пользователем значения
      - `label: string` (required, max length: 150) — Подпись к полю
      - `filetypes: array of string` — Массив допустимых расширений файлов, указанные в виде строк (например, ["png","jpg","gif"]). Если это поле не указано, все расширения файлов будут приняты.
      - `max_files: integer, int32` (default: 10, min: 1, max: 10) — Максимальное количество файлов, которое может загрузить пользователь в это поле
      - `required: boolean` (default: false) — Обязательность
      - `hint: string` (max length: 2000) — Подсказка, которая отображается под полем серым цветом


## Параметры бота

- [Новый бот](/api/bots/create)
- [Список ботов](/api/bots/list)
- [Информация о боте](/api/bots/get)
- [Редактирование бота](/api/bots/update)
- [Удаление бота](/api/bots/delete)
- [Саморегистрация вебхука бота](/api/bots/update-webhook)
- [Ротация токена бота](/api/bots/recreate-token)
- [Ротация собственного токена бота](/api/bots/recreate-token-self)

Параметры бота

- `id: integer, int32` (required) — Идентификатор бота (совпадает с `user_id` бота). Пример: `1738816`
- `webhook: object` (required) — Объект параметров вебхука
  - `name: string` (required, max length: 255) — Имя бота. Пример: `"Бот задач"`
  - `nickname: string` (required, max length: 255) — Никнейм бота. Пример: `"tasks_bot"`
  - `outgoing_url: string` (required, nullable) — URL исходящего вебхука. `null`, если исходящий вебхук у бота не настроен. Пример: `"https://www.website.com/tasks/new"`
  - `events: array of string` (required) — События, на которые подписан бот. Пример: `["message_new"]`
  - `trigger_on: string` (required) — Условие срабатывания исходящего вебхука
    Значения: `commands` — Только на команды (триггер-слова) из commands, `all_messages` — На все сообщения в чатах, где есть бот, `unfurl` — На развёртывание ссылок (link previews)
  - `commands: array of string` (required) — Команды бота (триггер-слова). Пример: `["/task"]`
  - `scopes: array of string` (required) — Скоупы (права доступа) токена бота. Набор по умолчанию шире того, что можно назначить явно, поэтому здесь могут встречаться значения, недоступные для явной установки. Пример: `["messages:create"]`
  - `template: string` (required, nullable) — Шаблон форматирования входящего вебхука. `null`, если не задан. Пример: `"Заказ от {{ client }} на сумму {{ amount }} ₽"`
  - `template_engine: string` (required) — Шаблонизатор для обработки шаблона входящего вебхука
    Значения: `liquid` — Liquid — условия, циклы и фильтры, `mustache` — Mustache — простая подстановка без логики
  - `challenge_key: string` (required, nullable) — Название поля проверки для верификации входящего вебхука. `null`, если не задано. Пример: `"challenge"`
  - `link_preview_enabled: boolean` (required) — Показывать превью ссылок в сообщениях входящего вебхука. Пример: `true`
  - `ignore_self_messages: boolean` (required) — Игнорировать входящие сообщения, отправленные самим ботом. Пример: `false`
  - `events_history_enabled: boolean` (required) — Сохранять историю событий бота для последующего получения через метод истории событий. Пример: `false`
  - `single_chat: boolean` (required) — Ограничивает бота одной беседой или каналом: `true` — бота можно добавить только в один такой чат, `false` — в несколько. Личные чаты и треды в ограничение не входят. Пример: `false`
  - `can_edit: array of string` (required) — Роли, которым, помимо создателя, разрешено редактировать настройки бота. Создатель может редактировать всегда. Пустой массив — редактировать может только создатель. Пример: `["admin"]`
  - `who_can_add: string` (required) — Кто может добавлять бота в чаты
    Значения: `creator` — Только создатель бота, `creator_admin` — Создатель и администраторы компании, `creator_admin_user` — Создатель, администраторы и участники компании, `anyone` — Любой пользователь, в том числе гости
- `oauth_client: object` — Объект параметров OAuth-клиента. `null`, если OAuth-клиент боту не заведён.
  - `client_id: string` (required) — Идентификатор OAuth-клиента. Пример: `"6d3f1a0c8b2e4d57a91f0b3c5e7d9a12b4c6e8f0a2d4b6c8e0f2a4b6c8d0e2f4"`
  - `client_secret_preview: string` (required) — Секрет клиента в сокращённом виде: первые 8 и последние 4 символа, между ними `...`. Пример: `"9f2b7c14...d5b8"`
  - `confidential: boolean` (required) — Конфиденциальный клиент: `true` — секрет хранится на сервере приложения, `false` — публичный клиент, работающий без секрета. Пример: `true`
  - `redirect_uris: array of string` (required) — Адреса возврата, разрешённые для этого клиента. Пример: `["https://www.website.com/oauth/callback"]`
  - `scopes: array of string` (required) — Скоупы, которые клиент может запросить при авторизации. Пример: `["messages:create"]`


## Событие исходящего вебхука

- [История событий](/api/bots/list-events)
- [Удаление события](/api/bots/remove-event)

Событие исходящего вебхука

- `id: string` (required) — Идентификатор события. Пример: `"01KAJZ2XDSS2S3DSW9EXJZ0TBV"`
- `event_type: string` (required) — Тип события. Пример: `"message_new"`
- `payload: anyOf` (required) — Объект вебхука
  **Возможные варианты:**

  - **MessageWebhookPayload**: Структура исходящего вебхука о сообщении
    - `type: string` (required) — Тип объекта. Пример: `"message"`
      Значения: `message` — Для сообщений всегда message
    - `id: integer, int32` (required) — Идентификатор сообщения. Пример: `1245817`
    - `event: string` (required) — Тип события
      Значения: `new` — Создание, `update` — Обновление, `delete` — Удаление
    - `entity_type: string` (required) — Тип сущности, к которой относится сообщение
      Значения: `discussion` — Беседа или канал, `thread` — Тред, `user` — Пользователь
    - `entity_id: integer, int32` (required) — Идентификатор сущности, к которой относится сообщение. Пример: `5678`
    - `content: string` (required) — Текст сообщения. Пример: `"Текст сообщения"`
    - `user_id: integer, int32` (required) — Идентификатор отправителя сообщения. Пример: `2345`
    - `created_at: date-time` (required) — Дата и время создания сообщения (ISO-8601, UTC+0) в формате YYYY-MM-DDThh:mm:ss.sssZ. Пример: `"2025-05-15T14:30:00.000Z"`
    - `changed_at: date-time` (nullable) — Дата и время последнего изменения сообщения (ISO-8601, UTC+0) в формате YYYY-MM-DDThh:mm:ss.sssZ. У неотредактированного сообщения совпадает с датой создания. `null` у сообщений, отправленных до появления этого поля. Пример: `"2025-05-15T14:35:00.000Z"`
    - `url: string` (required) — Прямая ссылка на сообщение. Пример: `"https://pachca.com/chats/1245817/messages/5678"`
    - `chat_id: integer, int32` (required) — Идентификатор чата, в котором находится сообщение. Пример: `9012`
    - `parent_message_id: integer, int32` (nullable) — Идентификатор сообщения, к которому написан ответ. `null`, если сообщение не является ответом на другое сообщение. Пример: `3456`
    - `thread: object` — Тред, в котором отправлено сообщение. `null`, если сообщение отправлено не в треде. В отличие от поля `thread` в объекте сообщения REST API, здесь описывается тред, внутри которого находится сообщение.
      - `message_id: integer, int32` (required) — Идентификатор сообщения, к которому был создан тред. Пример: `12345`
      - `message_chat_id: integer, int32` (required) — Идентификатор чата сообщения, к которому был создан тред. Пример: `67890`
    - `webhook_timestamp: integer, int32` (required) — Дата и время отправки вебхука (UTC+0) в формате UNIX. Пример: `1747574400`
  - **ReactionWebhookPayload**: Структура исходящего вебхука о реакции
    - `type: string` (required) — Тип объекта. Пример: `"reaction"`
      Значения: `reaction` — Для реакций всегда reaction
    - `event: string` (required) — Тип события
      Значения: `new` — Создание, `delete` — Удаление
    - `chat_id: integer, int32` (required, nullable) — Идентификатор чата, в котором находится сообщение. Поле всегда присутствует в payload. В редких случаях (например, если сообщение было удалено к моменту отправки вебхука) может быть `null`. Пример: `9012`
    - `message_id: integer, int32` (required) — Идентификатор сообщения, к которому относится реакция. Пример: `1245817`
    - `code: string` (required) — Emoji символ реакции. Пример: `"👍"`
    - `name: string` (required) — Название реакции. Пример: `"thumbsup"`
    - `user_id: integer, int32` (required) — Идентификатор пользователя, который добавил или удалил реакцию. Пример: `2345`
    - `created_at: date-time` (required) — Дата и время добавления реакции (ISO-8601, UTC+0) в формате YYYY-MM-DDThh:mm:ss.sssZ. Поле присутствует и для события удаления реакции. Пример: `"2025-05-15T14:30:00.000Z"`
    - `webhook_timestamp: integer, int32` (required) — Дата и время отправки вебхука (UTC+0) в формате UNIX. Пример: `1747574400`
  - **ButtonWebhookPayload**: Структура исходящего вебхука о нажатии кнопки
    - `type: string` (required) — Тип объекта. Пример: `"button"`
      Значения: `button` — Для кнопки всегда button
    - `event: string` (required) — Тип события. Пример: `"click"`
      Значения: `click` — Нажатие кнопки
    - `message_id: integer, int32` (required) — Идентификатор сообщения, к которому относится кнопка. Пример: `1245817`
    - `trigger_id: string` (required) — Уникальный идентификатор события. Время жизни — 3 секунды. Может быть использован, например, для открытия представления пользователю. Пример: `"a1b2c3d4-5e6f-7g8h-9i10-j11k12l13m14"`
    - `data: string` (required) — Данные нажатой кнопки. Пример: `"button_data"`
    - `user_id: integer, int32` (required) — Идентификатор пользователя, который нажал кнопку. Пример: `2345`
    - `chat_id: integer, int32` (required) — Идентификатор чата, в котором была нажата кнопка. Пример: `9012`
    - `webhook_timestamp: integer, int32` (required) — Дата и время отправки вебхука (UTC+0) в формате UNIX. Пример: `1747574400`
  - **ViewSubmitWebhookPayload**: Структура исходящего вебхука о заполнении формы
    - `type: string` (required) — Тип объекта. Пример: `"view"`
      Значения: `view` — Для формы всегда view
    - `event: string` (required) — Тип события. Пример: `"submit"`
      Значения: `submit` — Отправка формы
    - `callback_id: string` (required, nullable) — Идентификатор обратного вызова, указанный при открытии представления. `null`, если при открытии формы он не был указан. Пример: `"timeoff_request_form"`
    - `private_metadata: string` (required, nullable) — Приватные метаданные, указанные при открытии представления. `null`, если при открытии формы они не были указаны. Пример: `"{\"timeoff_id\":4378}"`
    - `chat_id: integer, int32` (required, nullable) — Идентификатор чата, в котором была нажата кнопка, открывшая форму. Поле может быть `null` для форм, открытых до выкатки этого поля. Пример: `9012`
    - `user_id: integer, int32` (required) — Идентификатор пользователя, который отправил форму. Пример: `1235523`
    - `data: Record<string, object>` (required) — Данные заполненных полей представления. Ключ — `name` блока, значение — введённые данные.
      **Структура значений Record:**
      - Тип значения: `any`
    - `webhook_timestamp: integer, int32` (required) — Дата и время отправки вебхука (UTC+0) в формате UNIX. Пример: `1755075544`
  - **ChatMemberWebhookPayload**: Структура исходящего вебхука об участниках чата
    - `type: string` (required) — Тип объекта. Пример: `"chat_member"`
      Значения: `chat_member` — Для участника чата всегда chat_member
    - `event: string` (required) — Тип события
      Значения: `add` — Добавление, `remove` — Удаление
    - `chat_id: integer, int32` (required) — Идентификатор чата, в котором изменился состав участников. Пример: `9012`
    - `thread_id: integer, int32` (nullable) — Идентификатор треда. `null`, если участники добавлены в обычный чат или канал, а не в тред. Пример: `5678`
    - `user_ids: array of integer` (required) — Массив идентификаторов пользователей, с которыми произошло событие. Пример: `[2345,6789]`
    - `created_at: date-time` (required) — Дата и время события (ISO-8601, UTC+0) в формате YYYY-MM-DDThh:mm:ss.sssZ. Пример: `"2025-05-15T14:30:00.000Z"`
    - `webhook_timestamp: integer, int32` (required) — Дата и время отправки вебхука (UTC+0) в формате UNIX. Пример: `1747574400`
  - **CompanyMemberWebhookPayload**: Структура исходящего вебхука об участниках пространства
    - `type: string` (required) — Тип объекта. Пример: `"company_member"`
      Значения: `company_member` — Для участника пространства всегда company_member
    - `event: string` (required) — Тип события
      Значения: `invite` — Приглашение, `confirm` — Подтверждение, `update` — Обновление, `suspend` — Приостановка, `activate` — Активация, `delete` — Удаление
    - `user_ids: array of integer` (required) — Массив идентификаторов пользователей, с которыми произошло событие. Пример: `[2345,6789]`
    - `created_at: date-time` (required) — Дата и время события (ISO-8601, UTC+0) в формате YYYY-MM-DDThh:mm:ss.sssZ. Пример: `"2025-05-15T14:30:00.000Z"`
    - `webhook_timestamp: integer, int32` (required) — Дата и время отправки вебхука (UTC+0) в формате UNIX. Пример: `1747574400`
  - **LinkSharedWebhookPayload**: Структура исходящего вебхука о разворачивании ссылок
    - `type: string` (required) — Тип объекта. Пример: `"message"`
      Значения: `message` — Для разворачивания ссылок всегда message
    - `event: string` (required) — Тип события. Пример: `"link_shared"`
      Значения: `link_shared` — Обнаружена ссылка на отслеживаемый домен
    - `chat_id: integer, int32` (required) — Идентификатор чата, в котором обнаружена ссылка. Пример: `23438`
    - `message_id: integer, int32` (required) — Идентификатор сообщения, содержащего ссылку. Пример: `268092`
    - `links: array of object` (required) — Массив обнаруженных ссылок на отслеживаемые домены
      - `url: string` (required) — URL ссылки. Пример: `"https://example.com/page1"`
      - `domain: string` (required) — Домен ссылки. Пример: `"example.com"`
      - `skip: boolean` (required) — Признак того, что автор сообщения скрыл превью для этой ссылки. Если `true` — бот не должен создавать превью. Пример: `false`
    - `user_id: integer, int32` (required) — Идентификатор отправителя сообщения. Пример: `2345`
    - `created_at: date-time` (required) — Дата и время создания сообщения (ISO-8601, UTC+0) в формате YYYY-MM-DDThh:mm:ss.sssZ. Пример: `"2024-09-18T19:53:14.000Z"`
    - `webhook_timestamp: integer, int32` (required) — Дата и время отправки вебхука (UTC+0) в формате UNIX. Пример: `1726685594`
  - **VideoCallWebhookPayload**: Структура исходящего вебхука о видеозвонке
    - `type: string` (required) — Тип объекта. Пример: `"video_call"`
      Значения: `video_call` — Для видеозвонков всегда video_call
    - `event: string` (required) — Тип события
      Значения: `started` — Видеозвонок начался, `finished` — Видеозвонок завершился, `recording_ready` — Запись видеозвонка готова
    - `video_room_id: integer, int32` (required) — Идентификатор видеозвонка. Пример: `9012`
    - `chat_id: integer, int32` (required) — Идентификатор чата, в котором проходит видеозвонок. Пример: `23438`
    - `owner_id: integer, int32` (required) — Идентификатор пользователя, начавшего видеозвонок. Пример: `2345`
    - `thread: object` — Объект с параметрами треда, если видеозвонок проходит в треде. `null`, если звонок не в треде.
      - `id: integer, int32` (required) — Идентификатор треда. Пример: `12345`
      - `chat_id: integer, int32` (required) — Идентификатор чата треда. Пример: `67890`
      - `message_id: integer, int32` (required) — Идентификатор сообщения, к которому создан тред. Пример: `268092`
      - `message_chat_id: integer, int32` (required) — Идентификатор чата сообщения, к которому создан тред. Пример: `23438`
    - `started_at: date-time` — Дата и время начала звонка (ISO-8601, UTC+0) в формате YYYY-MM-DDThh:mm:ss.sssZ. Присутствует для событий started и finished. Пример: `"2025-05-15T14:30:00.000Z"`
    - `finished_at: date-time` — Дата и время завершения звонка (ISO-8601, UTC+0) в формате YYYY-MM-DDThh:mm:ss.sssZ. Присутствует для события finished. Пример: `"2025-05-15T14:45:00.000Z"`
    - `duration: integer, int32` — Длительность в секундах. Для события finished — длительность звонка, для recording_ready — длительность записи. Пример: `900`
    - `members: array of object` — Список участников звонка. Присутствует для события finished.
      - `user_id: integer, int32` (required) — Идентификатор участника. Пример: `2345`
      - `joined_at: date-time` (required) — Дата и время первого подключения к звонку (ISO-8601, UTC+0) в формате YYYY-MM-DDThh:mm:ss.sssZ. Пример: `"2025-05-15T14:30:00.000Z"`
      - `left_at: date-time` (required) — Дата и время выхода из звонка (ISO-8601, UTC+0) в формате YYYY-MM-DDThh:mm:ss.sssZ. Если участник оставался в звонке до его завершения, совпадает с временем окончания звонка. Пример: `"2025-05-15T14:45:00.000Z"`
    - `recording_id: integer, int32` — Идентификатор записи. Присутствует для события recording_ready. Пример: `4567`
    - `file_id: integer, int32` (nullable) — Идентификатор файла записи. Присутствует для события recording_ready. `null`, если файл ещё не привязан. Пример: `89012`
    - `url: string` — Прямая ссылка на файл записи. Присутствует для события recording_ready. Пример: `"https://api.pachca.com/files/89012"`
    - `size: integer, int32` — Размер файла записи в байтах. Присутствует для события recording_ready. Пример: `10485760`
    - `webhook_timestamp: integer, int32` (required) — Дата и время отправки вебхука (UTC+0) в формате UNIX. Пример: `1747574400`
- `created_at: date-time` (required) — Дата и время создания события (ISO-8601, UTC+0) в формате YYYY-MM-DDThh:mm:ss.sssZ. Пример: `"2025-05-15T14:30:00.000Z"`


## Событие аудита

- [Журнал аудита событий](/api/security/list)

Событие аудита

- `id: string` (required) — Уникальный идентификатор события. Пример: `"a1b2c3d4-5e6f-7g8h-9i10-j11k12l13m14"`
- `created_at: date-time` (required) — Дата и время создания события (ISO-8601, UTC+0) в формате YYYY-MM-DDThh:mm:ss.sssZ. Пример: `"2025-05-15T14:30:00.000Z"`
- `event_key: string` (required) — Ключ типа события
  Значения: `user_login` — Пользователь успешно вошел в систему, `user_logout` — Пользователь вышел из системы, `user_2fa_fail` — Неудачная попытка двухфакторной аутентификации, `user_2fa_success` — Успешная двухфакторная аутентификация, `user_created` — Создана новая учетная запись пользователя, `user_deleted` — Учетная запись пользователя удалена, `user_role_changed` — Роль пользователя была изменена, `user_updated` — Данные пользователя обновлены, `tag_created` — Создан новый тег, `tag_deleted` — Тег удален, `user_added_to_tag` — Пользователь добавлен в тег, `user_removed_from_tag` — Пользователь удален из тега, `chat_created` — Создан новый чат, `chat_renamed` — Чат переименован, `chat_permission_changed` — Изменены права доступа к чату, `user_chat_join` — Пользователь присоединился к чату, `user_chat_leave` — Пользователь покинул чат, `tag_added_to_chat` — Тег добавлен в чат, `tag_removed_from_chat` — Тег удален из чата, `message_updated` — Сообщение отредактировано, `message_deleted` — Сообщение удалено, `message_created` — Сообщение создано, `reaction_created` — Реакция добавлена, `reaction_deleted` — Реакция удалена, `thread_created` — Тред создан, `access_token_created` — Создан новый токен доступа, `access_token_updated` — Токен доступа обновлен, `access_token_destroy` — Токен доступа удален, `kms_encrypt` — Данные зашифрованы, `kms_decrypt` — Данные расшифрованы, `audit_events_accessed` — Доступ к журналам аудита получен, `dlp_violation_detected` — Срабатывание правила DLP-системы, `search_users_api` — Поиск сотрудников через API, `search_chats_api` — Поиск чатов через API, `search_messages_api` — Поиск сообщений через API, `bot_scopes_updated` — Изменены скоупы токена бота, `bot_webhook_settings_updated` — Изменены настройки исходящего вебхука бота, `bot_token_recreated` — Токен бота перевыпущен (ротация), `bot_deleted` — Бот удалён, `bot_oauth_client_updated` — Изменены параметры OAuth-клиента бота, `oauth_authorization_granted` — Пользователь выдал OAuth-клиенту доступ к своим данным, `oauth_authorization_revoked` — Доступ OAuth-клиента к данным пользователя отозван, `video_call_started` — Видеозвонок начат, `video_call_finished` — Видеозвонок завершён, `video_call_recording_ready` — Запись видеозвонка готова
- `entity_id: string` (required) — Идентификатор затронутой сущности. Пример: `"98765"`
- `entity_type: string` (required) — Тип затронутой сущности. Пример: `"User"`
- `actor_id: string` (required) — Идентификатор пользователя, выполнившего действие. Пример: `"98765"`
- `actor_type: string` (required) — Тип актора. Пример: `"User"`
- `details: anyOf` (required) — Дополнительные детали события. Структура зависит от значения event_key — см. описания значений поля event_key. Для событий без деталей возвращается пустой объект.
  **Возможные варианты:**

  - **AuditDetailsEmpty**: Пустые детали. При: user_login, user_logout, user_2fa_fail, user_2fa_success, user_created, user_deleted, chat_created, message_created, message_updated, message_deleted, reaction_created, reaction_deleted, thread_created, audit_events_accessed.
  - **AuditDetailsUserUpdated**: При: user_updated
    - `changed_attrs: array of string` (required) — Список изменённых полей
    - `context: string` — Как было выполнено изменение. Значение `sso_login` — профиль обновился автоматически при входе через SSO. Поле отсутствует, если профиль изменили обычным способом.
  - **AuditDetailsRoleChanged**: При: user_role_changed
    - `new_company_role: string` (required) — Новая роль
    - `previous_company_role: string` (required) — Предыдущая роль
    - `initiator_id: integer, int32` (required) — Идентификатор инициатора
  - **AuditDetailsTagName**: При: tag_created, tag_deleted
    - `name: string` (required) — Название тега
  - **AuditDetailsInitiator**: При: user_added_to_tag, user_removed_from_tag, user_chat_leave
    - `initiator_id: integer, int32` (required) — Идентификатор инициатора действия
  - **AuditDetailsInviter**: При: user_chat_join
    - `inviter_id: integer, int32` (required) — Идентификатор пригласившего
  - **AuditDetailsChatRenamed**: При: chat_renamed
    - `old_name: string` (required) — Прежнее название чата
    - `new_name: string` (required) — Новое название чата
  - **AuditDetailsChatPermission**: При: chat_permission_changed
    - `public_access: boolean` (required) — Публичный доступ
  - **AuditDetailsTagChat**: При: tag_added_to_chat
    - `chat_id: integer, int32` (required) — Идентификатор чата
    - `tag_name: string` (required) — Название тега
  - **AuditDetailsChatId**: При: tag_removed_from_chat
    - `chat_id: integer, int32` (required) — Идентификатор чата
  - **AuditDetailsTokenScopes**: При: access_token_created, access_token_updated, access_token_destroy
    - `scopes: array of string` (required) — Скоупы токена
  - **AuditDetailsKms**: При: kms_encrypt, kms_decrypt
    - `chat_id: integer, int32` (required) — Идентификатор чата
    - `message_id: integer, int32` (required) — Идентификатор сообщения
    - `reason: string` (required) — Причина операции
  - **AuditDetailsDlp**: При: dlp_violation_detected
    - `dlp_rule_id: integer, int32` (required) — Идентификатор правила DLP
    - `dlp_rule_name: string` (required) — Название правила DLP
    - `message_id: integer, int32` (required) — Идентификатор сообщения
    - `chat_id: integer, int32` (required) — Идентификатор чата
    - `user_id: integer, int32` (required) — Идентификатор пользователя
    - `action_message: string` (required, nullable) — Описание действия. `null`, если у действия правила текст не задан.
    - `conditions_matched: boolean` (required) — Результат проверки условий правила (true — условия сработали)
  - **AuditDetailsSearch**: При: search_users_api, search_chats_api, search_messages_api
    - `search_type: string` (required) — Тип поиска
    - `query_present: boolean` (required) — Указан ли поисковый запрос
    - `cursor_present: boolean` (required) — Использован ли курсор
    - `limit: integer, int32` (required) — Количество возвращённых результатов
    - `filters: Record<string, object>` (required) — Применённые фильтры. Возможные ключи зависят от типа поиска: order, sort, created_from, created_to, company_roles (users), active, chat_subtype, personal (chats), chat_ids, user_ids (messages).
      **Структура значений Record:**
      - Тип значения: `any`
  - **AuditDetailsBot**: При: bot_deleted, bot_token_recreated
    - `bot_id: integer, int32` (required) — Идентификатор бота
    - `actor_id: integer, int32` (required, nullable) — Идентификатор пользователя, выполнившего действие. `null`, если действие выполнено без инициатора.
  - **AuditDetailsBotScopes**: При: bot_scopes_updated
    - `added_scopes: array of string` (required) — Скоупы, добавленные токену бота
    - `removed_scopes: array of string` (required) — Скоупы, отозванные у токена бота
  - **AuditDetailsBotWebhookSettings**: При: bot_webhook_settings_updated
    - `changes: Record<string, object>` (required) — Изменённые настройки вебхука. Ключ — имя настройки (outgoing_url, ignore_self_messages, events_history_enabled), значение — объект с полями previous (прежнее значение) и new (новое значение).
      **Структура значений Record:**
      - Тип значения: `any`
  - **AuditDetailsBotOAuthClient**: При: bot_oauth_client_updated
    - `client_id: string` (required) — Идентификатор OAuth-клиента бота
    - `changes: Record<string, object>` (required) — Изменённые параметры клиента. Ключ — имя параметра (confidential, redirect_uris, scopes), значение — объект с полями previous (прежнее значение) и new (новое значение).
      **Структура значений Record:**
      - Тип значения: `any`
  - **AuditDetailsOAuthAuthorizationGranted**: При: oauth_authorization_granted
    - `client_id: string` (required) — Идентификатор OAuth-клиента, которому выдан доступ
    - `scopes: array of string` (required) — Скоупы, на которые выдан доступ
  - **AuditDetailsOAuthAuthorizationRevoked**: При: oauth_authorization_revoked
    - `client_id: string` (required) — Идентификатор OAuth-клиента, у которого отозван доступ
    - `revoked_tokens_count: integer, int32` (required) — Количество отозванных токенов
  - **AuditDetailsVideoCallStarted**: При: video_call_started
    - `chat_id: integer, int32` (required) — Идентификатор чата, в котором проходит видеозвонок
    - `started_message_id: integer, int32` (required, nullable) — Идентификатор сообщения о начале звонка. `null`, если такого сообщения нет.
  - **AuditDetailsVideoCallFinished**: При: video_call_finished
    - `chat_id: integer, int32` (required) — Идентификатор чата, в котором проходил видеозвонок
    - `started_message_id: integer, int32` (required, nullable) — Идентификатор сообщения о начале звонка. `null`, если такого сообщения нет.
    - `duration: integer, int32` (required) — Длительность звонка в секундах
    - `max_members_count: integer, int32` (required) — Максимальное число одновременных участников за время звонка
  - **AuditDetailsVideoCallRecording**: При: video_call_recording_ready
    - `chat_id: integer, int32` (required) — Идентификатор чата, в котором проходил видеозвонок
    - `started_message_id: integer, int32` (required, nullable) — Идентификатор сообщения о начале звонка. `null`, если такого сообщения нет.
    - `recording_id: integer, int32` (required) — Идентификатор записи
    - `file_id: integer, int32` (required) — Идентификатор файла записи
    - `duration: integer, int32` (required) — Длительность записи в секундах
    - `size: integer, int64` (required) — Размер файла записи в байтах
- `ip_address: string` (required, nullable) — IP-адрес, с которого было выполнено действие. `null` у событий, записанных без запроса пользователя. Пример: `"192.168.1.100"`
- `user_agent: string` (required, nullable) — User agent клиента, обрезается до 255 символов. `null` у событий, записанных без запроса пользователя. Пример: `"Pachca/3.60.0 (co.staply.pachca; build:15; iOS 18.5.0) Alamofire/5.0.0"`

