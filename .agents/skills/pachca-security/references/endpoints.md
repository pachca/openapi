# Безопасность — Справочник эндпоинтов

## Журнал аудита событий

**GET** `/audit_events`

Журнал аудита событий


Метод для получения логов событий на основе указанных фильтров.

**Параметры:**

- `start_time` (query, string, **обязательный**): Начальная метка времени (включительно)
- `end_time` (query, string, **обязательный**): Конечная метка времени (исключительно)
- `event_key` (query, string, опциональный): Фильтр по конкретному типу события
  - Значения: `user_login`, `user_logout`, `user_2fa_fail`, `user_2fa_success`, `user_created`, `user_deleted`, `user_role_changed`, `user_updated`, `tag_created`, `tag_deleted`, `user_added_to_tag`, `user_removed_from_tag`, `chat_created`, `chat_renamed`, `chat_permission_changed`, `user_chat_join`, `user_chat_leave`, `tag_added_to_chat`, `tag_removed_from_chat`, `message_updated`, `message_deleted`, `message_created`, `reaction_created`, `reaction_deleted`, `access_token_created`, `access_token_updated`, `access_token_destroy`, `kms_encrypt`, `kms_decrypt`, `audit_events_accessed`, `dlp_violation_detected`
- `actor_id` (query, integer, опциональный): Идентификатор пользователя, выполнившего действие
- `actor_type` (query, string, опциональный): Тип актора
- `entity_id` (query, integer, опциональный): Идентификатор затронутой сущности
- `entity_type` (query, string, опциональный): Тип сущности
- `limit` (query, integer, опциональный): Количество записей для возврата
- `cursor` (query, string, опциональный): Курсор для пагинации из meta.paginate.next_page

**Пример:**

```bash
curl "https://api.pachca.com/api/shared/v1/audit_events?start_time=2024-04-08T10%3A00%3A00.000Z&end_time=2024-04-08T10%3A00%3A00.000Z&event_key=user_login&actor_id=12345&actor_type=string&entity_id=12345&entity_type=string&limit=50&cursor=string" \
  -H "Authorization: Bearer YOUR_ACCESS_TOKEN"
```

**Ответ:**

- `meta` (object, опциональный): Метаданные пагинации
  - `paginate` (object, опциональный): Вспомогательная информация
    - `next_page` (string, опциональный): Курсор пагинации следующей страницы
- `data` (array[object], **обязательный**): 
  - `id` (string, **обязательный**): Уникальный идентификатор события
  - `created_at` (string, **обязательный**): Дата и время создания события (ISO-8601, UTC+0) в формате YYYY-MM-DDThh:mm:ss.sssZ
  - `event_key` (object, **обязательный**): Ключ типа события
  - `entity_id` (string, **обязательный**): Идентификатор затронутой сущности
  - `entity_type` (string, **обязательный**): Тип затронутой сущности
  - `actor_id` (string, **обязательный**): Идентификатор пользователя, выполнившего действие
  - `actor_type` (string, **обязательный**): Тип актора
  - `details` (object, **обязательный**): Дополнительные детали события
  - `ip_address` (string, **обязательный**): IP-адрес, с которого было выполнено действие
  - `user_agent` (string, **обязательный**): User agent клиента

---
