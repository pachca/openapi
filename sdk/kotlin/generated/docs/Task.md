
# Task

## Properties
| Name | Type | Description | Notes |
| ------------ | ------------- | ------------- | ------------- |
| **id** | **kotlin.Int** | Идентификатор напоминания |  |
| **kind** | [**TaskKind**](TaskKind.md) | Тип |  |
| **content** | **kotlin.String** | Описание |  |
| **dueAt** | [**java.time.OffsetDateTime**](java.time.OffsetDateTime.md) | Срок выполнения напоминания (ISO-8601, UTC+0) в формате YYYY-MM-DDThh:mm:ss.sssZ |  |
| **priority** | **kotlin.Int** | Приоритет |  |
| **userId** | **kotlin.Int** | Идентификатор пользователя-создателя напоминания |  |
| **chatId** | **kotlin.Int** | Идентификатор чата, к которому привязано напоминание |  |
| **status** | [**TaskStatus**](TaskStatus.md) | Статус напоминания |  |
| **createdAt** | [**java.time.OffsetDateTime**](java.time.OffsetDateTime.md) | Дата и время создания напоминания (ISO-8601, UTC+0) в формате YYYY-MM-DDThh:mm:ss.sssZ |  |
| **performerIds** | **kotlin.collections.List&lt;kotlin.Int&gt;** | Массив идентификаторов пользователей, привязанных к напоминанию как «ответственные» |  |
| **allDay** | **kotlin.Boolean** | Напоминание на весь день (без указания времени) |  |
| **customProperties** | [**kotlin.collections.List&lt;CustomProperty&gt;**](CustomProperty.md) | Дополнительные поля напоминания |  |



