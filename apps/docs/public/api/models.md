
# Модели

Все модели данных, возвращаемые в ответах API. Каждая модель содержит связанные методы и таблицу свойств.

> Методы [Получение подписи](POST /uploads) и [Загрузка файла](POST /direct_url) не возвращают модели данных.


## Дополнительное поле

- [Список дополнительных полей](GET /custom_properties)

Дополнительное поле

- `id: integer, int32` (required) — Идентификатор поля. Пример: `1678`
- `name: string` (required) — Название поля. Пример: `"Город"`
- `data_type: string` (required) — Тип поля
  Значения: `string` — Строковое значение, `number` — Числовое значение, `date` — Дата, `link` — Ссылка


## Токен доступа

- [Информация о токене](GET /oauth/token/info)

Токен доступа

- `id: integer, int64` (required) — Идентификатор токена. Пример: `4827`
- `token: string` (required) — Маскированный токен (видны первые 8 и последние 4 символа). Пример: `"cH5kR9mN...x7Qp"`
- `name: string` (required) — Пользовательское имя токена. Пример: `"Мой API токен"`
- `user_id: integer, int64` (required) — Идентификатор владельца токена. Пример: `12`
- `scopes: array of string` (required) — Список скоупов токена. Пример: `["messages:read","chats:read"]`
- `created_at: date-time` (required) — Дата создания токена. Пример: `"2025-01-15T10:30:00.000Z"`
- `revoked_at: date-time` (required) — Дата отзыва токена. Пример: `null`
- `expires_in: integer, int32` (required) — Время жизни токена в секундах. Пример: `null`
- `last_used_at: date-time` (required) — Дата последнего использования токена. Пример: `"2025-02-24T14:20:00.000Z"`


## Статус пользователя

- [Статус сотрудника](GET /users/{user_id}/status)
- [Текущий статус](GET /profile/status)
- [Новый статус](PUT /profile/status)
- [Новый статус сотрудника](PUT /users/{user_id}/status)
- [Удаление статуса](DELETE /profile/status)
- [Удаление статуса сотрудника](DELETE /users/{user_id}/status)

Статус пользователя

- `emoji: string` (required) — Emoji символ статуса. Пример: `"🎮"`
- `title: string` (required) — Текст статуса. Пример: `"Очень занят"`
- `expires_at: date-time` (required) — Срок жизни статуса (ISO-8601, UTC+0) в формате YYYY-MM-DDThh:mm:ss.sssZ. Пример: `"2024-04-08T10:00:00.000Z"`
- `is_away: boolean` (required) — Режим «Нет на месте». Пример: `false`
- `away_message: object` (required) — Сообщение при режиме «Нет на месте». Отображается в профиле пользователя, а также при отправке ему личного сообщения или упоминании в чате.
  - `text: string` (required) — Текст сообщения. Пример: `"Я в отпуске до 15 апреля. По срочным вопросам обращайтесь к @ivanov."`


## Сотрудник

- [Информация о профиле](GET /profile)
- [Информация о сотруднике](GET /users/{id})
- [Список сотрудников](GET /users)
- [Список сотрудников тега](GET /group_tags/{id}/users)
- [Список участников чата](GET /chats/{id}/members)
- [Поиск сотрудников](GET /search/users)
- [Создать сотрудника](POST /users)
- [Редактирование сотрудника](PUT /users/{id})
- [Удаление сотрудника](DELETE /users/{id})

Сотрудник

- `id: integer, int32` (required) — Идентификатор пользователя. Пример: `12`
- `first_name: string` (required) — Имя. Пример: `"Олег"`
- `last_name: string` (required) — Фамилия. Пример: `"Петров"`
- `nickname: string` (required) — Имя пользователя. Пример: `""`
- `email: string` (required) — Электронная почта. Пример: `"olegp@example.com"`
- `phone_number: string` (required) — Телефон. Пример: `""`
- `department: string` (required) — Департамент. Пример: `"Продукт"`
- `title: string` (required) — Должность. Пример: `"CIO"`
- `role: string` (required) — Уровень доступа
  Значения: `admin` — Администратор, `user` — Сотрудник, `multi_guest` — Мульти-гость, `guest` — Гость
