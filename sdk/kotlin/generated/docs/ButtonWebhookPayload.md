
# ButtonWebhookPayload

## Properties
| Name | Type | Description | Notes |
| ------------ | ------------- | ------------- | ------------- |
| **type** | [**inline**](#Type) | Тип объекта |  |
| **event** | [**inline**](#Event) | Тип события |  |
| **messageId** | **kotlin.Int** | Идентификатор сообщения, к которому относится кнопка |  |
| **triggerId** | **kotlin.String** | Уникальный идентификатор события. Время жизни — 3 секунды. Может быть использован, например, для открытия представления пользователю |  |
| **&#x60;data&#x60;** | **kotlin.String** | Данные нажатой кнопки |  |
| **userId** | **kotlin.Int** | Идентификатор пользователя, который нажал кнопку |  |
| **chatId** | **kotlin.Int** | Идентификатор чата, в котором была нажата кнопка |  |
| **webhookTimestamp** | **kotlin.Int** | Дата и время отправки вебхука (UTC+0) в формате UNIX |  |


<a id="Type"></a>
## Enum: type
| Name | Value |
| ---- | ----- |
| type | button |


<a id="Event"></a>
## Enum: event
| Name | Value |
| ---- | ----- |
| event | click |



