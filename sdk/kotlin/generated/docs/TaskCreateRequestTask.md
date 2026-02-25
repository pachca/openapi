
# TaskCreateRequestTask

## Properties
| Name | Type | Description | Notes |
| ------------ | ------------- | ------------- | ------------- |
| **kind** | [**TaskKind**](TaskKind.md) | Тип |  |
| **content** | **kotlin.String** | Описание (по умолчанию — название типа) |  [optional] |
| **dueAt** | [**java.time.OffsetDateTime**](java.time.OffsetDateTime.md) | Срок выполнения напоминания (ISO-8601) в формате YYYY-MM-DDThh:mm:ss.sssTZD. Если указано время 23:59:59.000, то напоминание будет создано на весь день (без указания времени). |  [optional] |
| **priority** | **kotlin.Int** | Приоритет: 1, 2 (важно) или 3 (очень важно). |  [optional] |
| **performerIds** | **kotlin.collections.List&lt;kotlin.Int&gt;** | Массив идентификаторов пользователей, привязываемых к напоминанию как «ответственные» (по умолчанию ответственным назначается вы) |  [optional] |
| **chatId** | **kotlin.Int** | Идентификатор чата, к которому привязывается напоминание |  [optional] |
| **allDay** | **kotlin.Boolean** | Напоминание на весь день (без указания времени) |  [optional] |
| **customProperties** | [**kotlin.collections.List&lt;TaskCreateRequestTaskCustomPropertiesInner&gt;**](TaskCreateRequestTaskCustomPropertiesInner.md) | Задаваемые дополнительные поля |  [optional] |



