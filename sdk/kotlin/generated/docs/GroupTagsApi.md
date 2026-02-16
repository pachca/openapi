# GroupTagsApi

All URIs are relative to *https://api.pachca.com/api/shared/v1*

| Method | HTTP request | Description |
| ------------- | ------------- | ------------- |
| [**groupTagOperationsCreateTag**](GroupTagsApi.md#groupTagOperationsCreateTag) | **POST** /group_tags |  |
| [**groupTagOperationsDeleteTag**](GroupTagsApi.md#groupTagOperationsDeleteTag) | **DELETE** /group_tags/{id} |  |
| [**groupTagOperationsGetTag**](GroupTagsApi.md#groupTagOperationsGetTag) | **GET** /group_tags/{id} |  |
| [**groupTagOperationsGetTagUsers**](GroupTagsApi.md#groupTagOperationsGetTagUsers) | **GET** /group_tags/{id}/users |  |
| [**groupTagOperationsListTags**](GroupTagsApi.md#groupTagOperationsListTags) | **GET** /group_tags |  |
| [**groupTagOperationsUpdateTag**](GroupTagsApi.md#groupTagOperationsUpdateTag) | **PUT** /group_tags/{id} |  |


<a id="groupTagOperationsCreateTag"></a>
# **groupTagOperationsCreateTag**
> GroupTagOperationsCreateTag201Response groupTagOperationsCreateTag(groupTagRequest)



Новый тег  #admin_access_token_required  Метод для создания нового тега.

### Example
```kotlin
// Import classes:
//import org.openapitools.client.infrastructure.*
//import org.openapitools.client.models.*

val apiInstance = GroupTagsApi()
val groupTagRequest : GroupTagRequest = {"group_tag":{"name":"Название тега"}} // GroupTagRequest | 
try {
    val result : GroupTagOperationsCreateTag201Response = apiInstance.groupTagOperationsCreateTag(groupTagRequest)
    println(result)
} catch (e: ClientException) {
    println("4xx response calling GroupTagsApi#groupTagOperationsCreateTag")
    e.printStackTrace()
} catch (e: ServerException) {
    println("5xx response calling GroupTagsApi#groupTagOperationsCreateTag")
    e.printStackTrace()
}
```

### Parameters
| Name | Type | Description  | Notes |
| ------------- | ------------- | ------------- | ------------- |
| **groupTagRequest** | [**GroupTagRequest**](GroupTagRequest.md)|  | |

### Return type

[**GroupTagOperationsCreateTag201Response**](GroupTagOperationsCreateTag201Response.md)

### Authorization


Configure BearerAuth:
    ApiClient.username = ""
    ApiClient.password = ""

### HTTP request headers

 - **Content-Type**: application/json
 - **Accept**: application/json

<a id="groupTagOperationsDeleteTag"></a>
# **groupTagOperationsDeleteTag**
> kotlin.Any groupTagOperationsDeleteTag(id)



Удаление тега  #admin_access_token_required  Метод для удаления тега.  Для удаления тега вам необходимо знать его &#x60;id&#x60; и указать его в &#x60;URL&#x60; запроса.

### Example
```kotlin
// Import classes:
//import org.openapitools.client.infrastructure.*
//import org.openapitools.client.models.*

val apiInstance = GroupTagsApi()
val id : kotlin.Int = 56 // kotlin.Int | Идентификатор тега
try {
    val result : kotlin.Any = apiInstance.groupTagOperationsDeleteTag(id)
    println(result)
} catch (e: ClientException) {
    println("4xx response calling GroupTagsApi#groupTagOperationsDeleteTag")
    e.printStackTrace()
} catch (e: ServerException) {
    println("5xx response calling GroupTagsApi#groupTagOperationsDeleteTag")
    e.printStackTrace()
}
```

### Parameters
| Name | Type | Description  | Notes |
| ------------- | ------------- | ------------- | ------------- |
| **id** | **kotlin.Int**| Идентификатор тега | |

### Return type

[**kotlin.Any**](kotlin.Any.md)

### Authorization


Configure BearerAuth:
    ApiClient.username = ""
    ApiClient.password = ""

### HTTP request headers

 - **Content-Type**: Not defined
 - **Accept**: application/json

<a id="groupTagOperationsGetTag"></a>
# **groupTagOperationsGetTag**
> GroupTagOperationsCreateTag201Response groupTagOperationsGetTag(id)



Информация о теге  Метод для получения информации о теге. Названия тегов являются уникальными в компании.  Для получения тега вам необходимо знать его &#x60;id&#x60; и указать его в &#x60;URL&#x60; запроса.

### Example
```kotlin
// Import classes:
//import org.openapitools.client.infrastructure.*
//import org.openapitools.client.models.*

val apiInstance = GroupTagsApi()
val id : kotlin.Int = 56 // kotlin.Int | Идентификатор тега
try {
    val result : GroupTagOperationsCreateTag201Response = apiInstance.groupTagOperationsGetTag(id)
    println(result)
} catch (e: ClientException) {
    println("4xx response calling GroupTagsApi#groupTagOperationsGetTag")
    e.printStackTrace()
} catch (e: ServerException) {
    println("5xx response calling GroupTagsApi#groupTagOperationsGetTag")
    e.printStackTrace()
}
```

### Parameters
| Name | Type | Description  | Notes |
| ------------- | ------------- | ------------- | ------------- |
| **id** | **kotlin.Int**| Идентификатор тега | |

### Return type

[**GroupTagOperationsCreateTag201Response**](GroupTagOperationsCreateTag201Response.md)

### Authorization


Configure BearerAuth:
    ApiClient.username = ""
    ApiClient.password = ""

### HTTP request headers

 - **Content-Type**: Not defined
 - **Accept**: application/json

<a id="groupTagOperationsGetTagUsers"></a>
# **groupTagOperationsGetTagUsers**
> ChatMemberOperationsListMembers200Response groupTagOperationsGetTagUsers(id, limit, cursor)



Список сотрудников тега  Метод для получения актуального списка сотрудников тега.

### Example
```kotlin
// Import classes:
//import org.openapitools.client.infrastructure.*
//import org.openapitools.client.models.*

val apiInstance = GroupTagsApi()
val id : kotlin.Int = 56 // kotlin.Int | Идентификатор тега
val limit : kotlin.Int = 56 // kotlin.Int | Количество возвращаемых сущностей за один запрос
val cursor : kotlin.String = cursor_example // kotlin.String | Курсор для пагинации (из `meta.paginate.next_page`)
try {
    val result : ChatMemberOperationsListMembers200Response = apiInstance.groupTagOperationsGetTagUsers(id, limit, cursor)
    println(result)
} catch (e: ClientException) {
    println("4xx response calling GroupTagsApi#groupTagOperationsGetTagUsers")
    e.printStackTrace()
} catch (e: ServerException) {
    println("5xx response calling GroupTagsApi#groupTagOperationsGetTagUsers")
    e.printStackTrace()
}
```

### Parameters
| **id** | **kotlin.Int**| Идентификатор тега | |
| **limit** | **kotlin.Int**| Количество возвращаемых сущностей за один запрос | [optional] [default to 50] |
| Name | Type | Description  | Notes |
| ------------- | ------------- | ------------- | ------------- |
| **cursor** | **kotlin.String**| Курсор для пагинации (из &#x60;meta.paginate.next_page&#x60;) | [optional] |

### Return type

[**ChatMemberOperationsListMembers200Response**](ChatMemberOperationsListMembers200Response.md)

### Authorization


Configure BearerAuth:
    ApiClient.username = ""
    ApiClient.password = ""

### HTTP request headers

 - **Content-Type**: Not defined
 - **Accept**: application/json

<a id="groupTagOperationsListTags"></a>
# **groupTagOperationsListTags**
> GroupTagOperationsListTags200Response groupTagOperationsListTags(names, limit, cursor)



Список тегов сотрудников  Метод для получения актуального списка тегов сотрудников. Названия тегов являются уникальными в компании.

### Example
```kotlin
// Import classes:
//import org.openapitools.client.infrastructure.*
//import org.openapitools.client.models.*

val apiInstance = GroupTagsApi()
val names : kotlin.collections.List<kotlin.String> =  // kotlin.collections.List<kotlin.String> | Массив названий тегов, по которым вы хотите отфильтровать список
val limit : kotlin.Int = 56 // kotlin.Int | Количество возвращаемых сущностей за один запрос
val cursor : kotlin.String = cursor_example // kotlin.String | Курсор для пагинации (из `meta.paginate.next_page`)
try {
    val result : GroupTagOperationsListTags200Response = apiInstance.groupTagOperationsListTags(names, limit, cursor)
    println(result)
} catch (e: ClientException) {
    println("4xx response calling GroupTagsApi#groupTagOperationsListTags")
    e.printStackTrace()
} catch (e: ServerException) {
    println("5xx response calling GroupTagsApi#groupTagOperationsListTags")
    e.printStackTrace()
}
```

### Parameters
| **names** | [**kotlin.collections.List&lt;kotlin.String&gt;**](kotlin.String.md)| Массив названий тегов, по которым вы хотите отфильтровать список | [optional] |
| **limit** | **kotlin.Int**| Количество возвращаемых сущностей за один запрос | [optional] [default to 50] |
| Name | Type | Description  | Notes |
| ------------- | ------------- | ------------- | ------------- |
| **cursor** | **kotlin.String**| Курсор для пагинации (из &#x60;meta.paginate.next_page&#x60;) | [optional] |

### Return type

[**GroupTagOperationsListTags200Response**](GroupTagOperationsListTags200Response.md)

### Authorization


Configure BearerAuth:
    ApiClient.username = ""
    ApiClient.password = ""

### HTTP request headers

 - **Content-Type**: Not defined
 - **Accept**: application/json

<a id="groupTagOperationsUpdateTag"></a>
# **groupTagOperationsUpdateTag**
> GroupTagOperationsCreateTag201Response groupTagOperationsUpdateTag(id, groupTagRequest)



Редактирование тега  #admin_access_token_required  Метод для редактирования тега.  Для редактирования тега вам необходимо знать его &#x60;id&#x60; и указать его в &#x60;URL&#x60; запроса. Все редактируемые параметры тега указываются в теле запроса.

### Example
```kotlin
// Import classes:
//import org.openapitools.client.infrastructure.*
//import org.openapitools.client.models.*

val apiInstance = GroupTagsApi()
val id : kotlin.Int = 56 // kotlin.Int | Идентификатор тега
val groupTagRequest : GroupTagRequest = {"group_tag":{"name":"Новое название тега"}} // GroupTagRequest | 
try {
    val result : GroupTagOperationsCreateTag201Response = apiInstance.groupTagOperationsUpdateTag(id, groupTagRequest)
    println(result)
} catch (e: ClientException) {
    println("4xx response calling GroupTagsApi#groupTagOperationsUpdateTag")
    e.printStackTrace()
} catch (e: ServerException) {
    println("5xx response calling GroupTagsApi#groupTagOperationsUpdateTag")
    e.printStackTrace()
}
```

### Parameters
| **id** | **kotlin.Int**| Идентификатор тега | |
| Name | Type | Description  | Notes |
| ------------- | ------------- | ------------- | ------------- |
| **groupTagRequest** | [**GroupTagRequest**](GroupTagRequest.md)|  | |

### Return type

[**GroupTagOperationsCreateTag201Response**](GroupTagOperationsCreateTag201Response.md)

### Authorization


Configure BearerAuth:
    ApiClient.username = ""
    ApiClient.password = ""

### HTTP request headers

 - **Content-Type**: application/json
 - **Accept**: application/json

