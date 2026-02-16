
# Chat

## Properties
| Name | Type | Description | Notes |
| ------------ | ------------- | ------------- | ------------- |
| **id** | **kotlin.Int** | Идентификатор созданного чата |  |
| **name** | **kotlin.String** | Название |  |
| **createdAt** | [**java.time.OffsetDateTime**](java.time.OffsetDateTime.md) | Дата и время создания чата (ISO-8601, UTC+0) в формате YYYY-MM-DDThh:mm:ss.sssZ |  |
| **ownerId** | **kotlin.Int** | Идентификатор пользователя, создавшего чат |  |
| **memberIds** | **kotlin.collections.List&lt;kotlin.Int&gt;** | Массив идентификаторов пользователей, участников |  |
| **groupTagIds** | **kotlin.collections.List&lt;kotlin.Int&gt;** | Массив идентификаторов тегов, участников |  |
| **channel** | **kotlin.Boolean** | Является каналом |  |
| **personal** | **kotlin.Boolean** | Является личным чатом |  |
| **&#x60;public&#x60;** | **kotlin.Boolean** | Открытый доступ |  |
| **lastMessageAt** | [**java.time.OffsetDateTime**](java.time.OffsetDateTime.md) | Дата и время создания последнего сообщения в чате (ISO-8601, UTC+0) в формате YYYY-MM-DDThh:mm:ss.sssZ |  |
| **meetRoomUrl** | **kotlin.String** | Ссылка на Видеочат |  |



