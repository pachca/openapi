# ReadMemberApi

All URIs are relative to *https://api.pachca.com/api/shared/v1*

| Method | HTTP request | Description |
| ------------- | ------------- | ------------- |
| [**readMemberOperationsListReadMembers**](ReadMemberApi.md#readMemberOperationsListReadMembers) | **GET** /messages/{id}/read_member_ids |  |


<a id="readMemberOperationsListReadMembers"></a>
# **readMemberOperationsListReadMembers**
> ReadMemberOperationsListReadMembers200Response readMemberOperationsListReadMembers(id, limit, cursor)



Список прочитавших сообщение  Метод для получения актуального списка пользователей, прочитавших сообщение.

### Example
```kotlin
// Import classes:
//import org.openapitools.client.infrastructure.*
//import org.openapitools.client.models.*

val apiInstance = ReadMemberApi()
val id : kotlin.Int = 194275 // kotlin.Int | Идентификатор сообщения
val limit : kotlin.Int = 300 // kotlin.Int | Количество возвращаемых сущностей за один запрос
val cursor : kotlin.String = eyJpZCI6MTAsImRpciI6ImFzYyJ9 // kotlin.String | Курсор для пагинации (из `meta.paginate.next_page`)
try {
    val result : ReadMemberOperationsListReadMembers200Response = apiInstance.readMemberOperationsListReadMembers(id, limit, cursor)
    println(result)
} catch (e: ClientException) {
    println("4xx response calling ReadMemberApi#readMemberOperationsListReadMembers")
    e.printStackTrace()
} catch (e: ServerException) {
    println("5xx response calling ReadMemberApi#readMemberOperationsListReadMembers")
    e.printStackTrace()
}
```

### Parameters
| **id** | **kotlin.Int**| Идентификатор сообщения | |
| **limit** | **kotlin.Int**| Количество возвращаемых сущностей за один запрос | [optional] [default to 300] |
| Name | Type | Description  | Notes |
| ------------- | ------------- | ------------- | ------------- |
| **cursor** | **kotlin.String**| Курсор для пагинации (из &#x60;meta.paginate.next_page&#x60;) | [optional] |

### Return type

[**ReadMemberOperationsListReadMembers200Response**](ReadMemberOperationsListReadMembers200Response.md)

### Authorization


Configure BearerAuth:
    ApiClient.accessToken = ""

### HTTP request headers

 - **Content-Type**: Not defined
 - **Accept**: application/json

