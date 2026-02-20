
# LinkSharedWebhookPayload

## Properties
| Name | Type | Description | Notes |
| ------------ | ------------- | ------------- | ------------- |
| **type** | [**inline**](#Type) | Тип объекта |  |
| **event** | [**inline**](#Event) | Тип события |  |
| **chatId** | **kotlin.Int** | Идентификатор чата, в котором обнаружена ссылка |  |
| **messageId** | **kotlin.Int** | Идентификатор сообщения, содержащего ссылку |  |
| **links** | [**kotlin.collections.List&lt;WebhookLink&gt;**](WebhookLink.md) | Массив обнаруженных ссылок на отслеживаемые домены |  |
| **createdAt** | [**java.time.OffsetDateTime**](java.time.OffsetDateTime.md) | Дата и время создания сообщения (ISO-8601, UTC+0) в формате YYYY-MM-DDThh:mm:ss.sssZ |  |
| **webhookTimestamp** | **kotlin.Int** | Дата и время отправки вебхука (UTC+0) в формате UNIX |  |


<a id="Type"></a>
## Enum: type
| Name | Value |
| ---- | ----- |
| type | message |


<a id="Event"></a>
## Enum: event
| Name | Value |
| ---- | ----- |
| event | link_shared |



