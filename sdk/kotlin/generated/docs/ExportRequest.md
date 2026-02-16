
# ExportRequest

## Properties
| Name | Type | Description | Notes |
| ------------ | ------------- | ------------- | ------------- |
| **startAt** | [**java.time.LocalDate**](java.time.LocalDate.md) | Дата начала для экспорта (ISO-8601, UTC+0) в формате YYYY-MM-DD |  |
| **endAt** | [**java.time.LocalDate**](java.time.LocalDate.md) | Дата окончания для экспорта (ISO-8601, UTC+0) в формате YYYY-MM-DD |  |
| **webhookUrl** | **kotlin.String** | Адрес, на который будет отправлен вебхук по завершению экспорта |  [optional] |
| **chatIds** | **kotlin.collections.List&lt;kotlin.Int&gt;** | Массив идентификаторов чатов. Указывается, если нужно получить сообщения только некоторых чатов. |  [optional] |
| **skipChatsFile** | **kotlin.Boolean** | Пропуск формирования файла со списком чатов (chats.json) |  [optional] |



