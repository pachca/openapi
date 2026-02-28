# ProfileApi

All URIs are relative to *https://api.pachca.com/api/shared/v1*

| Method | HTTP request | Description |
| ------------- | ------------- | ------------- |
| [**oAuthOperationsGetTokenInfo**](ProfileApi.md#oAuthOperationsGetTokenInfo) | **GET** /oauth/token/info |  |
| [**profileOperationsDeleteStatus**](ProfileApi.md#profileOperationsDeleteStatus) | **DELETE** /profile/status |  |
| [**profileOperationsGetProfile**](ProfileApi.md#profileOperationsGetProfile) | **GET** /profile |  |
| [**profileOperationsGetStatus**](ProfileApi.md#profileOperationsGetStatus) | **GET** /profile/status |  |
| [**profileOperationsUpdateStatus**](ProfileApi.md#profileOperationsUpdateStatus) | **PUT** /profile/status |  |


<a id="oAuthOperationsGetTokenInfo"></a>
# **oAuthOperationsGetTokenInfo**
> OAuthOperationsGetTokenInfo200Response oAuthOperationsGetTokenInfo()



Информация о токене  Метод для получения информации о текущем OAuth токене, включая его скоупы, дату создания и последнего использования. Токен в ответе маскируется — видны только первые 8 и последние 4 символа.

### Example
```kotlin
// Import classes:
//import org.openapitools.client.infrastructure.*
//import org.openapitools.client.models.*

val apiInstance = ProfileApi()
try {
    val result : OAuthOperationsGetTokenInfo200Response = apiInstance.oAuthOperationsGetTokenInfo()
    println(result)
} catch (e: ClientException) {
    println("4xx response calling ProfileApi#oAuthOperationsGetTokenInfo")
    e.printStackTrace()
} catch (e: ServerException) {
    println("5xx response calling ProfileApi#oAuthOperationsGetTokenInfo")
    e.printStackTrace()
}
```

### Parameters
This endpoint does not need any parameter.

### Return type

[**OAuthOperationsGetTokenInfo200Response**](OAuthOperationsGetTokenInfo200Response.md)

### Authorization


Configure BearerAuth:
    ApiClient.accessToken = ""

### HTTP request headers

 - **Content-Type**: Not defined
 - **Accept**: application/json

<a id="profileOperationsDeleteStatus"></a>
# **profileOperationsDeleteStatus**
> profileOperationsDeleteStatus()



Удаление статуса  Метод для удаления своего статуса.

### Example
```kotlin
// Import classes:
//import org.openapitools.client.infrastructure.*
//import org.openapitools.client.models.*

val apiInstance = ProfileApi()
try {
    apiInstance.profileOperationsDeleteStatus()
} catch (e: ClientException) {
    println("4xx response calling ProfileApi#profileOperationsDeleteStatus")
    e.printStackTrace()
} catch (e: ServerException) {
    println("5xx response calling ProfileApi#profileOperationsDeleteStatus")
    e.printStackTrace()
}
```

### Parameters
This endpoint does not need any parameter.

### Return type

null (empty response body)

### Authorization


Configure BearerAuth:
    ApiClient.accessToken = ""

### HTTP request headers

 - **Content-Type**: Not defined
 - **Accept**: application/json

<a id="profileOperationsGetProfile"></a>
# **profileOperationsGetProfile**
> ProfileOperationsGetProfile200Response profileOperationsGetProfile()



Информация о профиле  Метод для получения информации о своем профиле.

### Example
```kotlin
// Import classes:
//import org.openapitools.client.infrastructure.*
//import org.openapitools.client.models.*

val apiInstance = ProfileApi()
try {
    val result : ProfileOperationsGetProfile200Response = apiInstance.profileOperationsGetProfile()
    println(result)
} catch (e: ClientException) {
    println("4xx response calling ProfileApi#profileOperationsGetProfile")
    e.printStackTrace()
} catch (e: ServerException) {
    println("5xx response calling ProfileApi#profileOperationsGetProfile")
    e.printStackTrace()
}
```

### Parameters
This endpoint does not need any parameter.

### Return type

[**ProfileOperationsGetProfile200Response**](ProfileOperationsGetProfile200Response.md)

### Authorization


Configure BearerAuth:
    ApiClient.accessToken = ""

### HTTP request headers

 - **Content-Type**: Not defined
 - **Accept**: application/json

<a id="profileOperationsGetStatus"></a>
# **profileOperationsGetStatus**
> ProfileOperationsGetStatus200Response profileOperationsGetStatus()



Текущий статус  Метод для получения информации о своем статусе.

### Example
```kotlin
// Import classes:
//import org.openapitools.client.infrastructure.*
//import org.openapitools.client.models.*

val apiInstance = ProfileApi()
try {
    val result : ProfileOperationsGetStatus200Response = apiInstance.profileOperationsGetStatus()
    println(result)
} catch (e: ClientException) {
    println("4xx response calling ProfileApi#profileOperationsGetStatus")
    e.printStackTrace()
} catch (e: ServerException) {
    println("5xx response calling ProfileApi#profileOperationsGetStatus")
    e.printStackTrace()
}
```

### Parameters
This endpoint does not need any parameter.

### Return type

[**ProfileOperationsGetStatus200Response**](ProfileOperationsGetStatus200Response.md)

### Authorization


Configure BearerAuth:
    ApiClient.accessToken = ""

### HTTP request headers

 - **Content-Type**: Not defined
 - **Accept**: application/json

<a id="profileOperationsUpdateStatus"></a>
# **profileOperationsUpdateStatus**
> ProfileOperationsUpdateStatus200Response profileOperationsUpdateStatus(statusUpdateRequest)



Новый статус  Метод для установки себе нового статуса.

### Example
```kotlin
// Import classes:
//import org.openapitools.client.infrastructure.*
//import org.openapitools.client.models.*

val apiInstance = ProfileApi()
val statusUpdateRequest : StatusUpdateRequest =  // StatusUpdateRequest | 
try {
    val result : ProfileOperationsUpdateStatus200Response = apiInstance.profileOperationsUpdateStatus(statusUpdateRequest)
    println(result)
} catch (e: ClientException) {
    println("4xx response calling ProfileApi#profileOperationsUpdateStatus")
    e.printStackTrace()
} catch (e: ServerException) {
    println("5xx response calling ProfileApi#profileOperationsUpdateStatus")
    e.printStackTrace()
}
```

### Parameters
| Name | Type | Description  | Notes |
| ------------- | ------------- | ------------- | ------------- |
| **statusUpdateRequest** | [**StatusUpdateRequest**](StatusUpdateRequest.md)|  | |

### Return type

[**ProfileOperationsUpdateStatus200Response**](ProfileOperationsUpdateStatus200Response.md)

### Authorization


Configure BearerAuth:
    ApiClient.accessToken = ""

### HTTP request headers

 - **Content-Type**: application/json
 - **Accept**: application/json

