
# TaskUpdateRequestTask

## Properties
| Name | Type | Description | Notes |
| ------------ | ------------- | ------------- | ------------- |
| **kind** | [**TaskKind**](TaskKind.md) | Тип |  [optional] |
| **content** | **kotlin.String** | Описание |  [optional] |
| **dueAt** | [**java.time.OffsetDateTime**](java.time.OffsetDateTime.md) | Срок выполнения напоминания (ISO-8601) в формате YYYY-MM-DDThh:mm:ss.sssTZD. Если указано время 23:59:59.000, то напоминание будет создано на весь день (без указания времени). |  [optional] |
| **priority** | **kotlin.Int** | Приоритет: 1, 2 (важно) или 3 (очень важно). |  [optional] |
| **performerIds** | **kotlin.collections.List&lt;kotlin.Int&gt;** | Массив идентификаторов пользователей, привязываемых к напоминанию как «ответственные» |  [optional] |
| **status** | [**inline**](#Status) | Статус |  [optional] |
| **allDay** | **kotlin.Boolean** | Напоминание на весь день (без указания времени) |  [optional] |
| **doneAt** | [**java.time.OffsetDateTime**](java.time.OffsetDateTime.md) | Дата и время выполнения напоминания (ISO-8601, UTC+0) в формате YYYY-MM-DDThh:mm:ss.sssZ |  [optional] |
| **customProperties** | [**kotlin.collections.List&lt;TaskCreateRequestTaskCustomPropertiesInner&gt;**](TaskCreateRequestTaskCustomPropertiesInner.md) | Задаваемые дополнительные поля |  [optional] |


<a id="Status"></a>
## Enum: status
| Name | Value |
| ---- | ----- |
| status | done, undone |