- `suspended: boolean` (required) — Деактивация пользователя. Пример: `false`
- `invite_status: string` (required) — Статус приглашения
  Значения: `confirmed` — Принято, `sent` — Отправлено
- `list_tags: array of string` (required) — Массив тегов, привязанных к сотруднику. Пример: `["Product","Design"]`
- `custom_properties: array of object` (required) — Дополнительные поля сотрудника
  - `id: integer, int32` (required) — Идентификатор поля. Пример: `1678`
  - `name: string` (required) — Название поля. Пример: `"Город"`
  - `data_type: string` (required) — Тип поля
    Значения: `string` — Строковое значение, `number` — Числовое значение, `date` — Дата, `link` — Ссылка
  - `value: string` (required) — Значение. Пример: `"Санкт-Петербург"`
- `user_status: object` (required) — Статус
  - `emoji: string` (required) — Emoji символ статуса. Пример: `"🎮"`
  - `title: string` (required) — Текст статуса. Пример: `"Очень занят"`
  - `expires_at: date-time` (required) — Срок жизни статуса (ISO-8601, UTC+0) в формате YYYY-MM-DDThh:mm:ss.sssZ. Пример: `"2024-04-08T10:00:00.000Z"`
  - `is_away: boolean` (required) — Режим «Нет на месте». Пример: `false`
  - `away_message: object` (required) — Сообщение при режиме «Нет на месте». Отображается в профиле пользователя, а также при отправке ему личного сообщения или упоминании в чате.
    - `text: string` (required) — Текст сообщения. Пример: `"Я в отпуске до 15 апреля. По срочным вопросам обращайтесь к @ivanov."`
- `bot: boolean` (required) — Является ботом. Пример: `false`
- `sso: boolean` (required) — Использует ли пользователь SSO. Пример: `false`
- `created_at: date-time` (required) — Дата создания (ISO-8601, UTC+0) в формате YYYY-MM-DDThh:mm:ss.sssZ. Пример: `"2020-06-08T09:32:57.000Z"`
- `last_activity_at: date-time` (required) — Дата последней активности пользователя (ISO-8601, UTC+0) в формате YYYY-MM-DDThh:mm:ss.sssZ. Пример: `"2025-01-20T13:40:07.000Z"`
- `time_zone: string` (required) — Часовой пояс пользователя. Пример: `"Europe/Moscow"`
- `image_url: string` (required) — Ссылка на скачивание аватарки пользователя. Пример: `"https://app.pachca.com/users/12/photo.jpg"`


## Тег

- [Информация о теге](GET /group_tags/{id})
- [Список тегов сотрудников](GET /group_tags)
- [Новый тег](POST /group_tags)
- [Добавление тегов](POST /chats/{id}/group_tags)
- [Редактирование тега](PUT /group_tags/{id})
- [Исключение тега](DELETE /chats/{id}/group_tags/{tag_id})
- [Удаление тега](DELETE /group_tags/{id})

Тег

- `id: integer, int32` (required) — Идентификатор тега. Пример: `9111`
- `name: string` (required) — Название тега. Пример: `"Design"`
- `users_count: integer, int32` (required) — Количество сотрудников, которые имеют этот тег. Пример: `6`


## Чат

- [Информация о чате](GET /chats/{id})
- [Список чатов](GET /chats)
- [Поиск чатов](GET /search/chats)
- [Скачать архив экспорта](GET /chats/exports/{id})
- [Новый чат](POST /chats)
- [Добавление пользователей](POST /chats/{id}/members)
- [Экспорт сообщений](POST /chats/exports)
- [Обновление чата](PUT /chats/{id})
- [Архивация чата](PUT /chats/{id}/archive)
- [Разархивация чата](PUT /chats/{id}/unarchive)
- [Редактирование роли](PUT /chats/{id}/members/{user_id})
- [Выход из беседы или канала](DELETE /chats/{id}/leave)
- [Исключение пользователя](DELETE /chats/{id}/members/{user_id})

