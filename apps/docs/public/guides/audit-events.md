> Краткое содержание: Журнал аудита событий Пачки для команд безопасности: структура записи, типы событий и состав деталей, фильтры и пагинация, хранение. Тариф «Корпорация»
> Это Markdown-версия конкретной страницы. Для контекста за её пределами (правила API, полный перечень методов, авторизация) ОБЯЗАТЕЛЬНО открой [llms.txt](https://dev.pachca.com/llms.txt) перед ответом — это сэкономит токены и предотвратит неполный ответ.


# Журнал аудита событий

> **Внимание:** Доступно только на тарифе **Корпорация**. Токену нужен скоуп `audit_events:read`, который доступен только владельцу пространства.


Журнал аудита отдаёт командам безопасности лог действий в пространстве: кто, что и когда сделал, с какого адреса и с какого клиента. По нему расследуют инциденты, отслеживают изменения прав и собирают отчётность для регуляторов.

Записи возвращает метод [Журнал аудита событий](/api/security/list). Журнал доступен только на чтение, изменить или удалить запись нельзя.

## Что попадает в журнал

- События записываются только для пространств на тарифе **Корпорация**. Пока тариф не подключён, журнал не наполняется, и после подключения прошлые действия в нём не появятся.
- У каждого события есть актор — сотрудник или бот, выполнивший действие. Действия без актора в журнал не попадают.
- Данные собираются с 12 мая 2025 года.
- Чтение самого журнала тоже событие: каждый запрос к методу пишет `audit_events_accessed`.
- Так же логируется инвентаризация пространства: [Список чатов пространства](/api/chats/list-company) пишет `company_chats_accessed`, [Список ботов пространства](/api/bots/list-company) — `company_bots_accessed`. В обоих случаях актором и объектом события выступает владелец токена.

## Структура записи

| Поле | Тип | Что внутри |
| --- | --- | --- |
| `id` | string | Идентификатор записи (UUID) |
| `created_at` | string | Дата и время события (ISO-8601, UTC+0) |
| `event_key` | string | Тип события. Полный список — ниже |
| `actor_id` | string | Идентификатор сотрудника или бота, выполнившего действие |
| `actor_type` | string | Тип актора, всегда `User` |
| `entity_id` | string | Идентификатор объекта, которого касается событие |
| `entity_type` | string | Тип этого объекта, например `User`, `Chat`, `Message`, `Reaction`, `GroupTag`, `TopicThread`, `VideoRoom` или `AccessToken` |
| `details` | object | Подробности события, состав зависит от `event_key`. Для событий без подробностей — пустой объект |
| `ip_address` | string, null | IP-адрес запроса, в котором произошло действие |
| `user_agent` | string, null | User agent клиента, обрезается до 255 символов |

```json title="Запись о переименовании чата"
{
  "id": "a1b2c3d4-5e6f-7a8b-9c10-d11e12f13a14",
  "created_at": "2026-07-30T09:12:44.000Z",
  "event_key": "chat_renamed",
  "actor_id": "133321",
  "actor_type": "User",
  "entity_id": "45678",
  "entity_type": "Chat",
  "details": { "old_name": "Проект", "new_name": "Проект Альфа" },
  "ip_address": "192.168.1.100",
  "user_agent": "Pachca/3.60.0 (co.staply.pachca; build:15; iOS 18.5.0)"
}
```

> Идентификаторы верхнего уровня (`actor_id`, `entity_id`) приходят строками, а внутри `details` — числами. Это разные представления одного и того же идентификатора, приводите их к одному типу перед сравнением.


Поля `ip_address` и `user_agent` заполняются из HTTP-запроса, в котором произошло действие. У событий, которые пишет сервер сам, без запроса пользователя — например, завершение видеозвонка по таймауту — оба поля приходят как `null`.

## Типы событий

#### AuditEventKey


## Что приходит в деталях

Состав `details` зависит от типа события. События, которых нет в таблице, приходят с пустым объектом: вся информация о них уже есть в `actor_id` и `entity_id`.

| Тип события | Поля `details` |
| --- | --- |
| `user_updated` | `changed_attrs` — список изменённых полей. `context` — присутствует со значением `sso_login`, если профиль обновился автоматически при входе через SSO |
| `user_role_changed` | `new_company_role`, `previous_company_role`, `initiator_id` |
| `user_chat_join` | `inviter_id` |
| `user_chat_leave`, `user_added_to_tag`, `user_removed_from_tag` | `initiator_id` |
| `chat_renamed` | `old_name`, `new_name` |
| `chat_permission_changed` | `public_access` |
| `tag_created`, `tag_deleted` | `name` |
| `tag_added_to_chat` | `chat_id`, `tag_name` |
| `tag_removed_from_chat` | `chat_id` |
| `access_token_created`, `access_token_updated`, `access_token_destroy` | `scopes` |
| `bot_deleted`, `bot_token_recreated` | `bot_id`, `actor_id` |
| `bot_scopes_updated` | `added_scopes`, `removed_scopes` |
| `bot_webhook_settings_updated` | `changes` — объект, где ключ это имя настройки, а значение содержит `previous` и `new` |
| `bot_oauth_client_updated` | `client_id`, `changes` — объект, где ключ это имя параметра клиента, а значение содержит `previous` и `new` |
| `oauth_authorization_granted` | `client_id`, `scopes` |
| `oauth_authorization_revoked` | `client_id`, `revoked_tokens_count` |
| `kms_encrypt`, `kms_decrypt` | `chat_id`, `message_id`, `reason` |
| `dlp_violation_detected` | `dlp_rule_id`, `dlp_rule_name`, `message_id`, `chat_id`, `user_id`, `action_message`, `conditions_matched` |
| `search_users_api`, `search_chats_api`, `search_messages_api` | `search_type`, `query_present`, `cursor_present`, `limit`, `filters` |
| `video_call_started` | `chat_id`, `started_message_id` |
| `video_call_finished` | `chat_id`, `started_message_id`, `duration`, `max_members_count` |
| `video_call_recording_ready` | `chat_id`, `started_message_id`, `recording_id`, `file_id`, `duration`, `size` |

Полные схемы с типами и описанием каждого поля — в разделе «Ответ» на странице метода [Журнал аудита событий](/api/security/list), в поле `details`.

## Фильтры

Все параметры фильтрации необязательны и комбинируются между собой.

| Параметр | Что отбирает |
| --- | --- |
| `start_time`, `end_time` | Период по времени события, границы включительно |
| `event_key` | Один тип события за запрос. Чтобы собрать несколько типов, сделайте несколько запросов |
| `actor_id`, `actor_type` | Кто выполнил действие |
| `entity_id`, `entity_type` | Над каким объектом |

## Пагинация и слежение за новыми событиями

Метод отдаёт записи от новых к старым и использует курсорную пагинацию: `limit` до 50 записей за запрос, `cursor` из `meta.paginate.next_page` для следующей страницы.

Для регулярной выгрузки в SIEM удобнее курсор `meta.paginate.prev_page`: он указывает на начало списка, и запрос с ним возвращает только те события, которые появились после предыдущей выгрузки. Сохраняйте `prev_page` между запусками, вместо того чтобы каждый раз перебирать журнал с начала.

## Примеры использования

**Получение всех событий входа в систему за определенный период**

```bash
# Для получения следующей страницы используйте cursor из meta.paginate.next_page
curl "https://api.pachca.com/api/shared/v1/audit_events?start_time=2025-05-01T00:00:00Z&end_time=2025-05-02T00:00:00Z&event_key=user_login&limit=50" \
  -H "Authorization: Bearer YOUR_ACCESS_TOKEN"
```


**Получение всех событий, связанных с конкретным пользователем**

```bash
# Для получения следующей страницы используйте cursor из meta.paginate.next_page
curl "https://api.pachca.com/api/shared/v1/audit_events?start_time=2025-05-01T00:00:00Z&end_time=2025-05-02T00:00:00Z&actor_id=133321&actor_type=User" \
  -H "Authorization: Bearer YOUR_ACCESS_TOKEN"
```


**Получение всех изменений прав доступа к чатам**

```bash
# Для получения следующей страницы используйте cursor из meta.paginate.next_page
curl "https://api.pachca.com/api/shared/v1/audit_events?start_time=2025-05-01T00:00:00Z&end_time=2025-05-08T00:00:00Z&event_key=chat_permission_changed" \
  -H "Authorization: Bearer YOUR_ACCESS_TOKEN"
```


## Хранение данных

Журналы аудита хранятся в течение 90 дней для баланса между требованиями соответствия и эффективностью хранения. Все журналы неизменяемы и хранятся в системе только для чтения, чтобы обеспечить целостность данных.

## Типичные сценарии использования

- Расследовать подозрительные попытки входа в систему
- Отслеживать изменения прав доступа
- Отслеживать действия по удалению сообщений
- Расследовать изменения ролей пользователей
- Отслеживать изменения в составе участников чатов
- Отслеживать срабатывания правил [DLP-системы](/guides/dlp) (`event_key: "dlp_violation_detected"`)
- Составлять отчеты о соответствии требованиям и во время аудита


## Связанные разделы

- [Права и роли](/guides/permissions)
- [DLP-система](/guides/dlp)
- [Экспорт сообщений](/guides/export)
