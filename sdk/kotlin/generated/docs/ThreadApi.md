# ThreadApi

All URIs are relative to *https://api.pachca.com/api/shared/v1*

| Method | HTTP request | Description |
| ------------- | ------------- | ------------- |
| [**threadOperationsCreateThread**](ThreadApi.md#threadOperationsCreateThread) | **POST** /messages/{id}/thread |  |
| [**threadOperationsGetThread**](ThreadApi.md#threadOperationsGetThread) | **GET** /threads/{id} |  |


<a id="threadOperationsCreateThread"></a>
# **threadOperationsCreateThread**
> ThreadOperationsCreateThread201Response threadOperationsCreateThread(id)



Новый тред  Метод для создания нового треда к сообщению.  Если у сообщения уже был создан тред, то в ответе на запрос вернётся информация об уже созданном ранее треде.

### Example
```kotlin
// Import classes:
//import org.openapitools.client.infrastructure.*
//import org.openapitools.client.models.*

val apiInstance = ThreadApi()
val id : kotlin.Int = 154332686 // kotlin.Int | Идентификатор сообщения
try {
    val result : ThreadOperationsCreateThread201Response = apiInstance.threadOperationsCreateThread(id)
    println(result)
} catch (e: ClientException) {
    println("4xx response calling ThreadApi#threadOperationsCreateThread")
    e.printStackTrace()
} catch (e: ServerException) {
    println("5xx response calling ThreadApi#threadOperationsCreateThread")
    e.printStackTrace()
}
```

### Parameters
| Name | Type | Description  | Notes |
| ------------- | ------------- | ------------- | ------------- |
| **id** | **kotlin.Int**| Идентификатор сообщения | |

### Return type

[**ThreadOperationsCreateThread201Response**](ThreadOperationsCreateThread201Response.md)

### Authorization


Configure BearerAuth:
    ApiClient.accessToken = ""

### HTTP request headers

 - **Content-Type**: Not defined
 - **Accept**: application/json

<a id="threadOperationsGetThread"></a>
# **threadOperationsGetThread**
> ThreadOperationsCreateThread201Response threadOperationsGetThread(id)



Информация о треде  Метод для получения информации о треде.  Для получения треда вам необходимо знать его &#x60;id&#x60; и указать его в &#x60;URL&#x60; запроса.

### Example
```kotlin
// Import classes:
//import org.openapitools.client.infrastructure.*
//import org.openapitools.client.models.*

val apiInstance = ThreadApi()
val id : kotlin.Int = 265142 // kotlin.Int | Идентификатор треда
try {
    val result : ThreadOperationsCreateThread201Response = apiInstance.threadOperationsGetThread(id)
    println(result)
} catch (e: ClientException) {
    println("4xx response calling ThreadApi#threadOperationsGetThread")
    e.printStackTrace()
} catch (e: ServerException) {
    println("5xx response calling ThreadApi#threadOperationsGetThread")
    e.printStackTrace()
}
```

### Parameters
| Name | Type | Description  | Notes |
| ------------- | ------------- | ------------- | ------------- |
| **id** | **kotlin.Int**| Идентификатор треда | |

### Return type

[**ThreadOperationsCreateThread201Response**](ThreadOperationsCreateThread201Response.md)

### Authorization


Configure BearerAuth:
    ApiClient.accessToken = ""

### HTTP request headers

 - **Content-Type**: Not defined
 - **Accept**: application/json