Чат

- `id: integer, int32` (required) — Идентификатор созданного чата. Пример: `334`
- `name: string` (required) — Название. Пример: `"🤿 aqua"`
- `created_at: date-time` (required) — Дата и время создания чата (ISO-8601, UTC+0) в формате YYYY-MM-DDThh:mm:ss.sssZ. Пример: `"2021-08-28T15:56:53.000Z"`
- `owner_id: integer, int32` (required) — Идентификатор пользователя, создавшего чат. Пример: `185`
- `member_ids: array of integer` (required) — Массив идентификаторов пользователей, участников. Пример: `[185,186,187]`
- `group_tag_ids: array of integer` (required) — Массив идентификаторов тегов, участников. Пример: `[9111]`
- `channel: boolean` (required) — Является каналом. Пример: `true`
- `personal: boolean` (required) — Является личным чатом. Пример: `false`
- `public: boolean` (required) — Открытый доступ. Пример: `false`
- `last_message_at: date-time` (required) — Дата и время создания последнего сообщения в чате (ISO-8601, UTC+0) в формате YYYY-MM-DDThh:mm:ss.sssZ. Пример: `"2021-08-28T15:56:53.000Z"`
- `meet_room_url: string` (required) — Ссылка на Видеочат. Пример: `"https://meet.pachca.com/aqua-94bb21b5"`


## Тред

- [Информация о треде](GET /threads/{id})
- [Новый тред](POST /messages/{id}/thread)

Тред

- `id: integer, int64` (required) — Идентификатор созданного треда (используется для отправки [новых комментариев](POST /messages) в тред). Пример: `265142`
- `chat_id: integer, int64` (required) — Идентификатор чата треда (используется для отправки [новых комментариев](POST /messages) в тред и получения [списка комментариев](GET /messages)). Пример: `2637266155`
- `message_id: integer, int64` (required) — Идентификатор сообщения, к которому был создан тред. Пример: `154332686`
- `message_chat_id: integer, int64` (required) — Идентификатор чата сообщения. Пример: `2637266154`
- `updated_at: date-time` (required) — Дата и время обновления треда (ISO-8601, UTC+0) в формате YYYY-MM-DDThh:mm:ss.sssZ. Пример: `"2023-02-01T19:20:47.204Z"`


## Сообщение

- [Информация о сообщении](GET /messages/{id})
- [Список сообщений чата](GET /messages)
- [Поиск сообщений](GET /search/messages)
- [Список прочитавших сообщение](GET /messages/{id}/read_member_ids)
- [Новое сообщение](POST /messages)
- [Закрепление сообщения](POST /messages/{id}/pin)
- [Unfurl (разворачивание ссылок)](POST /messages/{id}/link_previews)
- [Редактирование сообщения](PUT /messages/{id})
- [Открепление сообщения](DELETE /messages/{id}/pin)
- [Удаление сообщения](DELETE /messages/{id})

Сообщение

- `id: integer, int32` (required) — Идентификатор сообщения. Пример: `194275`
- `entity_type: string` (required) — Тип сущности, к которой относится сообщение
  Значения: `discussion` — Беседа или канал, `thread` — Тред, `user` — Пользователь
