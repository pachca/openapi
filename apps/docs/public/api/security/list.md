> Расположение: Методы API → Безопасность
> Краткое содержание: Метод доступен владельцу пространства на тарифе «Корпорация», остальным сотрудникам он отвечает 403
> Это Markdown-версия конкретной страницы. Для контекста за её пределами (правила API, полный перечень методов, авторизация) ОБЯЗАТЕЛЬНО открой [llms.txt](https://dev.pachca.com/llms.txt) перед ответом — это сэкономит токены и предотвратит неполный ответ.

# Журнал аудита событий

**Метод**: `GET`

**Путь**: `/audit_events`

> **Скоуп:** `audit_events:read`

> **Внимание:** Доступно только на тарифе **Корпорация**

Что происходило в пространстве: входы и выходы, изменения ролей и настроек, действия с чатами, сотрудниками и ботами. Записи только читаются — изменить или удалить их нельзя ни через API, ни из интерфейса.

Метод доступен владельцу пространства на тарифе «Корпорация», остальным сотрудникам он отвечает `403`. Само обращение к журналу тоже записывается в журнал — событием `audit_events_accessed`.

События приходят от новых к старым и отбираются фильтрами: период по `start_time` и `end_time`, вид события по `event_key`, инициатор по `actor_id` и `actor_type`. Без фильтров метод отдаёт все события пространства постранично.

## Параметры

### Query параметры

- `start_time: date-time` — Начальная метка времени, включительно (ISO-8601). Смещение вида `+03:00` учитывается, время без смещения считается UTC. Значение, которое не удалось разобрать, фильтр снимает — ответ придёт полным, без ошибки.
- `end_time: date-time` — Конечная метка времени, включительно (ISO-8601). Смещение вида `+03:00` учитывается, время без смещения считается UTC. Значение, которое не удалось разобрать, фильтр снимает — ответ придёт полным, без ошибки.
- `event_key: string` — Фильтр по конкретному типу события
  Значения: `user_login`, `user_logout`, `user_2fa_fail`, `user_2fa_success`, `user_2fa_disabled`, `login_grant_created`, `login_grant_approved`, `login_grant_denied`, `user_created`, `user_deleted`, `user_role_changed`, `user_updated`, `tag_created`, `tag_deleted`, `user_added_to_tag`, `user_removed_from_tag`, `chat_created`, `chat_renamed`, `chat_permission_changed`, `user_chat_join`, `user_chat_leave`, `tag_added_to_chat`, `tag_removed_from_chat`, `message_updated`, `message_deleted`, `message_created`, `reaction_created`, `reaction_deleted`, `thread_created`, `access_token_created`, `access_token_updated`, `access_token_destroy`, `kms_encrypt`, `kms_decrypt`, `audit_events_accessed`, `company_chats_accessed`, `company_bots_accessed`, `dlp_violation_detected`, `search_users_api`, `search_chats_api`, `search_messages_api`, `bot_scopes_updated`, `bot_webhook_settings_updated`, `bot_token_recreated`, `bot_deleted`, `bot_oauth_client_updated`, `bot_oauth_client_disabled`, `bot_oauth_client_secret_rotated`, `bot_oauth_client_secret_issued`, `bot_token_created`, `bot_token_updated`, `bot_token_reissued`, `bot_token_deleted`, `oauth_authorization_granted`, `oauth_authorization_revoked`, `oauth_token_revoked`, `oauth_device_authorization_approved`, `oauth_device_authorization_denied`, `video_call_started`, `video_call_finished`, `video_call_recording_ready`, `exchange_disabled`
- `actor_id: string` — Идентификатор пользователя, выполнившего действие
- `actor_type: string` — Тип актора
- `entity_id: string` — Идентификатор затронутой сущности
- `entity_type: string` — Тип сущности
- `limit: integer, int32` (default: 50) — Количество записей для возврата. Целое число вне допустимых значений заменяется ближайшей границей.
- `cursor: string` — Курсор для пагинации (из `meta.paginate.next_page` или `meta.paginate.prev_page`)


## Пример запроса

```bash
# Для получения следующей страницы используйте cursor из meta.paginate.next_page
curl "https://api.pachca.com/api/shared/v1/audit_events?start_time=2025-05-01T09:11:00.000Z&end_time=2025-05-02T09:11:00.000Z&event_key=user_login&actor_id=98765&actor_type=User&entity_id=98765&entity_type=User&limit=1" \
  -H "Authorization: Bearer YOUR_ACCESS_TOKEN"
```

## Ответы

### 200: The request has succeeded.

**Схема ответа:**

- `data: array of object` (required)
  - `id: string` (required) — Уникальный идентификатор события. Пример: `"a1b2c3d4-5e6f-7g8h-9i10-j11k12l13m14"`
  - `created_at: date-time` (required) — Дата и время создания события (ISO-8601, UTC+0) в формате YYYY-MM-DDThh:mm:ss.sssZ. Пример: `"2025-05-15T14:30:00.000Z"`
  - `event_key: string` (required) — Ключ типа события
    Значения: `user_login` — Пользователь успешно вошел в систему, `user_logout` — Пользователь вышел из системы, `user_2fa_fail` — Неудачная попытка двухфакторной аутентификации, `user_2fa_success` — Успешная двухфакторная аутентификация, `user_2fa_disabled` — Двухфакторная аутентификация отключена у сотрудника, `login_grant_created` — Создан QR-код для входа в мобильное приложение, `login_grant_approved` — Сотрудник подтвердил вход по QR-коду, `login_grant_denied` — Вход по QR-коду отклонён, `user_created` — Создана новая учетная запись пользователя, `user_deleted` — Учетная запись пользователя удалена, `user_role_changed` — Роль пользователя была изменена, `user_updated` — Данные пользователя обновлены, `tag_created` — Создан новый тег, `tag_deleted` — Тег удален, `user_added_to_tag` — Пользователь добавлен в тег, `user_removed_from_tag` — Пользователь удален из тега, `chat_created` — Создан новый чат, `chat_renamed` — Чат переименован, `chat_permission_changed` — Изменены права доступа к чату, `user_chat_join` — Пользователь присоединился к чату, `user_chat_leave` — Пользователь покинул чат, `tag_added_to_chat` — Тег добавлен в чат, `tag_removed_from_chat` — Тег удален из чата, `message_updated` — Сообщение отредактировано, `message_deleted` — Сообщение удалено, `message_created` — Сообщение создано, `reaction_created` — Реакция добавлена, `reaction_deleted` — Реакция удалена, `thread_created` — Тред создан, `access_token_created` — Создан новый токен доступа, `access_token_updated` — Токен доступа обновлен, `access_token_destroy` — Токен доступа удален, `kms_encrypt` — Данные зашифрованы, `kms_decrypt` — Данные расшифрованы, `audit_events_accessed` — Доступ к журналам аудита получен, `company_chats_accessed` — Получен список всех чатов пространства, `company_bots_accessed` — Получен список всех ботов пространства, `dlp_violation_detected` — Срабатывание правила DLP-системы, `search_users_api` — Поиск сотрудников через API, `search_chats_api` — Поиск чатов через API, `search_messages_api` — Поиск сообщений через API, `bot_scopes_updated` — Изменены скоупы токена бота, `bot_webhook_settings_updated` — Изменены настройки исходящего вебхука бота, `bot_token_recreated` — Токен бота перевыпущен (ротация), `bot_deleted` — Бот удалён, `bot_oauth_client_updated` — Изменены параметры OAuth-клиента бота, `bot_oauth_client_disabled` — У бота выключена авторизация от имени сотрудника, `bot_oauth_client_secret_rotated` — Обновлён секрет OAuth-клиента бота, `bot_oauth_client_secret_issued` — Выпущен секрет OAuth-клиента бота, `bot_token_created` — Выпущен токен бота, `bot_token_updated` — Изменены имя или скоупы токена бота, `bot_token_reissued` — Отдельный токен бота перевыпущен, `bot_token_deleted` — Токен бота удалён, `oauth_authorization_granted` — Пользователь выдал OAuth-клиенту доступ к своим данным, `oauth_authorization_revoked` — Доступ OAuth-клиента к данным пользователя отозван, `oauth_token_revoked` — OAuth-клиент отозвал выданный ему токен, `oauth_device_authorization_approved` — Сотрудник подтвердил вход приложения с устройства, `oauth_device_authorization_denied` — Сотрудник отклонил вход приложения с устройства, `video_call_started` — Видеозвонок начат, `video_call_finished` — Видеозвонок завершён, `video_call_recording_ready` — Запись видеозвонка готова, `exchange_disabled` — Отключена интеграция с Exchange
  - `entity_id: string` (required) — Идентификатор затронутой сущности. Пример: `"98765"`
  - `entity_type: string` (required) — Тип затронутой сущности. Пример: `"User"`
  - `actor_id: string` (required) — Идентификатор пользователя, выполнившего действие. Пример: `"98765"`
  - `actor_type: string` (required) — Тип актора. Пример: `"User"`
  - `details: anyOf` (required) — Дополнительные детали события. Структура зависит от значения event_key — см. описания значений поля event_key. Для событий без деталей возвращается пустой объект.
    **Возможные варианты:**

    - **AuditDetailsEmpty**: Пустые детали. При: user_login (кроме входа по QR-коду), user_logout, user_2fa_fail, user_2fa_success, user_2fa_disabled, user_created, user_deleted, chat_created, message_created, message_updated, message_deleted, reaction_created, reaction_deleted, thread_created, audit_events_accessed, company_chats_accessed, company_bots_accessed, exchange_disabled.
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
    - **AuditDetailsTokenScopes**: При: access_token_created, access_token_updated, access_token_destroy в записях до 7 октября 2026 года
      - `scopes: array of string` (required) — Скоупы токена
    - **AuditDetailsKms**: При: kms_encrypt, kms_decrypt
      - `chat_id: integer, int32` (required) — Идентификатор чата
      - `message_id: integer, int32` (required) — Идентификатор сообщения
      - `reason: string` (required) — Причина операции: `message_create` — шифрование текста сообщения, `message_store_for_search` — сохранение текста для поиска, `file_upload` — загрузка файла (все три у kms_encrypt), `file_download` — скачивание файла (у kms_decrypt)
    - **AuditDetailsDlp**: При: dlp_violation_detected
      - `dlp_rule_id: string` (required) — Идентификатор правила DLP: строка из названия правила, например `pasport-rf`. При переименовании правила не меняется.
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
      - `limit: integer, int32` (required, nullable) — Запрошенный размер страницы. `null`, если параметр `limit` не передан. В записях до 16 октября 2026 года вместо `null` приходит `0`.
      - `filters: Record<string, object>` (required) — Применённые фильтры. Возможные ключи зависят от типа поиска: order, sort, created_from, created_to, company_roles (users), active (chats и messages), chat_subtype, personal (chats), chat_ids, user_ids, include_root_chat_id (messages, всегда `true`).
        **Структура значений Record:**
        - Тип значения: `any`
    - **AuditDetailsBot**: При: bot_deleted, а также bot_token_recreated, bot_token_created, bot_token_updated, bot_token_reissued в записях до 7 октября 2026 года
      - `bot_id: integer, int32` (required) — Идентификатор бота
      - `actor_id: integer, int32` (required, nullable) — Идентификатор пользователя, выполнившего действие. `null`, если действие выполнено без инициатора.
      - `webhook_id: integer, int32` — Идентификатор вебхука бота
      - `application_id: integer, int32` (nullable) — Идентификатор приложения бота. `null`, если приложения у бота нет.
      - `access_token_id: integer, int32` — Идентификатор токена. Есть у bot_token_created, bot_token_reissued и bot_token_updated.
      - `access_token_preview: string` (nullable) — Токен в маскированном виде: первые и последние символы. Есть у событий токенов бота, `null`, если значение недоступно.
      - `scopes: array of string` — Скоупы токена. Есть у bot_token_created.
      - `name: object` — Смена названия токена у bot_token_updated. Есть, если название передали в запросе.
        - `previous: string` (required, nullable) — Прежнее название. `null`, если названия не было.
        - `new: string` (required, nullable) — Новое название. `null`, если название убрали.
    - **AuditDetailsBotScopes**: При: bot_scopes_updated
      - `bot_id: integer, int32` (required) — Идентификатор бота
      - `actor_id: integer, int32` (required, nullable) — Идентификатор пользователя, выполнившего действие. `null`, если действие выполнено без инициатора.
      - `added_scopes: array of string` (required) — Скоупы, добавленные токену бота
      - `removed_scopes: array of string` (required) — Скоупы, отозванные у токена бота
      - `bot_name: string` — Имя бота. Нет в записях до 7 октября 2026 года.
      - `webhook_id: integer, int32` (required) — Идентификатор вебхука бота
      - `previous_scopes: array of string` (required) — Скоупы токена бота до изменения
      - `new_scopes: array of string` (required) — Скоупы токена бота после изменения
    - **AuditDetailsBotWebhookSettings**: При: bot_webhook_settings_updated
      - `bot_id: integer, int32` (required) — Идентификатор бота
      - `actor_id: integer, int32` (required, nullable) — Идентификатор пользователя, выполнившего действие. `null`, если действие выполнено без инициатора.
      - `changes: Record<string, object>` (required) — Изменённые настройки вебхука. Ключ — имя настройки (outgoing_url, ignore_self_messages, events_history_enabled, can_edit, who_can_add), значение — объект с полями previous (прежнее значение) и new (новое значение).
        **Структура значений Record:**
        - Тип значения: `any`
      - `bot_name: string` — Имя бота
      - `webhook_id: integer, int32` — Идентификатор вебхука бота
      - `access_token_id: integer, int32` (nullable) — Идентификатор токена, которым изменили настройки. `null`, если их изменили в интерфейсе Пачки.
      - `access_token_preview: string` (nullable) — Токен, которым изменили настройки, в маскированном виде. `null`, если их изменили в интерфейсе Пачки.
      - `application_id: integer, int32` (nullable) — Идентификатор приложения токена, которым изменили настройки. `null`, если их изменили в интерфейсе Пачки.
    - **AuditDetailsBotOAuthClient**: При: bot_oauth_client_updated
      - `bot_id: integer, int32` (required) — Идентификатор бота
      - `actor_id: integer, int32` (required, nullable) — Идентификатор пользователя, выполнившего действие. `null`, если действие выполнено без инициатора.
      - `client_id: string` (required) — Идентификатор OAuth-клиента бота
      - `changes: Record<string, object>` (required) — Изменённые параметры клиента. Ключ — имя параметра (confidential, redirect_uris, scopes), значение — объект с полями previous (прежнее значение) и new (новое значение).
        **Структура значений Record:**
        - Тип значения: `any`
      - `application_id: integer, int32` — Идентификатор приложения бота
      - `application_name: string` — Название приложения бота
      - `bot_name: string` — Имя бота
      - `webhook_id: integer, int32` — Идентификатор вебхука бота
      - `scopes: array of string` — Права, которые бот запрашивает у сотрудника на экране согласия
      - `access_token_id: integer, int32` (nullable) — Идентификатор токена, которым выполнено действие. `null`, если действие выполнено в интерфейсе Пачки.
      - `access_token_preview: string` (nullable) — Токен, которым выполнено действие, в маскированном виде. `null`, если действие выполнено в интерфейсе Пачки.
    - **AuditDetailsOAuthAuthorizationGranted**: При: oauth_authorization_granted
      - `client_id: string` (required, nullable) — Идентификатор OAuth-клиента, которому выдан доступ. `null` в записях до 7 октября 2026 года о доступе, выданном боту.
      - `scopes: array of string` (required) — Скоупы, на которые выдан доступ
      - `application_id: integer, int32` (required) — Идентификатор приложения, которому выдан доступ
      - `application_name: string` — Название приложения. Нет в записях до 7 октября 2026 года.
      - `bot_id: integer, int32` — Идентификатор бота. Есть, когда доступ выдан боту.
      - `bot_name: string` — Имя бота. Есть вместе с `bot_id`.
      - `authorization_grant_id: integer, int32` (required) — Идентификатор выданного кода авторизации
    - **AuditDetailsOAuthAuthorizationRevoked**: При: oauth_authorization_revoked
      - `client_id: string` (required) — Идентификатор OAuth-клиента, у которого отозван доступ
      - `revoked_tokens_count: integer, int32` (required) — Количество отозванных токенов
      - `user_id: integer, int32` — Идентификатор сотрудника, чей доступ отозван. Есть, когда доступ отозвал администратор.
      - `application_id: integer, int32` (required) — Идентификатор приложения, у которого отозван доступ
      - `application_name: string` — Название приложения. Нет в записях до 7 октября 2026 года.
      - `bot_id: integer, int32` — Идентификатор бота. Есть, когда доступ отозван у бота.
      - `bot_name: string` — Имя бота. Есть вместе с `bot_id`.
    - **AuditDetailsDeviceAuthorizationApproved**: При: oauth_device_authorization_approved
      - `client_id: string` (required) — Идентификатор OAuth-клиента, которому разрешён вход
      - `scopes: array of string` (required) — Скоупы, на которые согласился сотрудник
      - `device_name: string` (nullable) — Имя устройства, с которого выполняется вход. `null`, если приложение его не передало.
      - `application_id: integer, int32` (required) — Идентификатор приложения, которому разрешён вход
      - `application_name: string` — Название приложения. Нет в записях до 7 октября 2026 года.
      - `device_grant_id: integer, int32` (required) — Идентификатор запроса на вход
      - `token_kind: string` — Вид токена: `cli` — вход в CLI. Нет в записях до 7 октября 2026 года.
    - **AuditDetailsDeviceAuthorizationDenied**: При: oauth_device_authorization_denied
      - `client_id: string` (required) — Идентификатор OAuth-клиента, которому отказано во входе
      - `scopes: array of string` (required) — Скоупы, которые клиент запрашивал
      - `device_name: string` (nullable) — Имя устройства, с которого выполнялся вход. `null`, если приложение его не передало.
      - `application_id: integer, int32` (nullable) — Идентификатор приложения. При отказе во входе в CLI приходит `null`: приложение назначается входу только после подтверждения.
      - `device_grant_id: integer, int32` (required) — Идентификатор запроса на вход
      - `token_kind: string` — Вид токена: `cli` — вход в CLI. Нет в записях до 7 октября 2026 года.
    - **AuditDetailsVideoCallStarted**: При: video_call_started
      - `chat_id: integer, int32` (required) — Идентификатор чата, в котором проходит видеозвонок
      - `started_message_id: integer, int32` (required, nullable) — Идентификатор сообщения о начале звонка. `null`, если такого сообщения нет.
    - **AuditDetailsVideoCallFinished**: При: video_call_finished
      - `chat_id: integer, int32` (required) — Идентификатор чата, в котором проходил видеозвонок
      - `started_message_id: integer, int32` (required, nullable) — Идентификатор сообщения о начале звонка. `null`, если такого сообщения нет.
      - `duration: integer, int32` (required, nullable) — Длительность звонка в секундах. `null`, если звонок завершился, так и не начавшись.
      - `max_members_count: integer, int32` (required) — Максимальное число одновременных участников за время звонка
    - **AuditDetailsVideoCallRecording**: При: video_call_recording_ready
      - `chat_id: integer, int32` (required) — Идентификатор чата, в котором проходил видеозвонок
      - `started_message_id: integer, int32` (required, nullable) — Идентификатор сообщения о начале звонка. `null`, если такого сообщения нет.
      - `recording_id: integer, int32` (required) — Идентификатор записи
      - `file_id: integer, int32` (required) — Идентификатор файла записи
      - `duration: integer, int32` (required) — Длительность записи в секундах
      - `size: integer, int64` (required) — Размер файла записи в байтах
    - **AuditDetailsBotOAuthClientSecretRotated**: При: bot_oauth_client_secret_rotated, bot_oauth_client_secret_issued
      - `bot_id: integer, int32` (required) — Идентификатор бота
      - `actor_id: integer, int32` (required, nullable) — Идентификатор пользователя, выполнившего действие. `null`, если действие выполнено без инициатора.
      - `client_id: string` (required) — Идентификатор OAuth-клиента бота
      - `application_id: integer, int32` — Идентификатор приложения бота
      - `application_name: string` — Название приложения бота
      - `bot_name: string` — Имя бота
      - `webhook_id: integer, int32` — Идентификатор вебхука бота
      - `scopes: array of string` — Права, которые бот запрашивает у сотрудника на экране согласия. Есть у bot_oauth_client_secret_issued.
      - `access_token_id: integer, int32` (nullable) — Идентификатор токена, которым выполнено действие. `null`, если действие выполнено в интерфейсе Пачки. Есть у bot_oauth_client_secret_issued.
      - `access_token_preview: string` (nullable) — Токен, которым выполнено действие, в маскированном виде. `null`, если действие выполнено в интерфейсе Пачки. Есть у bot_oauth_client_secret_issued.
    - **AuditDetailsBotOAuthClientDisabled**: При: bot_oauth_client_disabled
      - `bot_id: integer, int32` (required) — Идентификатор бота
      - `actor_id: integer, int32` (required, nullable) — Идентификатор пользователя, выполнившего действие. `null`, если действие выполнено без инициатора.
      - `client_id: string` (required) — Идентификатор OAuth-клиента бота
      - `deleted_access_tokens_count: integer, int32` (required) — Сколько токенов сотрудников отозвано
      - `deleted_access_grants_count: integer, int32` (required) — Сколько неиспользованных кодов авторизации отозвано
      - `application_id: integer, int32` — Идентификатор приложения бота
      - `application_name: string` — Название приложения бота
      - `bot_name: string` — Имя бота
      - `webhook_id: integer, int32` — Идентификатор вебхука бота
      - `scopes: array of string` — Права, которые бот запрашивает у сотрудника на экране согласия
      - `access_token_id: integer, int32` (nullable) — Идентификатор токена, которым выполнено действие. `null`, если действие выполнено в интерфейсе Пачки.
      - `access_token_preview: string` (nullable) — Токен, которым выполнено действие, в маскированном виде. `null`, если действие выполнено в интерфейсе Пачки.
    - **AuditDetailsToken**: При: access_token_created, access_token_updated, access_token_destroy, bot_token_created, bot_token_reissued, bot_token_recreated, bot_token_deleted, oauth_token_revoked
      - `token_kind: string` (required) — Вид токена: `personal` — персональный токен, `cli` — вход в CLI, `bot` — токен бота, `oauth` — токен, который сотрудник выдал боту на экране согласия, `client` — токен внешнего приложения, которому сотрудник выдал доступ
      - `token_name: string` (required, nullable) — Название токена, у входа в CLI — имя устройства. `null`, если названия нет.
      - `resource_owner_id: integer, int32` (required) — Идентификатор владельца токена: сотрудника, а у токена бота — самого бота
      - `scopes: array of string` (required) — Скоупы токена
      - `access_token_id: integer, int32` (required) — Идентификатор токена
      - `access_token_preview: string` (required, nullable) — Токен в маскированном виде: первые и последние символы. `null`, если значение недоступно.
      - `application_id: integer, int32` — Идентификатор приложения, которому принадлежит токен
      - `application_name: string` — Название приложения, которому принадлежит токен
      - `client_id: string` — Идентификатор OAuth-клиента приложения
      - `bot_id: integer, int32` — Идентификатор бота. Есть у токенов бота и у токенов, которые сотрудник выдал боту.
      - `bot_name: string` — Имя бота. Есть вместе с `bot_id`.
      - `device_name: string` (nullable) — Имя устройства. Есть у входа в CLI, `null`, если имени нет.
      - `actor_id: integer, int32` (nullable) — Идентификатор пользователя, выполнившего действие. Есть у событий токенов бота, `null`, если действие выполнено без инициатора.
      - `webhook_id: integer, int32` — Идентификатор вебхука бота. Есть у событий токенов бота.
      - `user_id: integer, int32` — Идентификатор сотрудника, чей токен отозван. Есть, когда токен отозвал администратор или сотрудника перевели в гости.
      - `source: string` — Источник отзыва: `oauth_client` — приложение само отозвало токен. Есть только у oauth_token_revoked.
      - `reason: string` — Причина отзыва. `guest_downgrade` — токен отозван автоматически, когда сотрудника перевели в гости. Есть только в таких записях.
    - **AuditDetailsBotTokenUpdated**: При: bot_token_updated
      - `token_kind: string` (required) — Вид токена: `bot`
      - `token_name: string` (required, nullable) — Название токена после изменения. `null`, если названия нет.
      - `resource_owner_id: integer, int32` (required) — Идентификатор владельца токена — бота
      - `current_scopes: array of string` (required) — Скоупы токена после изменения
      - `bot_id: integer, int32` — Идентификатор бота
      - `actor_id: integer, int32` (required, nullable) — Идентификатор пользователя, выполнившего действие. `null`, если действие выполнено без инициатора.
      - `access_token_id: integer, int32` (required) — Идентификатор токена
      - `access_token_preview: string` (required, nullable) — Токен в маскированном виде: первые и последние символы. `null`, если значение недоступно.
      - `application_id: integer, int32` — Идентификатор приложения бота
      - `application_name: string` — Название приложения бота
      - `client_id: string` — Идентификатор OAuth-клиента бота
      - `bot_name: string` — Имя бота
      - `webhook_id: integer, int32` (required) — Идентификатор вебхука бота
      - `name: object` — Смена названия токена. Есть, если название передали в запросе.
        - `previous: string` (required, nullable) — Прежнее название. `null`, если названия не было.
        - `new: string` (required, nullable) — Новое название. `null`, если название убрали.
    - **AuditDetailsUserLoginQr**: При: user_login, если вход был по QR-коду
      - `method: string` (required) — Способ входа: `qr` — вход по QR-коду
      - `login_grant_id: string` (required) — Идентификатор запроса на вход по QR-коду, общий для всех событий одного входа
    - **AuditDetailsLoginGrantCreated**: При: login_grant_created
      - `login_grant_id: string` (required) — Идентификатор запроса на вход по QR-коду, общий для всех событий одного входа
    - **AuditDetailsLoginGrantApproved**: При: login_grant_approved
      - `login_grant_id: string` (required) — Идентификатор запроса на вход по QR-коду, общий для всех событий одного входа
      - `device: object` (required) — Устройство, на котором выполнялся вход
        - `name: string` (required, max length: 255) — Название устройства
        - `platform: string` (required) — Платформа приложения
          Значения: `iOS` — Приложение для iOS, `Android` — Приложение для Android, `Rustore` — Приложение для Android из RuStore, `Appgallery` — Приложение для Android из AppGallery
        - `os_version: string` (max length: 255) — Версия операционной системы. Есть, если приложение её передало.
        - `app_version: string` (max length: 255) — Версия приложения Пачки. Есть, если приложение её передало.
    - **AuditDetailsLoginGrantDenied**: При: login_grant_denied
      - `login_grant_id: string` (required) — Идентификатор запроса на вход по QR-коду, общий для всех событий одного входа
      - `device: object` (required) — Устройство, на котором выполнялся вход
        - `name: string` (required, max length: 255) — Название устройства
        - `platform: string` (required) — Платформа приложения
          Значения: `iOS` — Приложение для iOS, `Android` — Приложение для Android, `Rustore` — Приложение для Android из RuStore, `Appgallery` — Приложение для Android из AppGallery
        - `os_version: string` (max length: 255) — Версия операционной системы. Есть, если приложение её передало.
        - `app_version: string` (max length: 255) — Версия приложения Пачки. Есть, если приложение её передало.
      - `reason: string` (required) — Причина отказа
        Значения: `denied` — Сотрудник отклонил вход, `verification_failed` — Сотрудник ввёл не те цифры, что показало устройство
  - `ip_address: string` (required, nullable) — IP-адрес, с которого было выполнено действие. `null` у событий, записанных без запроса пользователя. Пример: `"192.168.1.100"`
  - `user_agent: string` (required, nullable) — User agent клиента, обрезается до 255 символов. `null` у событий, записанных без запроса пользователя. Пример: `"Pachca/3.60.0 (build:15; iOS 18.5.0) Alamofire/5.0.0"`
- `meta: object` (required) — Метаданные пагинации
  - `paginate: object` (required) — Вспомогательная информация
    - `next_page: string` (required) — Курсор пагинации следующей страницы. Пример: `"eyJxZCO2MiwiZGlyIjomSNYjIn3"`
    - `prev_page: string` — Курсор пагинации предыдущей страницы. Используется для polling новых записей «сверху» списка. Пример: `"eyJxZCO2MiwiZGlyIjoiYXNjIn0"`
    - `has_next: boolean` — Есть ли ещё данные на следующей странице. На последней странице — `false`. Пример: `true`
    - `has_prev: boolean` — Есть ли ещё данные на предыдущей странице. На первом запросе без курсора — `false`. Пример: `false`

**Пример ответа:**

```json
{
  "data": [
    {
      "id": "a1b2c3d4-5e6f-7g8h-9i10-j11k12l13m14",
      "created_at": "2025-05-15T14:30:00.000Z",
      "event_key": "user_login",
      "entity_id": "98765",
      "entity_type": "User",
      "actor_id": "98765",
      "actor_type": "User",
      "details": null,
      "ip_address": "192.168.1.100",
      "user_agent": "Pachca/3.60.0 (build:15; iOS 18.5.0) Alamofire/5.0.0"
    }
  ],
  "meta": {
    "paginate": {
      "next_page": "eyJxZCO2MiwiZGlyIjomSNYjIn3",
      "prev_page": "eyJxZCO2MiwiZGlyIjoiYXNjIn0",
      "has_next": true,
      "has_prev": false
    }
  }
}
```

### 400: The server could not understand the request due to invalid syntax.

**Схема ответа при ошибке:** `ApiError`. Поля и коды описаны в разделе [Ошибки](/api/errors).

**Пример ответа:**

```json
{
  "errors": [
    {
      "key": "field.name",
      "value": "invalid_value",
      "message": "Поле не может быть пустым",
      "code": "blank",
      "payload": null
    }
  ]
}
```

### 401: Access is unauthorized.

**Схема ответа при ошибке:** `OAuthError`. Поля и коды описаны в разделе [Ошибки](/api/errors).

**Пример ответа:**

```json
{
  "error": "invalid_token",
  "error_description": "Access token is missing"
}
```

### 402: Client error

**Схема ответа при ошибке:** `ApiError`. Поля и коды описаны в разделе [Ошибки](/api/errors).

**Пример ответа:**

```json
{
  "errors": [
    {
      "key": "field.name",
      "value": "invalid_value",
      "message": "Поле не может быть пустым",
      "code": "blank",
      "payload": null
    }
  ]
}
```

### 403: Access is forbidden.

**Схема ответа при ошибке:** `ApiError` или `OAuthError`. Поля и коды описаны в разделе [Ошибки](/api/errors).

**Пример ответа:**

```json
{
  "errors": [
    {
      "key": "field.name",
      "value": "invalid_value",
      "message": "Поле не может быть пустым",
      "code": "blank",
      "payload": null
    }
  ]
}
```

### 422: Client error

**Схема ответа при ошибке:** `ApiError`. Поля и коды описаны в разделе [Ошибки](/api/errors).

**Пример ответа:**

```json
{
  "errors": [
    {
      "key": "field.name",
      "value": "invalid_value",
      "message": "Поле не может быть пустым",
      "code": "blank",
      "payload": null
    }
  ]
}
```

