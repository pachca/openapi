
# AuditEvent

## Properties
| Name | Type | Description | Notes |
| ------------ | ------------- | ------------- | ------------- |
| **id** | **kotlin.String** | Уникальный идентификатор события |  |
| **createdAt** | [**java.time.OffsetDateTime**](java.time.OffsetDateTime.md) | Дата и время создания события (ISO-8601, UTC+0) в формате YYYY-MM-DDThh:mm:ss.sssZ |  |
| **eventKey** | [**AuditEventKey**](AuditEventKey.md) | Ключ типа события |  |
| **entityId** | **kotlin.String** | Идентификатор затронутой сущности |  |
| **entityType** | **kotlin.String** | Тип затронутой сущности |  |
| **actorId** | **kotlin.String** | Идентификатор пользователя, выполнившего действие |  |
| **actorType** | **kotlin.String** | Тип актора |  |
| **details** | [**kotlin.collections.Map&lt;kotlin.String, kotlin.Any&gt;**](kotlin.Any.md) | Дополнительные детали события |  |
| **ipAddress** | **kotlin.String** | IP-адрес, с которого было выполнено действие |  |
| **userAgent** | **kotlin.String** | User agent клиента |  |