- `entity_id: integer, int32` (required) — Идентификатор сущности, к которой относится сообщение (беседы/канала, треда или пользователя). Пример: `334`
- `chat_id: integer, int32` (required) — Идентификатор чата, в котором находится сообщение. Пример: `334`
- `root_chat_id: integer, int32` (required) — Идентификатор корневого чата. Для сообщений в тредах — идентификатор чата, в котором был создан тред. Для обычных сообщений совпадает с `chat_id`.. Пример: `334`
- `content: string` (required) — Текст сообщения. Пример: `"Вчера мы продали 756 футболок (что на 10% больше, чем в прошлое воскресенье)"`
- `user_id: integer, int32` (required) — Идентификатор пользователя, создавшего сообщение. Пример: `12`
- `created_at: date-time` (required) — Дата и время создания сообщения (ISO-8601, UTC+0) в формате YYYY-MM-DDThh:mm:ss.sssZ. Пример: `"2021-08-28T15:57:23.000Z"`
- `url: string` (required) — Прямая ссылка на сообщение. Пример: `"https://app.pachca.com/chats/334?message=194275"`
- `files: array of object` (required) — Прикрепленные файлы
  - `id: integer, int32` (required) — Идентификатор файла. Пример: `3560`
  - `key: string` (required) — Путь к файлу. Пример: `"attaches/files/12/21zu7934-02e1-44d9-8df2-0f970c259796/congrat.png"`
  - `name: string` (required) — Название файла с расширением. Пример: `"congrat.png"`
  - `file_type: string` (required) — Тип файла
    Значения: `file` — Обычный файл, `image` — Изображение
  - `url: string` (required) — Прямая ссылка на скачивание файла. Пример: `"https://pachca-prod-uploads.s3.storage.selcloud.ru/attaches/files/12/21zu7934-02e1-44d9-8df2-0f970c259796/congrat.png?response-cache-control=max-age%3D3600%3B&response-content-disposition=attachment&X-Amz-Algorithm=AWS4-HMAC-SHA256&X-Amz-Credential=142155_staply%2F20231107%2Fru-1a%2Fs3%2Faws4_request&X-Amz-Date=20231107T160412&X-Amz-Expires=604800&X-Amz-SignedHeaders=host&X-Amz-Signature=98765asgfadsfdSaDSd4sdfg35asdf67sadf8"`
  - `width: integer, int32` — Ширина изображения в пикселях. Пример: `1920`
  - `height: integer, int32` — Высота изображения в пикселях. Пример: `1080`
- `buttons: array of array` (required) — Массив строк, каждая из которых представлена массивом кнопок
- `thread: object` (required) — Тред сообщения
  - `id: integer, int64` (required) — Идентификатор треда. Пример: `265142`
  - `chat_id: integer, int64` (required) — Идентификатор чата треда. Пример: `2637266155`
- `forwarding: object` (required) — Информация о пересланном сообщении
  - `original_message_id: integer, int32` (required) — Идентификатор оригинального сообщения. Пример: `194275`
  - `original_chat_id: integer, int32` (required) — Идентификатор чата, в котором находится оригинальное сообщение. Пример: `334`
  - `author_id: integer, int32` (required) — Идентификатор пользователя, создавшего оригинальное сообщение. Пример: `12`
  - `original_created_at: date-time` (required) — Дата и время создания оригинального сообщения (ISO-8601, UTC+0) в формате YYYY-MM-DDThh:mm:ss.sssZ. Пример: `"2025-01-15T10:30:00.000Z"`
  - `original_thread_id: integer, int32` (required) — Идентификатор треда, в котором находится оригинальное сообщение. Пример: `null`
  - `original_thread_message_id: integer, int32` (required) — Идентификатор сообщения, к которому был создан тред, в котором находится оригинальное сообщение. Пример: `null`
  - `original_thread_parent_chat_id: integer, int32` (required) — Идентификатор чата сообщения, к которому был создан тред, в котором находится оригинальное сообщение. Пример: `null`
- `parent_message_id: integer, int32` (required) — Идентификатор сообщения, к которому написан ответ. Пример: `null`
- `display_avatar_url: string` (required) — Ссылка на аватарку отправителя сообщения. Пример: `null`
- `display_name: string` (required) — Полное имя отправителя сообщения. Пример: `null`
- `changed_at: date-time` (required) — Дата и время последнего редактирования сообщения (ISO-8601, UTC+0) в формате YYYY-MM-DDThh:mm:ss.sssZ. Пример: `"2021-08-28T16:10:00.000Z"`
- `deleted_at: date-time` (required) — Дата и время удаления сообщения (ISO-8601, UTC+0) в формате YYYY-MM-DDThh:mm:ss.sssZ. Пример: `null`


