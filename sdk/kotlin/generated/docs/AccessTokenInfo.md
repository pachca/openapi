
# AccessTokenInfo

## Properties
| Name | Type | Description | Notes |
| ------------ | ------------- | ------------- | ------------- |
| **id** | **kotlin.Long** | Идентификатор токена |  |
| **token** | **kotlin.String** | Маскированный токен (видны первые 8 и последние 4 символа) |  |
| **name** | **kotlin.String** | Пользовательское имя токена |  |
| **userId** | **kotlin.Long** | Идентификатор владельца токена |  |
| **scopes** | [**kotlin.collections.List&lt;OAuthScope&gt;**](OAuthScope.md) | Список скоупов токена |  |
| **createdAt** | [**java.time.OffsetDateTime**](java.time.OffsetDateTime.md) | Дата создания токена |  |
| **revokedAt** | [**java.time.OffsetDateTime**](java.time.OffsetDateTime.md) | Дата отзыва токена |  |
| **expiresIn** | **kotlin.Int** | Время жизни токена в секундах |  |
| **lastUsedAt** | [**java.time.OffsetDateTime**](java.time.OffsetDateTime.md) | Дата последнего использования токена |  |



