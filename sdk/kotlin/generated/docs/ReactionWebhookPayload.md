
# ReactionWebhookPayload

## Properties
| Name | Type | Description | Notes |
| ------------ | ------------- | ------------- | ------------- |
| **type** | [**inline**](#Type) | Тип объекта |  |
| **event** | [**ReactionEventType**](ReactionEventType.md) | Тип события |  |
| **messageId** | **kotlin.Int** | Идентификатор сообщения, к которому относится реакция |  |
| **code** | **kotlin.String** | Emoji символ реакции |  |
| **name** | **kotlin.String** | Название реакции |  |
| **userId** | **kotlin.Int** | Идентификатор пользователя, который добавил или удалил реакцию |  |
| **createdAt** | [**java.time.OffsetDateTime**](java.time.OffsetDateTime.md) | Дата и время создания сообщения (ISO-8601, UTC+0) в формате YYYY-MM-DDThh:mm:ss.sssZ |  |
| **webhookTimestamp** | **kotlin.Int** | Дата и время отправки вебхука (UTC+0) в формате UNIX |  |


<a id="Type"></a>
## Enum: type
| Name | Value |
| ---- | ----- |
| type | reaction |



