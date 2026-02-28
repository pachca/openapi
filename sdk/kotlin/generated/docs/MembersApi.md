# MembersApi

All URIs are relative to *https://api.pachca.com/api/shared/v1*

| Method | HTTP request | Description |
| ------------- | ------------- | ------------- |
| [**chatMemberOperationsAddMembers**](MembersApi.md#chatMemberOperationsAddMembers) | **POST** /chats/{id}/members |  |
| [**chatMemberOperationsAddTags**](MembersApi.md#chatMemberOperationsAddTags) | **POST** /chats/{id}/group_tags |  |
| [**chatMemberOperationsLeaveChat**](MembersApi.md#chatMemberOperationsLeaveChat) | **DELETE** /chats/{id}/leave |  |
| [**chatMemberOperationsListMembers**](MembersApi.md#chatMemberOperationsListMembers) | **GET** /chats/{id}/members |  |
| [**chatMemberOperationsRemoveMember**](MembersApi.md#chatMemberOperationsRemoveMember) | **DELETE** /chats/{id}/members/{user_id} |  |
| [**chatMemberOperationsRemoveTag**](MembersApi.md#chatMemberOperationsRemoveTag) | **DELETE** /chats/{id}/group_tags/{tag_id} |  |
| [**chatMemberOperationsUpdateMemberRole**](MembersApi.md#chatMemberOperationsUpdateMemberRole) | **PUT** /chats/{id}/members/{user_id} |  |


<a id="chatMemberOperationsAddMembers"></a>
# **chatMemberOperationsAddMembers**
> chatMemberOperationsAddMembers(id, addMembersRequest)



Добавление пользователей  Метод для добавления пользователей в состав участников беседы, канала или треда.

### Example
```kotlin
// Import classes:
//import org.openapitools.client.infrastructure.*
//import org.openapitools.client.models.*

val apiInstance = MembersApi()
val id : kotlin.Int = 334 // kotlin.Int | Идентификатор чата (беседа, канал или чат треда)
val addMembersRequest : AddMembersRequest =  // AddMembersRequest | 
try {
    apiInstance.chatMemberOperationsAddMembers(id, addMembersRequest)
} catch (e: ClientException) {
    println("4xx response calling MembersApi#chatMemberOperationsAddMembers")
    e.printStackTrace()
} catch (e: ServerException) {
    println("5xx response calling MembersApi#chatMemberOperationsAddMembers")
    e.printStackTrace()
}
```

### Parameters
| **id** | **kotlin.Int**| Идентификатор чата (беседа, канал или чат треда) | |
| Name | Type | Description  | Notes |
| ------------- | ------------- | ------------- | ------------- |
| **addMembersRequest** | [**AddMembersRequest**](AddMembersRequest.md)|  | |

### Return type

null (empty response body)

### Authorization


Configure BearerAuth:
    ApiClient.accessToken = ""

### HTTP request headers

 - **Content-Type**: application/json
 - **Accept**: application/json

<a id="chatMemberOperationsAddTags"></a>
# **chatMemberOperationsAddTags**
> chatMemberOperationsAddTags(id, addTagsRequest)



Добавление тегов  Метод для добавления тегов в состав участников беседы или канала.  После добавления тега все его участники автоматически становятся участниками чата. Состав участников тега и чата синхронизируется автоматически: при добавлении нового участника в тег он сразу появляется в чате, при удалении из тега — удаляется из чата.

### Example
```kotlin
// Import classes:
//import org.openapitools.client.infrastructure.*
//import org.openapitools.client.models.*

val apiInstance = MembersApi()
val id : kotlin.Int = 334 // kotlin.Int | Идентификатор чата
val addTagsRequest : AddTagsRequest =  // AddTagsRequest | 
try {
    apiInstance.chatMemberOperationsAddTags(id, addTagsRequest)
} catch (e: ClientException) {
    println("4xx response calling MembersApi#chatMemberOperationsAddTags")
    e.printStackTrace()
} catch (e: ServerException) {
    println("5xx response calling MembersApi#chatMemberOperationsAddTags")
    e.printStackTrace()
}
```

### Parameters
| **id** | **kotlin.Int**| Идентификатор чата | |
| Name | Type | Description  | Notes |
| ------------- | ------------- | ------------- | ------------- |
| **addTagsRequest** | [**AddTagsRequest**](AddTagsRequest.md)|  | |

### Return type

null (empty response body)

### Authorization


Configure BearerAuth:
    ApiClient.accessToken = ""

### HTTP request headers

 - **Content-Type**: application/json
 - **Accept**: application/json

<a id="chatMemberOperationsLeaveChat"></a>
# **chatMemberOperationsLeaveChat**
> chatMemberOperationsLeaveChat(id)



Выход из беседы или канала  Метод для самостоятельного выхода из беседы или канала.

### Example
```kotlin
// Import classes:
//import org.openapitools.client.infrastructure.*
//import org.openapitools.client.models.*

val apiInstance = MembersApi()
val id : kotlin.Int = 334 // kotlin.Int | Идентификатор чата
try {
    apiInstance.chatMemberOperationsLeaveChat(id)
} catch (e: ClientException) {
    println("4xx response calling MembersApi#chatMemberOperationsLeaveChat")
    e.printStackTrace()
} catch (e: ServerException) {
    println("5xx response calling MembersApi#chatMemberOperationsLeaveChat")
    e.printStackTrace()
}
```

### Parameters
| Name | Type | Description  | Notes |
| ------------- | ------------- | ------------- | ------------- |
| **id** | **kotlin.Int**| Идентификатор чата | |

### Return type

null (empty response body)

### Authorization


Configure BearerAuth:
    ApiClient.accessToken = ""

### HTTP request headers

 - **Content-Type**: Not defined
 - **Accept**: application/json

<a id="chatMemberOperationsListMembers"></a>
# **chatMemberOperationsListMembers**
> ChatMemberOperationsListMembers200Response chatMemberOperationsListMembers(id, role, limit, cursor)



Список участников чата  Метод для получения актуального списка участников чата.  Владелец пространства может получить состав участников любого чата пространства. Администраторы и боты могут получить список участников только тех чатов, в которых состоят (или которые являются открытыми).

### Example
```kotlin
// Import classes:
//import org.openapitools.client.infrastructure.*
//import org.openapitools.client.models.*

val apiInstance = MembersApi()
val id : kotlin.Int = 334 // kotlin.Int | Идентификатор чата
val role : ChatMemberRoleFilter = all // ChatMemberRoleFilter | Роль в чате
val limit : kotlin.Int = 1 // kotlin.Int | Количество возвращаемых сущностей за один запрос
val cursor : kotlin.String = eyJpZCI6MTAsImRpciI6ImFzYyJ9 // kotlin.String | Курсор для пагинации (из meta.paginate.next_page)
try {
    val result : ChatMemberOperationsListMembers200Response = apiInstance.chatMemberOperationsListMembers(id, role, limit, cursor)
    println(result)
} catch (e: ClientException) {
    println("4xx response calling MembersApi#chatMemberOperationsListMembers")
    e.printStackTrace()
} catch (e: ServerException) {
    println("5xx response calling MembersApi#chatMemberOperationsListMembers")
    e.printStackTrace()
}
```

### Parameters
| **id** | **kotlin.Int**| Идентификатор чата | |
| **role** | [**ChatMemberRoleFilter**](.md)| Роль в чате | [optional] [enum: all, owner, admin, editor, member] |
| **limit** | **kotlin.Int**| Количество возвращаемых сущностей за один запрос | [optional] [default to 50] |
| Name | Type | Description  | Notes |
| ------------- | ------------- | ------------- | ------------- |
| **cursor** | **kotlin.String**| Курсор для пагинации (из meta.paginate.next_page) | [optional] |

### Return type

[**ChatMemberOperationsListMembers200Response**](ChatMemberOperationsListMembers200Response.md)

### Authorization


Configure BearerAuth:
    ApiClient.accessToken = ""

### HTTP request headers

 - **Content-Type**: Not defined
 - **Accept**: application/json

<a id="chatMemberOperationsRemoveMember"></a>
# **chatMemberOperationsRemoveMember**
> chatMemberOperationsRemoveMember(id, userId)



Исключение пользователя  Метод для исключения пользователя из состава участников беседы или канала.  Если пользователь является владельцем чата, то исключить его нельзя. Он может только самостоятельно выйти из чата, воспользовавшись методом [Выход из беседы или канала](DELETE /chats/{id}/leave).

### Example
```kotlin
// Import classes:
//import org.openapitools.client.infrastructure.*
//import org.openapitools.client.models.*

val apiInstance = MembersApi()
val id : kotlin.Int = 334 // kotlin.Int | Идентификатор чата
val userId : kotlin.Int = 186 // kotlin.Int | Идентификатор пользователя
try {
    apiInstance.chatMemberOperationsRemoveMember(id, userId)
} catch (e: ClientException) {
    println("4xx response calling MembersApi#chatMemberOperationsRemoveMember")
    e.printStackTrace()
} catch (e: ServerException) {
    println("5xx response calling MembersApi#chatMemberOperationsRemoveMember")
    e.printStackTrace()
}
```

### Parameters
| **id** | **kotlin.Int**| Идентификатор чата | |
| Name | Type | Description  | Notes |
| ------------- | ------------- | ------------- | ------------- |
| **userId** | **kotlin.Int**| Идентификатор пользователя | |

### Return type

null (empty response body)

### Authorization


Configure BearerAuth:
    ApiClient.accessToken = ""

### HTTP request headers

 - **Content-Type**: Not defined
 - **Accept**: application/json

<a id="chatMemberOperationsRemoveTag"></a>
# **chatMemberOperationsRemoveTag**
> chatMemberOperationsRemoveTag(id, tagId)



Исключение тега  Метод для исключения тега из состава участников беседы или канала.  Для исключения тега вам необходимо знать его &#x60;id&#x60; и указать его в &#x60;URL&#x60; запроса.

### Example
```kotlin
// Import classes:
//import org.openapitools.client.infrastructure.*
//import org.openapitools.client.models.*

val apiInstance = MembersApi()
val id : kotlin.Int = 334 // kotlin.Int | Идентификатор чата
val tagId : kotlin.Int = 86 // kotlin.Int | Идентификатор тега
try {
    apiInstance.chatMemberOperationsRemoveTag(id, tagId)
} catch (e: ClientException) {
    println("4xx response calling MembersApi#chatMemberOperationsRemoveTag")
    e.printStackTrace()
} catch (e: ServerException) {
    println("5xx response calling MembersApi#chatMemberOperationsRemoveTag")
    e.printStackTrace()
}
```

### Parameters
| **id** | **kotlin.Int**| Идентификатор чата | |
| Name | Type | Description  | Notes |
| ------------- | ------------- | ------------- | ------------- |
| **tagId** | **kotlin.Int**| Идентификатор тега | |

### Return type

null (empty response body)

### Authorization


Configure BearerAuth:
    ApiClient.accessToken = ""

### HTTP request headers

 - **Content-Type**: Not defined
 - **Accept**: application/json

<a id="chatMemberOperationsUpdateMemberRole"></a>
# **chatMemberOperationsUpdateMemberRole**
> chatMemberOperationsUpdateMemberRole(id, userId, updateMemberRoleRequest)



Редактирование роли  Метод для редактирования роли пользователя или бота в беседе или канале.  Для редактирования роли в беседе или канале вам необходимо знать &#x60;id&#x60; чата и пользователя (или бота) и указать их в &#x60;URL&#x60; запроса. Все редактируемые параметры роли указываются в теле запроса.  Владельцу чата роль изменить нельзя. Он всегда имеет права Админа в чате.

### Example
```kotlin
// Import classes:
//import org.openapitools.client.infrastructure.*
//import org.openapitools.client.models.*

val apiInstance = MembersApi()
val id : kotlin.Int = 334 // kotlin.Int | Идентификатор чата
val userId : kotlin.Int = 186 // kotlin.Int | Идентификатор пользователя
val updateMemberRoleRequest : UpdateMemberRoleRequest =  // UpdateMemberRoleRequest | 
try {
    apiInstance.chatMemberOperationsUpdateMemberRole(id, userId, updateMemberRoleRequest)
} catch (e: ClientException) {
    println("4xx response calling MembersApi#chatMemberOperationsUpdateMemberRole")
    e.printStackTrace()
} catch (e: ServerException) {
    println("5xx response calling MembersApi#chatMemberOperationsUpdateMemberRole")
    e.printStackTrace()
}
```

### Parameters
| **id** | **kotlin.Int**| Идентификатор чата | |
| **userId** | **kotlin.Int**| Идентификатор пользователя | |
| Name | Type | Description  | Notes |
| ------------- | ------------- | ------------- | ------------- |
| **updateMemberRoleRequest** | [**UpdateMemberRoleRequest**](UpdateMemberRoleRequest.md)|  | |

### Return type

null (empty response body)

### Authorization


Configure BearerAuth:
    ApiClient.accessToken = ""

### HTTP request headers

 - **Content-Type**: application/json
 - **Accept**: application/json