## Реакция на сообщение

- [Список реакций](GET /messages/{id}/reactions)
- [Добавление реакции](POST /messages/{id}/reactions)
- [Удаление реакции](DELETE /messages/{id}/reactions)

Реакция на сообщение

- `user_id: integer, int32` (required) — Идентификатор пользователя, который добавил реакцию. Пример: `12`
- `created_at: date-time` (required) — Дата и время добавления реакции (ISO-8601, UTC+0) в формате YYYY-MM-DDThh:mm:ss.sssZ. Пример: `"2024-01-20T10:30:00.000Z"`
- `code: string` (required) — Emoji символ реакции. Пример: `"👍"`
- `name: string` (required) — Название emoji реакции. Пример: `":+1::skin-tone-1:"`


## Напоминание

- [Информация о напоминании](GET /tasks/{id})
- [Список напоминаний](GET /tasks)
- [Новое напоминание](POST /tasks)
- [Редактирование напоминания](PUT /tasks/{id})
- [Удаление напоминания](DELETE /tasks/{id})

Напоминание

- `id: integer, int32` (required) — Идентификатор напоминания. Пример: `22283`
- `kind: string` (required) — Тип
  Значения: `call` — Позвонить контакту, `meeting` — Встреча, `reminder` — Простое напоминание, `event` — Событие, `email` — Написать письмо
- `content: string` (required) — Описание. Пример: `"Забрать со склада 21 заказ"`
- `due_at: date-time` (required) — Срок выполнения напоминания (ISO-8601, UTC+0) в формате YYYY-MM-DDThh:mm:ss.sssZ. Пример: `"2020-06-05T09:00:00.000Z"`
- `priority: integer, int32` (required) — Приоритет. Пример: `2`
- `user_id: integer, int32` (required) — Идентификатор пользователя-создателя напоминания. Пример: `12`
- `chat_id: integer, int32` (required) — Идентификатор чата, к которому привязано напоминание. Пример: `334`
- `status: string` (required) — Статус напоминания
  Значения: `done` — Выполнено, `undone` — Активно
- `created_at: date-time` (required) — Дата и время создания напоминания (ISO-8601, UTC+0) в формате YYYY-MM-DDThh:mm:ss.sssZ. Пример: `"2020-06-04T10:37:57.000Z"`
- `performer_ids: array of integer` (required) — Массив идентификаторов пользователей, привязанных к напоминанию как «ответственные». Пример: `[12]`
- `all_day: boolean` (required) — Напоминание на весь день (без указания времени). Пример: `false`
- `custom_properties: array of object` (required) — Дополнительные поля напоминания
  - `id: integer, int32` (required) — Идентификатор поля. Пример: `1678`
  - `name: string` (required) — Название поля. Пример: `"Город"`
  - `data_type: string` (required) — Тип поля
    Значения: `string` — Строковое значение, `number` — Числовое значение, `date` — Дата, `link` — Ссылка
  - `value: string` (required) — Значение. Пример: `"Санкт-Петербург"`


## Представление

- [Открытие представления](POST /views/open)

Представление

- `type: string` (required) — Способ открытия представления. Пример: `"modal"`
  Значения: `modal` — Модальное окно
