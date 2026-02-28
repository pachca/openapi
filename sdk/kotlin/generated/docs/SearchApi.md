# SearchApi

All URIs are relative to *https://api.pachca.com/api/shared/v1*

| Method | HTTP request | Description |
| ------------- | ------------- | ------------- |
| [**searchOperationsSearchChats**](SearchApi.md#searchOperationsSearchChats) | **GET** /search/chats |  |
| [**searchOperationsSearchMessages**](SearchApi.md#searchOperationsSearchMessages) | **GET** /search/messages |  |
| [**searchOperationsSearchUsers**](SearchApi.md#searchOperationsSearchUsers) | **GET** /search/users |  |


<a id="searchOperationsSearchChats"></a>
# **searchOperationsSearchChats**
> SearchOperationsSearchChats200Response searchOperationsSearchChats(query, limit, cursor, order, createdFrom, createdTo, active, chatSubtype, personal)



Поиск чатов  Метод для полнотекстового поиска каналов и бесед.

### Example
```kotlin
// Import classes:
//import org.openapitools.client.infrastructure.*
//import org.openapitools.client.models.*

val apiInstance = SearchApi()
val query : kotlin.String = Разработка // kotlin.String | Текст поискового запроса
val limit : kotlin.Int = 10 // kotlin.Int | Количество возвращаемых результатов за один запрос
val cursor : kotlin.String = eyJpZCI6MTAsImRpciI6ImFzYyJ9 // kotlin.String | Курсор для пагинации (из meta.paginate.next_page)
val order : SortOrder = desc // SortOrder | Направление сортировки
val createdFrom : java.time.OffsetDateTime = 2025-01-01T00:00:00.000Z // java.time.OffsetDateTime | Фильтр по дате создания (от)
val createdTo : java.time.OffsetDateTime = 2025-02-01T00:00:00.000Z // java.time.OffsetDateTime | Фильтр по дате создания (до)
val active : kotlin.Boolean = true // kotlin.Boolean | Фильтр по активности чата
val chatSubtype : ChatSubtype = discussion // ChatSubtype | Фильтр по типу чата
val personal : kotlin.Boolean = false // kotlin.Boolean | Фильтр по личным чатам
try {
    val result : SearchOperationsSearchChats200Response = apiInstance.searchOperationsSearchChats(query, limit, cursor, order, createdFrom, createdTo, active, chatSubtype, personal)
    println(result)
} catch (e: ClientException) {
    println("4xx response calling SearchApi#searchOperationsSearchChats")
    e.printStackTrace()
} catch (e: ServerException) {
    println("5xx response calling SearchApi#searchOperationsSearchChats")
    e.printStackTrace()
}
```

### Parameters
| **query** | **kotlin.String**| Текст поискового запроса | [optional] |
| **limit** | **kotlin.Int**| Количество возвращаемых результатов за один запрос | [optional] [default to 100] |
| **cursor** | **kotlin.String**| Курсор для пагинации (из meta.paginate.next_page) | [optional] |
| **order** | [**SortOrder**](.md)| Направление сортировки | [optional] [enum: asc, desc] |
| **createdFrom** | **java.time.OffsetDateTime**| Фильтр по дате создания (от) | [optional] |
| **createdTo** | **java.time.OffsetDateTime**| Фильтр по дате создания (до) | [optional] |
| **active** | **kotlin.Boolean**| Фильтр по активности чата | [optional] |
| **chatSubtype** | [**ChatSubtype**](.md)| Фильтр по типу чата | [optional] [enum: discussion, thread] |
| Name | Type | Description  | Notes |
| ------------- | ------------- | ------------- | ------------- |
| **personal** | **kotlin.Boolean**| Фильтр по личным чатам | [optional] |

### Return type

[**SearchOperationsSearchChats200Response**](SearchOperationsSearchChats200Response.md)

### Authorization


Configure BearerAuth:
    ApiClient.accessToken = ""

### HTTP request headers

 - **Content-Type**: Not defined
 - **Accept**: application/json

<a id="searchOperationsSearchMessages"></a>
# **searchOperationsSearchMessages**
> SearchOperationsSearchMessages200Response searchOperationsSearchMessages(query, limit, cursor, order, createdFrom, createdTo, chatIds, userIds, active)



Поиск сообщений  Метод для полнотекстового поиска сообщений.

### Example
```kotlin
// Import classes:
//import org.openapitools.client.infrastructure.*
//import org.openapitools.client.models.*

val apiInstance = SearchApi()
val query : kotlin.String = футболки // kotlin.String | Текст поискового запроса
val limit : kotlin.Int = 10 // kotlin.Int | Количество возвращаемых результатов за один запрос
val cursor : kotlin.String = eyJpZCI6MTAsImRpciI6ImFzYyJ9 // kotlin.String | Курсор для пагинации (из meta.paginate.next_page)
val order : SortOrder = desc // SortOrder | Направление сортировки
val createdFrom : java.time.OffsetDateTime = 2025-01-01T00:00:00.000Z // java.time.OffsetDateTime | Фильтр по дате создания (от)
val createdTo : java.time.OffsetDateTime = 2025-02-01T00:00:00.000Z // java.time.OffsetDateTime | Фильтр по дате создания (до)
val chatIds : kotlin.collections.List<kotlin.Int> = [198,334] // kotlin.collections.List<kotlin.Int> | Фильтр по ID чатов
val userIds : kotlin.collections.List<kotlin.Int> = [12,185] // kotlin.collections.List<kotlin.Int> | Фильтр по ID авторов сообщений
val active : kotlin.Boolean = true // kotlin.Boolean | Фильтр по активности чата
try {
    val result : SearchOperationsSearchMessages200Response = apiInstance.searchOperationsSearchMessages(query, limit, cursor, order, createdFrom, createdTo, chatIds, userIds, active)
    println(result)
} catch (e: ClientException) {
    println("4xx response calling SearchApi#searchOperationsSearchMessages")
    e.printStackTrace()
} catch (e: ServerException) {
    println("5xx response calling SearchApi#searchOperationsSearchMessages")
    e.printStackTrace()
}
```

### Parameters
| **query** | **kotlin.String**| Текст поискового запроса | [optional] |
| **limit** | **kotlin.Int**| Количество возвращаемых результатов за один запрос | [optional] [default to 200] |
| **cursor** | **kotlin.String**| Курсор для пагинации (из meta.paginate.next_page) | [optional] |
| **order** | [**SortOrder**](.md)| Направление сортировки | [optional] [enum: asc, desc] |
| **createdFrom** | **java.time.OffsetDateTime**| Фильтр по дате создания (от) | [optional] |
| **createdTo** | **java.time.OffsetDateTime**| Фильтр по дате создания (до) | [optional] |
| **chatIds** | [**kotlin.collections.List&lt;kotlin.Int&gt;**](kotlin.Int.md)| Фильтр по ID чатов | [optional] |
| **userIds** | [**kotlin.collections.List&lt;kotlin.Int&gt;**](kotlin.Int.md)| Фильтр по ID авторов сообщений | [optional] |
| Name | Type | Description  | Notes |
| ------------- | ------------- | ------------- | ------------- |
| **active** | **kotlin.Boolean**| Фильтр по активности чата | [optional] |

### Return type

[**SearchOperationsSearchMessages200Response**](SearchOperationsSearchMessages200Response.md)

### Authorization


Configure BearerAuth:
    ApiClient.accessToken = ""

### HTTP request headers

 - **Content-Type**: Not defined
 - **Accept**: application/json

<a id="searchOperationsSearchUsers"></a>
# **searchOperationsSearchUsers**
> SearchOperationsSearchUsers200Response searchOperationsSearchUsers(query, limit, cursor, sort, order, createdFrom, createdTo, companyRoles)



Поиск сотрудников  Метод для полнотекстового поиска сотрудников по имени, email, должности и другим полям.

### Example
```kotlin
// Import classes:
//import org.openapitools.client.infrastructure.*
//import org.openapitools.client.models.*

val apiInstance = SearchApi()
val query : kotlin.String = Олег // kotlin.String | Текст поискового запроса
val limit : kotlin.Int = 10 // kotlin.Int | Количество возвращаемых результатов за один запрос
val cursor : kotlin.String = eyJpZCI6MTAsImRpciI6ImFzYyJ9 // kotlin.String | Курсор для пагинации (из meta.paginate.next_page)
val sort : SearchSortOrder = by_score // SearchSortOrder | Сортировка результатов
val order : SortOrder = desc // SortOrder | Направление сортировки
val createdFrom : java.time.OffsetDateTime = 2025-01-01T00:00:00.000Z // java.time.OffsetDateTime | Фильтр по дате создания (от)
val createdTo : java.time.OffsetDateTime = 2025-02-01T00:00:00.000Z // java.time.OffsetDateTime | Фильтр по дате создания (до)
val companyRoles : kotlin.collections.List<UserRole> = ["admin","user"] // kotlin.collections.List<UserRole> | Фильтр по ролям сотрудников
try {
    val result : SearchOperationsSearchUsers200Response = apiInstance.searchOperationsSearchUsers(query, limit, cursor, sort, order, createdFrom, createdTo, companyRoles)
    println(result)
} catch (e: ClientException) {
    println("4xx response calling SearchApi#searchOperationsSearchUsers")
    e.printStackTrace()
} catch (e: ServerException) {
    println("5xx response calling SearchApi#searchOperationsSearchUsers")
    e.printStackTrace()
}
```

### Parameters
| **query** | **kotlin.String**| Текст поискового запроса | [optional] |
| **limit** | **kotlin.Int**| Количество возвращаемых результатов за один запрос | [optional] [default to 200] |
| **cursor** | **kotlin.String**| Курсор для пагинации (из meta.paginate.next_page) | [optional] |
| **sort** | [**SearchSortOrder**](.md)| Сортировка результатов | [optional] [enum: by_score, alphabetical] |
| **order** | [**SortOrder**](.md)| Направление сортировки | [optional] [enum: asc, desc] |
| **createdFrom** | **java.time.OffsetDateTime**| Фильтр по дате создания (от) | [optional] |
| **createdTo** | **java.time.OffsetDateTime**| Фильтр по дате создания (до) | [optional] |
| Name | Type | Description  | Notes |
| ------------- | ------------- | ------------- | ------------- |
| **companyRoles** | [**kotlin.collections.List&lt;UserRole&gt;**](UserRole.md)| Фильтр по ролям сотрудников | [optional] |

### Return type

[**SearchOperationsSearchUsers200Response**](SearchOperationsSearchUsers200Response.md)

### Authorization


Configure BearerAuth:
    ApiClient.accessToken = ""

### HTTP request headers

 - **Content-Type**: Not defined
 - **Accept**: application/json

