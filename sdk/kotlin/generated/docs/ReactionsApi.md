# ReactionsApi

All URIs are relative to *https://api.pachca.com/api/shared/v1*

| Method | HTTP request | Description |
| ------------- | ------------- | ------------- |
| [**reactionOperationsAddReaction**](ReactionsApi.md#reactionOperationsAddReaction) | **POST** /messages/{id}/reactions |  |
| [**reactionOperationsListReactions**](ReactionsApi.md#reactionOperationsListReactions) | **GET** /messages/{id}/reactions |  |
| [**reactionOperationsRemoveReaction**](ReactionsApi.md#reactionOperationsRemoveReaction) | **DELETE** /messages/{id}/reactions |  |


<a id="reactionOperationsAddReaction"></a>
# **reactionOperationsAddReaction**
> Reaction reactionOperationsAddReaction(id, reactionRequest)



Добавление реакции  Метод для добавления реакции на сообщение.  Для добавления реакции вам необходимо знать &#x60;id&#x60; сообщения и указать его в &#x60;URL&#x60; запроса. Реакции на сообщения отправляются в виде символов &#x60;Emoji&#x60;. Если пользователь уже ставил реакцию - повторно она установлена не будет. Для удаления реакции надо воспользоваться методом [Удаление реакции](DELETE /messages/{id}/reactions).  **Лимиты реакций:**  - Каждый пользователь может установить не более **20 уникальных** реакций - Сообщение может иметь не более **30 уникальных** реакций - Общее количество реакций на сообщение не может превышать **1000**

### Example
```kotlin
// Import classes:
//import org.openapitools.client.infrastructure.*
//import org.openapitools.client.models.*

val apiInstance = ReactionsApi()
val id : kotlin.Int = 56 // kotlin.Int | Идентификатор сообщения
val reactionRequest : ReactionRequest = {"code":"👍","name":":+1:"} // ReactionRequest | 
try {
    val result : Reaction = apiInstance.reactionOperationsAddReaction(id, reactionRequest)
    println(result)
} catch (e: ClientException) {
    println("4xx response calling ReactionsApi#reactionOperationsAddReaction")
    e.printStackTrace()
} catch (e: ServerException) {
    println("5xx response calling ReactionsApi#reactionOperationsAddReaction")
    e.printStackTrace()
}
```

### Parameters
| **id** | **kotlin.Int**| Идентификатор сообщения | |
| Name | Type | Description  | Notes |
| ------------- | ------------- | ------------- | ------------- |
| **reactionRequest** | [**ReactionRequest**](ReactionRequest.md)|  | |

### Return type

[**Reaction**](Reaction.md)

### Authorization


Configure BearerAuth:
    ApiClient.username = ""
    ApiClient.password = ""

### HTTP request headers

 - **Content-Type**: application/json
 - **Accept**: application/json

<a id="reactionOperationsListReactions"></a>
# **reactionOperationsListReactions**
> ReactionOperationsListReactions200Response reactionOperationsListReactions(id, limit, cursor)



Список реакций  Метод для получения актуального списка реакций на сообщение.

### Example
```kotlin
// Import classes:
//import org.openapitools.client.infrastructure.*
//import org.openapitools.client.models.*

val apiInstance = ReactionsApi()
val id : kotlin.Int = 56 // kotlin.Int | Идентификатор сообщения
val limit : kotlin.Int = 56 // kotlin.Int | Количество возвращаемых сущностей за один запрос
val cursor : kotlin.String = cursor_example // kotlin.String | Курсор для пагинации (из `meta.paginate.next_page`)
try {
    val result : ReactionOperationsListReactions200Response = apiInstance.reactionOperationsListReactions(id, limit, cursor)
    println(result)
} catch (e: ClientException) {
    println("4xx response calling ReactionsApi#reactionOperationsListReactions")
    e.printStackTrace()
} catch (e: ServerException) {
    println("5xx response calling ReactionsApi#reactionOperationsListReactions")
    e.printStackTrace()
}
```

### Parameters
| **id** | **kotlin.Int**| Идентификатор сообщения | |
| **limit** | **kotlin.Int**| Количество возвращаемых сущностей за один запрос | [optional] [default to 50] |
| Name | Type | Description  | Notes |
| ------------- | ------------- | ------------- | ------------- |
| **cursor** | **kotlin.String**| Курсор для пагинации (из &#x60;meta.paginate.next_page&#x60;) | [optional] |

### Return type

[**ReactionOperationsListReactions200Response**](ReactionOperationsListReactions200Response.md)

### Authorization


Configure BearerAuth:
    ApiClient.username = ""
    ApiClient.password = ""

### HTTP request headers

 - **Content-Type**: Not defined
 - **Accept**: application/json

<a id="reactionOperationsRemoveReaction"></a>
# **reactionOperationsRemoveReaction**
> kotlin.Any reactionOperationsRemoveReaction(id, code, name)



Удаление реакции  Метод для удаления реакции на сообщение.  Для удаления реакции вам необходимо знать &#x60;id&#x60; сообщения и указать его в &#x60;URL&#x60; запроса. Реакции на сообщения хранятся в виде символов &#x60;Emoji&#x60;.  Удалять можно только те реакции, которые были поставлены авторизованным пользователем.

### Example
```kotlin
// Import classes:
//import org.openapitools.client.infrastructure.*
//import org.openapitools.client.models.*

val apiInstance = ReactionsApi()
val id : kotlin.Int = 56 // kotlin.Int | Идентификатор сообщения
val code : kotlin.String = code_example // kotlin.String | Emoji символ реакции
val name : kotlin.String = name_example // kotlin.String | Текстовое имя эмодзи (используется для кастомных эмодзи)
try {
    val result : kotlin.Any = apiInstance.reactionOperationsRemoveReaction(id, code, name)
    println(result)
} catch (e: ClientException) {
    println("4xx response calling ReactionsApi#reactionOperationsRemoveReaction")
    e.printStackTrace()
} catch (e: ServerException) {
    println("5xx response calling ReactionsApi#reactionOperationsRemoveReaction")
    e.printStackTrace()
}
```

### Parameters
| **id** | **kotlin.Int**| Идентификатор сообщения | |
| **code** | **kotlin.String**| Emoji символ реакции | |
| Name | Type | Description  | Notes |
| ------------- | ------------- | ------------- | ------------- |
| **name** | **kotlin.String**| Текстовое имя эмодзи (используется для кастомных эмодзи) | [optional] |

### Return type

[**kotlin.Any**](kotlin.Any.md)

### Authorization


Configure BearerAuth:
    ApiClient.username = ""
    ApiClient.password = ""

### HTTP request headers

 - **Content-Type**: Not defined
 - **Accept**: application/json