- `trigger_id: string` (required) — Уникальный идентификатор события (полученный, например, в исходящем вебхуке о нажатии кнопки). Пример: `"791a056b-006c-49dd-834b-c633fde52fe8"`
- `private_metadata: string` (max length: 3000) — Необязательная строка, которая будет отправлена в ваше приложение при отправке пользователем заполненной формы. Используйте это поле, например, для передачи в формате `JSON` какой то дополнительной информации вместе с заполненной пользователем формой.. Пример: `"{"timeoff_id":4378}"`
- `callback_id: string` (max length: 255) — Необязательный идентификатор для распознавания этого представления, который будет отправлен в ваше приложение при отправке пользователем заполненной формы. Используйте это поле, например, для понимания, какую форму должен был заполнить пользователь.. Пример: `"timeoff_reguest_form"`
- `view: object` (required) — Собранный объект представления
  - `title: string` (required, max length: 24) — Заголовок представления. Пример: `"Уведомление об отпуске"`
  - `close_text: string` (default: Отменить, max length: 24) — Текст кнопки закрытия представления. Пример: `"Закрыть"`
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
      - `multiline: boolean` — Многострочное поле
      - `initial_value: string` (max length: 3000) — Начальное значение в поле
      - `min_length: integer, int32` (min: 0, max: 3000) — Минимальная длина текста, который должен написать пользователь. Если пользователь напишет меньше, он получит ошибку.
      - `max_length: integer, int32` (min: 1, max: 3000) — Максимальная длина текста, который должен написать пользователь. Если пользователь напишет больше, он получит ошибку.
      - `required: boolean` — Обязательность
      - `hint: string` (max length: 2000) — Подсказка, которая отображается под полем серым цветом
    - **ViewBlockSelect**: Блок select — выпадающий список
      - `type: string` (required) — Тип блока
        Значения: `select` — Для выпадающего списка всегда select
      - `name: string` (required, max length: 255) — Название, которое будет передано в ваше приложение как ключ указанного пользователем выбора
      - `label: string` (required, max length: 150) — Подпись к выпадающему списку
      - `options: array of object` (max items: 100) — Массив доступных пунктов в выпадающем списке
        - `text: string` (required, max length: 75) — Отображаемый текст
        - `value: string` (required, max length: 150) — Уникальное строковое значение, которое будет передано в ваше приложение при выборе этого пункта
        - `description: string` (max length: 75) — Пояснение, которое будет указано серым цветом в этом пункте под отображаемым текстом
        - `selected: boolean` — Изначально выбранный пункт. Только один пункт может быть выбран.
      - `required: boolean` — Обязательность
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
      - `required: boolean` — Обязательность
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
      - `required: boolean` — Обязательность
      - `hint: string` (max length: 2000) — Подсказка, которая отображается под группой чекбоксов серым цветом
    - **ViewBlockDate**: Блок date — выбор даты
      - `type: string` (required) — Тип блока
        Значения: `date` — Для выбора даты всегда date
      - `name: string` (required, max length: 255) — Название, которое будет передано в ваше приложение как ключ указанного пользователем значения
      - `label: string` (required, max length: 150) — Подпись к полю
      - `initial_date: date` — Начальное значение в поле в формате YYYY-MM-DD
      - `required: boolean` — Обязательность
      - `hint: string` (max length: 2000) — Подсказка, которая отображается под полем серым цветом
    - **ViewBlockTime**: Блок time — выбор времени
      - `type: string` (required) — Тип блока
        Значения: `time` — Для выбора времени всегда time
      - `name: string` (required, max length: 255) — Название, которое будет передано в ваше приложение как ключ указанного пользователем значения
      - `label: string` (required, max length: 150) — Подпись к полю
      - `initial_time: string, time` — Начальное значение в поле в формате HH:mm
      - `required: boolean` — Обязательность
      - `hint: string` (max length: 2000) — Подсказка, которая отображается под полем серым цветом
    - **ViewBlockFileInput**: Блок file_input — загрузка файлов
      - `type: string` (required) — Тип блока
        Значения: `file_input` — Для загрузки файлов всегда file_input
      - `name: string` (required, max length: 255) — Название, которое будет передано в ваше приложение как ключ указанного пользователем значения
      - `label: string` (required, max length: 150) — Подпись к полю
      - `filetypes: array of string` — Массив допустимых расширений файлов, указанные в виде строк (например, ["png","jpg","gif"]). Если это поле не указано, все расширения файлов будут приняты.
      - `max_files: integer, int32` (default: 10, min: 1, max: 10) — Максимальное количество файлов, которое может загрузить пользователь в это поле.
      - `required: boolean` — Обязательность
      - `hint: string` (max length: 2000) — Подсказка, которая отображается под полем серым цветом


