# SecurityApi

All URIs are relative to *https://api.pachca.com/api/shared/v1*

| Method | HTTP request | Description |
| ------------- | ------------- | ------------- |
| [**securityOperationsGetAuditEvents**](SecurityApi.md#securityOperationsGetAuditEvents) | **GET** /audit_events |  |


<a id="securityOperationsGetAuditEvents"></a>
# **securityOperationsGetAuditEvents**
> SecurityOperationsGetAuditEvents200Response securityOperationsGetAuditEvents(startTime, endTime, eventKey, actorId, actorType, entityId, entityType, limit, cursor)



Журнал аудита событий  #corporation_price_only  Метод для получения логов событий на основе указанных фильтров.

### Example
```kotlin
// Import classes:
//import org.openapitools.client.infrastructure.*
//import org.openapitools.client.models.*

val apiInstance = SecurityApi()
val startTime : java.time.OffsetDateTime = 2013-10-20T19:20:30+01:00 // java.time.OffsetDateTime | Начальная метка времени (включительно)
val endTime : java.time.OffsetDateTime = 2013-10-20T19:20:30+01:00 // java.time.OffsetDateTime | Конечная метка времени (исключительно)
val eventKey : AuditEventKey =  // AuditEventKey | Фильтр по конкретному типу события
val actorId : kotlin.Int = 56 // kotlin.Int | Идентификатор пользователя, выполнившего действие
val actorType : kotlin.String = actorType_example // kotlin.String | Тип актора
val entityId : kotlin.Int = 56 // kotlin.Int | Идентификатор затронутой сущности
val entityType : kotlin.String = entityType_example // kotlin.String | Тип сущности
val limit : kotlin.Int = 56 // kotlin.Int | Количество записей для возврата
val cursor : kotlin.String = cursor_example // kotlin.String | Курсор для пагинации из meta.paginate.next_page
try {
    val result : SecurityOperationsGetAuditEvents200Response = apiInstance.securityOperationsGetAuditEvents(startTime, endTime, eventKey, actorId, actorType, entityId, entityType, limit, cursor)
    println(result)
} catch (e: ClientException) {
    println("4xx response calling SecurityApi#securityOperationsGetAuditEvents")
    e.printStackTrace()
} catch (e: ServerException) {
    println("5xx response calling SecurityApi#securityOperationsGetAuditEvents")
    e.printStackTrace()
}
```

### Parameters
| **startTime** | **java.time.OffsetDateTime**| Начальная метка времени (включительно) | |
| **endTime** | **java.time.OffsetDateTime**| Конечная метка времени (исключительно) | |
| **eventKey** | [**AuditEventKey**](.md)| Фильтр по конкретному типу события | [optional] [enum: user_login, user_logout, user_2fa_fail, user_2fa_success, user_created, user_deleted, user_role_changed, user_updated, tag_created, tag_deleted, user_added_to_tag, user_removed_from_tag, chat_created, chat_renamed, chat_permission_changed, user_chat_join, user_chat_leave, tag_added_to_chat, tag_removed_from_chat, message_updated, message_deleted, message_created, reaction_created, reaction_deleted, access_token_created, access_token_updated, access_token_destroy, kms_encrypt, kms_decrypt, audit_events_accessed, dlp_violation_detected] |
| **actorId** | **kotlin.Int**| Идентификатор пользователя, выполнившего действие | [optional] |
| **actorType** | **kotlin.String**| Тип актора | [optional] |
| **entityId** | **kotlin.Int**| Идентификатор затронутой сущности | [optional] |
| **entityType** | **kotlin.String**| Тип сущности | [optional] |
| **limit** | **kotlin.Int**| Количество записей для возврата | [optional] [default to 50] |
| Name | Type | Description  | Notes |
| ------------- | ------------- | ------------- | ------------- |
| **cursor** | **kotlin.String**| Курсор для пагинации из meta.paginate.next_page | [optional] |

### Return type

[**SecurityOperationsGetAuditEvents200Response**](SecurityOperationsGetAuditEvents200Response.md)

### Authorization


Configure BearerAuth:
    ApiClient.username = ""
    ApiClient.password = ""

### HTTP request headers

 - **Content-Type**: Not defined
 - **Accept**: application/json

