
# WebhookPayloadUnion

## Properties
| Name | Type | Description | Notes |
| ------------ | ------------- | ------------- | ------------- |
| **type** | [**inline**](#Type) | Тип объекта |  |
| **id** | **kotlin.Int** | Идентификатор сообщения |  |
| **event** | [**UserEventType**](UserEventType.md) | Тип события |  |
| **entityType** | [**MessageEntityType**](MessageEntityType.md) | Тип сущности, к которой относится сообщение |  |
| **entityId** | **kotlin.Int** | Идентификатор сущности, к которой относится сообщение |  |
| **content** | **kotlin.String** | Текст сообщения |  |
| **userId** | **kotlin.Int** | Идентификатор пользователя, который нажал кнопку |  |
| **createdAt** | [**java.time.OffsetDateTime**](java.time.OffsetDateTime.md) | Дата и время события (ISO-8601, UTC+0) в формате YYYY-MM-DDThh:mm:ss.sssZ |  |
| **url** | **kotlin.String** | Прямая ссылка на сообщение |  |
| **chatId** | **kotlin.Int** | Идентификатор чата, в котором изменился состав участников |  |
| **webhookTimestamp** | **kotlin.Int** | Дата и время отправки вебхука (UTC+0) в формате UNIX |  |
| **messageId** | **kotlin.Int** | Идентификатор сообщения, к которому относится кнопка |  |
| **code** | **kotlin.String** | Emoji символ реакции |  |
| **name** | **kotlin.String** | Название реакции |  |
| **triggerId** | **kotlin.String** | Уникальный идентификатор события. Время жизни — 3 секунды. Может быть использован, например, для открытия представления пользователю |  |
| **&#x60;data&#x60;** | **kotlin.String** | Данные нажатой кнопки |  |
| **userIds** | **kotlin.collections.List&lt;kotlin.Int&gt;** | Массив идентификаторов пользователей, с которыми произошло событие |  |
| **parentMessageId** | **kotlin.Int** | Идентификатор сообщения, к которому написан ответ |  [optional] |
| **thread** | [**WebhookMessageThread**](WebhookMessageThread.md) | Объект с параметрами треда |  [optional] |
| **threadId** | **kotlin.Int** | Идентификатор треда |  [optional] |


<a id="Type"></a>
## Enum: type
| Name | Value |
| ---- | ----- |
| type | message, reaction, button, chat_member, company_member |