## Параметры бота

- [Редактирование бота](PUT /bots/{id})

Параметры бота

- `id: integer, int32` (required) — Идентификатор бота. Пример: `1738816`
- `webhook: object` (required) — Объект параметров вебхука
  - `outgoing_url: string` (required) — URL исходящего вебхука. Пример: `"https://www.website.com/tasks/new"`


## Событие исходящего вебхука

- [История событий](GET /webhooks/events)
- [Удаление события](DELETE /webhooks/events/{id})

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
    - `url: string` (required) — Прямая ссылка на сообщение. Пример: `"https://pachca.com/chats/1245817/messages/5678"`
    - `chat_id: integer, int32` (required) — Идентификатор чата, в котором находится сообщение. Пример: `9012`
    - `parent_message_id: integer, int32` — Идентификатор сообщения, к которому написан ответ. Пример: `3456`
    - `thread: object` — Объект с параметрами треда
      - `message_id: integer, int32` (required) — Идентификатор сообщения, к которому был создан тред. Пример: `12345`
      - `message_chat_id: integer, int32` (required) — Идентификатор чата сообщения, к которому был создан тред. Пример: `67890`
    - `webhook_timestamp: integer, int32` (required) — Дата и время отправки вебхука (UTC+0) в формате UNIX. Пример: `1747574400`
  - **ReactionWebhookPayload**: Структура исходящего вебхука о реакции
    - `type: string` (required) — Тип объекта. Пример: `"reaction"`
      Значения: `reaction` — Для реакций всегда reaction
    - `event: string` (required) — Тип события
      Значения: `new` — Создание, `delete` — Удаление
    - `message_id: integer, int32` (required) — Идентификатор сообщения, к которому относится реакция. Пример: `1245817`
    - `code: string` (required) — Emoji символ реакции. Пример: `"👍"`
    - `name: string` (required) — Название реакции. Пример: `"thumbsup"`
    - `user_id: integer, int32` (required) — Идентификатор пользователя, который добавил или удалил реакцию. Пример: `2345`
    - `created_at: date-time` (required) — Дата и время создания сообщения (ISO-8601, UTC+0) в формате YYYY-MM-DDThh:mm:ss.sssZ. Пример: `"2025-05-15T14:30:00.000Z"`
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
  - **ChatMemberWebhookPayload**: Структура исходящего вебхука об участниках чата
    - `type: string` (required) — Тип объекта. Пример: `"chat_member"`
      Значения: `chat_member` — Для участника чата всегда chat_member
    - `event: string` (required) — Тип события
      Значения: `add` — Добавление, `remove` — Удаление
    - `chat_id: integer, int32` (required) — Идентификатор чата, в котором изменился состав участников. Пример: `9012`
    - `thread_id: integer, int32` — Идентификатор треда. Пример: `5678`
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
    - `user_id: integer, int32` (required) — Идентификатор отправителя сообщения. Пример: `2345`
    - `created_at: date-time` (required) — Дата и время создания сообщения (ISO-8601, UTC+0) в формате YYYY-MM-DDThh:mm:ss.sssZ. Пример: `"2024-09-18T19:53:14.000Z"`
    - `webhook_timestamp: integer, int32` (required) — Дата и время отправки вебхука (UTC+0) в формате UNIX. Пример: `1726685594`
- `created_at: date-time` (required) — Дата и время создания события (ISO-8601, UTC+0) в формате YYYY-MM-DDThh:mm:ss.sssZ. Пример: `"2025-05-15T14:30:00.000Z"`


## Событие аудита

- [Журнал аудита событий](GET /audit_events)

Событие аудита

