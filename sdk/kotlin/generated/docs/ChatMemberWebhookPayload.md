
# ChatMemberWebhookPayload

## Properties
| Name | Type | Description | Notes |
| ------------ | ------------- | ------------- | ------------- |
| **type** | [**inline**](#Type) | Тип объекта |  |
| **event** | [**MemberEventType**](MemberEventType.md) | Тип события |  |
| **chatId** | **kotlin.Int** | Идентификатор чата, в котором изменился состав участников |  |
| **userIds** | **kotlin.collections.List&lt;kotlin.Int&gt;** | Массив идентификаторов пользователей, с которыми произошло событие |  |
| **createdAt** | [**java.time.OffsetDateTime**](java.time.OffsetDateTime.md) | Дата и время события (ISO-8601, UTC+0) в формате YYYY-MM-DDThh:mm:ss.sssZ |  |
| **webhookTimestamp** | **kotlin.Int** | Дата и время отправки вебхука (UTC+0) в формате UNIX |  |
| **threadId** | **kotlin.Int** | Идентификатор треда |  [optional] |


<a id="Type"></a>
## Enum: type
| Name | Value |
| ---- | ----- |
| type | chat_member |



