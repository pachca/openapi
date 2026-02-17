# ChatsApi

All URIs are relative to *https://api.pachca.com/api/shared/v1*

| Method | HTTP request | Description |
| ------------- | ------------- | ------------- |
| [**chatOperationsArchiveChat**](ChatsApi.md#chatOperationsArchiveChat) | **PUT** /chats/{id}/archive |  |
| [**chatOperationsCreateChat**](ChatsApi.md#chatOperationsCreateChat) | **POST** /chats |  |
| [**chatOperationsGetChat**](ChatsApi.md#chatOperationsGetChat) | **GET** /chats/{id} |  |
| [**chatOperationsListChats**](ChatsApi.md#chatOperationsListChats) | **GET** /chats |  |
| [**chatOperationsUnarchiveChat**](ChatsApi.md#chatOperationsUnarchiveChat) | **PUT** /chats/{id}/unarchive |  |
| [**chatOperationsUpdateChat**](ChatsApi.md#chatOperationsUpdateChat) | **PUT** /chats/{id} |  |


<a id="chatOperationsArchiveChat"></a>
# **chatOperationsArchiveChat**
> kotlin.Any chatOperationsArchiveChat(id)



Архивация чата  Метод для отправки чата в архив.  Для отправки чата в архив вам необходимо знать &#x60;id&#x60; и указать его в &#x60;URL&#x60; запроса.

### Example
```kotlin
// Import classes:
//import org.openapitools.client.infrastructure.*
//import org.openapitools.client.models.*

val apiInstance = ChatsApi()
val id : kotlin.Int = 56 // kotlin.Int | Идентификатор чата
try {
    val result : kotlin.Any = apiInstance.chatOperationsArchiveChat(id)
    println(result)
} catch (e: ClientException) {
    println("4xx response calling ChatsApi#chatOperationsArchiveChat")
    e.printStackTrace()
} catch (e: ServerException) {
    println("5xx response calling ChatsApi#chatOperationsArchiveChat")
    e.printStackTrace()
}
```

### Parameters
| Name | Type | Description  | Notes |
| ------------- | ------------- | ------------- | ------------- |
| **id** | **kotlin.Int**| Идентификатор чата | |

### Return type

[**kotlin.Any**](kotlin.Any.md)

### Authorization


Configure BearerAuth:
    ApiClient.username = ""
    ApiClient.password = ""

### HTTP request headers

 - **Content-Type**: Not defined
 - **Accept**: application/json

<a id="chatOperationsCreateChat"></a>
# **chatOperationsCreateChat**
> ChatOperationsCreateChat201Response chatOperationsCreateChat(chatCreateRequest)



Новый чат  Метод для создания нового чата.  Для создания личной переписки 1 на 1 с пользователем пользуйтесь методом [Новое сообщение](POST /messages).  При создании чата вы автоматически становитесь участником.

### Example
```kotlin
// Import classes:
//import org.openapitools.client.infrastructure.*
//import org.openapitools.client.models.*

val apiInstance = ChatsApi()
val chatCreateRequest : ChatCreateRequest = {"chat":{"name":"🤿 aqua","member_ids":[186,187],"channel":true,"public":false}} // ChatCreateRequest | 
try {
    val result : ChatOperationsCreateChat201Response = apiInstance.chatOperationsCreateChat(chatCreateRequest)
    println(result)
} catch (e: ClientException) {
    println("4xx response calling ChatsApi#chatOperationsCreateChat")
    e.printStackTrace()
} catch (e: ServerException) {
    println("5xx response calling ChatsApi#chatOperationsCreateChat")
    e.printStackTrace()
}
```

### Parameters
| Name | Type | Description  | Notes |
| ------------- | ------------- | ------------- | ------------- |
| **chatCreateRequest** | [**ChatCreateRequest**](ChatCreateRequest.md)|  | |

### Return type

[**ChatOperationsCreateChat201Response**](ChatOperationsCreateChat201Response.md)

### Authorization


Configure BearerAuth:
    ApiClient.username = ""
    ApiClient.password = ""

### HTTP request headers

 - **Content-Type**: application/json
 - **Accept**: application/json

<a id="chatOperationsGetChat"></a>
# **chatOperationsGetChat**
> ChatOperationsCreateChat201Response chatOperationsGetChat(id)



Информация о чате  Метод для получения информации о чате.  Для получения чата вам необходимо знать его &#x60;id&#x60; и указать его в &#x60;URL&#x60; запроса.

### Example
```kotlin
// Import classes:
//import org.openapitools.client.infrastructure.*
//import org.openapitools.client.models.*

val apiInstance = ChatsApi()
val id : kotlin.Int = 56 // kotlin.Int | Идентификатор чата
try {
    val result : ChatOperationsCreateChat201Response = apiInstance.chatOperationsGetChat(id)
    println(result)
} catch (e: ClientException) {
    println("4xx response calling ChatsApi#chatOperationsGetChat")
    e.printStackTrace()
} catch (e: ServerException) {
    println("5xx response calling ChatsApi#chatOperationsGetChat")
    e.printStackTrace()
}
```

### Parameters
| Name | Type | Description  | Notes |
| ------------- | ------------- | ------------- | ------------- |
| **id** | **kotlin.Int**| Идентификатор чата | |

### Return type

[**ChatOperationsCreateChat201Response**](ChatOperationsCreateChat201Response.md)

### Authorization


Configure BearerAuth:
    ApiClient.username = ""
    ApiClient.password = ""

### HTTP request headers

 - **Content-Type**: Not defined
 - **Accept**: application/json

<a id="chatOperationsListChats"></a>
# **chatOperationsListChats**
> ChatOperationsListChats200Response chatOperationsListChats(sortLeftCurlyBracketFieldRightCurlyBracket, availability, lastMessageAtAfter, lastMessageAtBefore, personal, limit, cursor)



Список чатов  Метод для получения списка чатов по заданным параметрам.

### Example
```kotlin
// Import classes:
//import org.openapitools.client.infrastructure.*
//import org.openapitools.client.models.*

val apiInstance = ChatsApi()
val sortLeftCurlyBracketFieldRightCurlyBracket : SortOrder =  // SortOrder | Составной параметр сортировки сущностей выборки. На данный момент сортировка доступна по полям `id` (идентификатор чата) и `last_message_at` (дата и время создания последнего сообщения).
val availability : ChatAvailability =  // ChatAvailability | Параметр, который отвечает за доступность и выборку чатов для пользователя
val lastMessageAtAfter : java.time.OffsetDateTime = 2013-10-20T19:20:30+01:00 // java.time.OffsetDateTime | Фильтрация по времени создания последнего сообщения. Будут возвращены те чаты, время последнего созданного сообщения в которых не раньше чем указанное (в формате YYYY-MM-DDThh:mm:ss.sssZ).
val lastMessageAtBefore : java.time.OffsetDateTime = 2013-10-20T19:20:30+01:00 // java.time.OffsetDateTime | Фильтрация по времени создания последнего сообщения. Будут возвращены те чаты, время последнего созданного сообщения в которых не позже чем указанное (в формате YYYY-MM-DDThh:mm:ss.sssZ).
val personal : kotlin.Boolean = true // kotlin.Boolean | Фильтрация по личным и групповым чатам. Если параметр не указан, возвращаются любые чаты.
val limit : kotlin.Int = 56 // kotlin.Int | Количество возвращаемых сущностей за один запрос
val cursor : kotlin.String = cursor_example // kotlin.String | Курсор для пагинации (из meta.paginate.next_page)
try {
    val result : ChatOperationsListChats200Response = apiInstance.chatOperationsListChats(sortLeftCurlyBracketFieldRightCurlyBracket, availability, lastMessageAtAfter, lastMessageAtBefore, personal, limit, cursor)
    println(result)
} catch (e: ClientException) {
    println("4xx response calling ChatsApi#chatOperationsListChats")
    e.printStackTrace()
} catch (e: ServerException) {
    println("5xx response calling ChatsApi#chatOperationsListChats")
    e.printStackTrace()
}
```

### Parameters
| **sortLeftCurlyBracketFieldRightCurlyBracket** | [**SortOrder**](.md)| Составной параметр сортировки сущностей выборки. На данный момент сортировка доступна по полям &#x60;id&#x60; (идентификатор чата) и &#x60;last_message_at&#x60; (дата и время создания последнего сообщения). | [optional] [enum: asc, desc] |
| **availability** | [**ChatAvailability**](.md)| Параметр, который отвечает за доступность и выборку чатов для пользователя | [optional] [enum: is_member, public] |
| **lastMessageAtAfter** | **java.time.OffsetDateTime**| Фильтрация по времени создания последнего сообщения. Будут возвращены те чаты, время последнего созданного сообщения в которых не раньше чем указанное (в формате YYYY-MM-DDThh:mm:ss.sssZ). | [optional] |
| **lastMessageAtBefore** | **java.time.OffsetDateTime**| Фильтрация по времени создания последнего сообщения. Будут возвращены те чаты, время последнего созданного сообщения в которых не позже чем указанное (в формате YYYY-MM-DDThh:mm:ss.sssZ). | [optional] |
| **personal** | **kotlin.Boolean**| Фильтрация по личным и групповым чатам. Если параметр не указан, возвращаются любые чаты. | [optional] |
| **limit** | **kotlin.Int**| Количество возвращаемых сущностей за один запрос | [optional] [default to 50] |
| Name | Type | Description  | Notes |
| ------------- | ------------- | ------------- | ------------- |
| **cursor** | **kotlin.String**| Курсор для пагинации (из meta.paginate.next_page) | [optional] |

### Return type

[**ChatOperationsListChats200Response**](ChatOperationsListChats200Response.md)

### Authorization


Configure BearerAuth:
    ApiClient.username = ""
    ApiClient.password = ""

### HTTP request headers

 - **Content-Type**: Not defined
 - **Accept**: application/json

<a id="chatOperationsUnarchiveChat"></a>
# **chatOperationsUnarchiveChat**
> kotlin.Any chatOperationsUnarchiveChat(id)



Разархивация чата  Метод для возвращения чата из архива.  Для разархивации чата вам необходимо знать её &#x60;id&#x60; и указать его в &#x60;URL&#x60; запроса.

### Example
```kotlin
// Import classes:
//import org.openapitools.client.infrastructure.*
//import org.openapitools.client.models.*

val apiInstance = ChatsApi()
val id : kotlin.Int = 56 // kotlin.Int | Идентификатор чата
try {
    val result : kotlin.Any = apiInstance.chatOperationsUnarchiveChat(id)
    println(result)
} catch (e: ClientException) {
    println("4xx response calling ChatsApi#chatOperationsUnarchiveChat")
    e.printStackTrace()
} catch (e: ServerException) {
    println("5xx response calling ChatsApi#chatOperationsUnarchiveChat")
    e.printStackTrace()
}
```

### Parameters
| Name | Type | Description  | Notes |
| ------------- | ------------- | ------------- | ------------- |
| **id** | **kotlin.Int**| Идентификатор чата | |

### Return type

[**kotlin.Any**](kotlin.Any.md)

### Authorization


Configure BearerAuth:
    ApiClient.username = ""
    ApiClient.password = ""

### HTTP request headers

 - **Content-Type**: Not defined
 - **Accept**: application/json

<a id="chatOperationsUpdateChat"></a>
# **chatOperationsUpdateChat**
> ChatOperationsCreateChat201Response chatOperationsUpdateChat(id, chatUpdateRequest)



Обновление чата  Метод для обновления параметров чата.  Для обновления нужно знать &#x60;id&#x60; чата и указать его в &#x60;URL&#x60;. Все обновляемые поля передаются в теле запроса.

### Example
```kotlin
// Import classes:
//import org.openapitools.client.infrastructure.*
//import org.openapitools.client.models.*

val apiInstance = ChatsApi()
val id : kotlin.Int = 56 // kotlin.Int | Идентификатор чата
val chatUpdateRequest : ChatUpdateRequest = {"chat":{"name":"Бассейн","public":true}} // ChatUpdateRequest | 
try {
    val result : ChatOperationsCreateChat201Response = apiInstance.chatOperationsUpdateChat(id, chatUpdateRequest)
    println(result)
} catch (e: ClientException) {
    println("4xx response calling ChatsApi#chatOperationsUpdateChat")
    e.printStackTrace()
} catch (e: ServerException) {
    println("5xx response calling ChatsApi#chatOperationsUpdateChat")
    e.printStackTrace()
}
```

### Parameters
| **id** | **kotlin.Int**| Идентификатор чата | |
| Name | Type | Description  | Notes |
| ------------- | ------------- | ------------- | ------------- |
| **chatUpdateRequest** | [**ChatUpdateRequest**](ChatUpdateRequest.md)|  | |

### Return type

[**ChatOperationsCreateChat201Response**](ChatOperationsCreateChat201Response.md)

### Authorization


Configure BearerAuth:
    ApiClient.username = ""
    ApiClient.password = ""

### HTTP request headers

 - **Content-Type**: application/json
 - **Accept**: application/json