- `id: string` (required) — Уникальный идентификатор события. Пример: `"a1b2c3d4-5e6f-7g8h-9i10-j11k12l13m14"`
- `created_at: date-time` (required) — Дата и время создания события (ISO-8601, UTC+0) в формате YYYY-MM-DDThh:mm:ss.sssZ. Пример: `"2025-05-15T14:30:00.000Z"`
- `event_key: string` (required) — Ключ типа события
  Значения: `user_login` — Пользователь успешно вошел в систему, `user_logout` — Пользователь вышел из системы, `user_2fa_fail` — Неудачная попытка двухфакторной аутентификации, `user_2fa_success` — Успешная двухфакторная аутентификация, `user_created` — Создана новая учетная запись пользователя, `user_deleted` — Учетная запись пользователя удалена, `user_role_changed` — Роль пользователя была изменена, `user_updated` — Данные пользователя обновлены, `tag_created` — Создан новый тег, `tag_deleted` — Тег удален, `user_added_to_tag` — Пользователь добавлен в тег, `user_removed_from_tag` — Пользователь удален из тега, `chat_created` — Создан новый чат, `chat_renamed` — Чат переименован, `chat_permission_changed` — Изменены права доступа к чату, `user_chat_join` — Пользователь присоединился к чату, `user_chat_leave` — Пользователь покинул чат, `tag_added_to_chat` — Тег добавлен в чат, `tag_removed_from_chat` — Тег удален из чата, `message_updated` — Сообщение отредактировано, `message_deleted` — Сообщение удалено, `message_created` — Сообщение создано, `reaction_created` — Реакция добавлена, `reaction_deleted` — Реакция удалена, `thread_created` — Тред создан, `access_token_created` — Создан новый токен доступа, `access_token_updated` — Токен доступа обновлен, `access_token_destroy` — Токен доступа удален, `kms_encrypt` — Данные зашифрованы, `kms_decrypt` — Данные расшифрованы, `audit_events_accessed` — Доступ к журналам аудита получен, `dlp_violation_detected` — Срабатывание правила DLP-системы, `search_users_api` — Поиск сотрудников через API, `search_chats_api` — Поиск чатов через API, `search_messages_api` — Поиск сообщений через API
- `entity_id: string` (required) — Идентификатор затронутой сущности. Пример: `"98765"`
- `entity_type: string` (required) — Тип затронутой сущности. Пример: `"User"`
- `actor_id: string` (required) — Идентификатор пользователя, выполнившего действие. Пример: `"98765"`
- `actor_type: string` (required) — Тип актора. Пример: `"User"`
- `details: anyOf` (required) — Дополнительные детали события. Структура зависит от значения event_key — см. описания значений поля event_key. Для событий без деталей возвращается пустой объект
  **Возможные варианты:**

  - **AuditDetailsEmpty**: Пустые детали. При: user_login, user_logout, user_2fa_fail, user_2fa_success, user_created, user_deleted, chat_created, message_created, message_updated, message_deleted, reaction_created, reaction_deleted, thread_created, audit_events_accessed
  - **AuditDetailsUserUpdated**: При: user_updated
    - `changed_attrs: array of string` (required) — Список изменённых полей
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
    - `action_message: string` (required) — Описание действия
    - `conditions_matched: boolean` (required) — Результат проверки условий правила (true — условия сработали)
  - **AuditDetailsSearch**: При: search_users_api, search_chats_api, search_messages_api
    - `search_type: string` (required) — Тип поиска
    - `query_present: boolean` (required) — Указан ли поисковый запрос
    - `cursor_present: boolean` (required) — Использован ли курсор
    - `limit: integer, int32` (required) — Количество возвращённых результатов
    - `filters: Record<string, object>` (required) — Применённые фильтры. Возможные ключи зависят от типа поиска: order, sort, created_from, created_to, company_roles (users), active, chat_subtype, personal (chats), chat_ids, user_ids (messages)
      **Структура значений Record:**
      - Тип значения: `any`
- `ip_address: string` (required) — IP-адрес, с которого было выполнено действие. Пример: `"192.168.1.100"`
- `user_agent: string` (required) — User agent клиента. Пример: `"Pachca/3.60.0 (co.staply.pachca; build:15; iOS 18.5.0) Alamofire/5.0.0"`

