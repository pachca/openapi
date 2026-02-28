# ViewsApi

All URIs are relative to *https://api.pachca.com/api/shared/v1*

| Method | HTTP request | Description |
| ------------- | ------------- | ------------- |
| [**formOperationsOpenView**](ViewsApi.md#formOperationsOpenView) | **POST** /views/open |  |


<a id="formOperationsOpenView"></a>
# **formOperationsOpenView**
> formOperationsOpenView(openViewRequest)



Открытие представления  Метод для открытия модального окна с представлением для пользователя.  Чтобы открыть модальное окно с представлением, ваше приложение должно иметь действительный, неистекший &#x60;trigger_id&#x60;.

### Example
```kotlin
// Import classes:
//import org.openapitools.client.infrastructure.*
//import org.openapitools.client.models.*

val apiInstance = ViewsApi()
val openViewRequest : OpenViewRequest =  // OpenViewRequest | 
try {
    apiInstance.formOperationsOpenView(openViewRequest)
} catch (e: ClientException) {
    println("4xx response calling ViewsApi#formOperationsOpenView")
    e.printStackTrace()
} catch (e: ServerException) {
    println("5xx response calling ViewsApi#formOperationsOpenView")
    e.printStackTrace()
}
```

### Parameters
| Name | Type | Description  | Notes |
| ------------- | ------------- | ------------- | ------------- |
| **openViewRequest** | [**OpenViewRequest**](OpenViewRequest.md)|  | |

### Return type

null (empty response body)

### Authorization


Configure BearerAuth:
    ApiClient.accessToken = ""

### HTTP request headers

 - **Content-Type**: application/json
 - **Accept**: application/json

