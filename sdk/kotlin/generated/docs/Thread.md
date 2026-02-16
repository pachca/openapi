
# Thread

## Properties
| Name | Type | Description | Notes |
| ------------ | ------------- | ------------- | ------------- |
| **id** | **kotlin.Long** | Идентификатор созданного треда (используется для отправки [новых комментариев](POST /messages) в тред) |  |
| **chatId** | **kotlin.Long** | Идентификатор чата треда (используется для отправки [новых комментариев](POST /messages) в тред и получения [списка комментариев](GET /messages)) |  |
| **messageId** | **kotlin.Long** | Идентификатор сообщения, к которому был создан тред |  |
| **messageChatId** | **kotlin.Long** | Идентификатор чата сообщения |  |
| **updatedAt** | [**java.time.OffsetDateTime**](java.time.OffsetDateTime.md) | Дата и время обновления треда (ISO-8601, UTC+0) в формате YYYY-MM-DDThh:mm:ss.sssZ |  |



