
# MessageWebhookPayload

## Properties
| Name | Type | Description | Notes |
| ------------ | ------------- | ------------- | ------------- |
| **type** | [**inline**](#Type) | Тип объекта |  |
| **id** | **kotlin.Int** | Идентификатор сообщения |  |
| **event** | [**WebhookEventType**](WebhookEventType.md) | Тип события |  |
| **entityType** | [**MessageEntityType**](MessageEntityType.md) | Тип сущности, к которой относится сообщение |  |
| **entityId** | **kotlin.Int** | Идентификатор сущности, к которой относится сообщение |  |
| **content** | **kotlin.String** | Текст сообщения |  |
| **userId** | **kotlin.Int** | Идентификатор отправителя сообщения |  |
| **createdAt** | [**java.time.OffsetDateTime**](java.time.OffsetDateTime.md) | Дата и время создания сообщения (ISO-8601, UTC+0) в формате YYYY-MM-DDThh:mm:ss.sssZ |  |
| **url** | **kotlin.String** | Прямая ссылка на сообщение |  |
| **chatId** | **kotlin.Int** | Идентификатор чата, в котором находится сообщение |  |
| **webhookTimestamp** | **kotlin.Int** | Дата и время отправки вебхука (UTC+0) в формате UNIX |  |
| **parentMessageId** | **kotlin.Int** | Идентификатор сообщения, к которому написан ответ |  [optional] |
| **thread** | [**WebhookMessageThread**](WebhookMessageThread.md) | Объект с параметрами треда |  [optional] |


<a id="Type"></a>
## Enum: type
| Name | Value |
| ---- | ----- |
| type | message |



