
# User

## Properties
| Name | Type | Description | Notes |
| ------------ | ------------- | ------------- | ------------- |
| **id** | **kotlin.Int** | Идентификатор пользователя |  |
| **firstName** | **kotlin.String** | Имя |  |
| **lastName** | **kotlin.String** | Фамилия |  |
| **nickname** | **kotlin.String** | Имя пользователя |  |
| **email** | **kotlin.String** | Электронная почта |  |
| **phoneNumber** | **kotlin.String** | Телефон |  |
| **department** | **kotlin.String** | Департамент |  |
| **title** | **kotlin.String** | Должность |  |
| **role** | [**UserRole**](UserRole.md) | Уровень доступа |  |
| **suspended** | **kotlin.Boolean** | Деактивация пользователя |  |
| **inviteStatus** | [**InviteStatus**](InviteStatus.md) | Статус приглашения |  |
| **listTags** | **kotlin.collections.List&lt;kotlin.String&gt;** | Массив тегов, привязанных к сотруднику |  |
| **customProperties** | [**kotlin.collections.List&lt;CustomProperty&gt;**](CustomProperty.md) | Дополнительные поля сотрудника |  |
| **userStatus** | [**UserStatus**](UserStatus.md) | Статус |  |
| **bot** | **kotlin.Boolean** | Является ботом |  |
| **sso** | **kotlin.Boolean** | Использует ли пользователь SSO |  |
| **createdAt** | [**java.time.OffsetDateTime**](java.time.OffsetDateTime.md) | Дата создания (ISO-8601, UTC+0) в формате YYYY-MM-DDThh:mm:ss.sssZ |  |
| **lastActivityAt** | [**java.time.OffsetDateTime**](java.time.OffsetDateTime.md) | Дата последней активности пользователя (ISO-8601, UTC+0) в формате YYYY-MM-DDThh:mm:ss.sssZ |  |
| **timeZone** | **kotlin.String** | Часовой пояс пользователя |  |
| **imageUrl** | **kotlin.String** | Ссылка на скачивание аватарки пользователя |  |



