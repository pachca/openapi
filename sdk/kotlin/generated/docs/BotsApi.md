# BotsApi

All URIs are relative to *https://api.pachca.com/api/shared/v1*

| Method | HTTP request | Description |
| ------------- | ------------- | ------------- |
| [**botOperationsDeleteWebhookEvent**](BotsApi.md#botOperationsDeleteWebhookEvent) | **DELETE** /webhooks/events/{id} |  |
| [**botOperationsGetWebhookEvents**](BotsApi.md#botOperationsGetWebhookEvents) | **GET** /webhooks/events |  |
| [**botOperationsUpdateBot**](BotsApi.md#botOperationsUpdateBot) | **PUT** /bots/{id} |  |


<a id="botOperationsDeleteWebhookEvent"></a>
# **botOperationsDeleteWebhookEvent**
> kotlin.Any botOperationsDeleteWebhookEvent(id)



Удаление события  Данный метод доступен для работы только с &#x60;access_token&#x60; бота  Метод для удаления события из истории событий бота.  Для удаления события вам необходимо знать &#x60;access_token&#x60; бота, которому принадлежит событие, и &#x60;id&#x60; события.

### Example
```kotlin
// Import classes:
//import org.openapitools.client.infrastructure.*
//import org.openapitools.client.models.*

val apiInstance = BotsApi()
val id : kotlin.String = id_example // kotlin.String | Идентификатор события
try {
    val result : kotlin.Any = apiInstance.botOperationsDeleteWebhookEvent(id)
    println(result)
} catch (e: ClientException) {
    println("4xx response calling BotsApi#botOperationsDeleteWebhookEvent")
    e.printStackTrace()
} catch (e: ServerException) {
    println("5xx response calling BotsApi#botOperationsDeleteWebhookEvent")
    e.printStackTrace()
}
```

### Parameters
| Name | Type | Description  | Notes |
| ------------- | ------------- | ------------- | ------------- |
| **id** | **kotlin.String**| Идентификатор события | |

### Return type

[**kotlin.Any**](kotlin.Any.md)

### Authorization


Configure BearerAuth:
    ApiClient.accessToken = ""

### HTTP request headers

 - **Content-Type**: Not defined
 - **Accept**: application/json

<a id="botOperationsGetWebhookEvents"></a>
# **botOperationsGetWebhookEvents**
> BotOperationsGetWebhookEvents200Response botOperationsGetWebhookEvents(limit, cursor)



История событий  #bot_access_token_required  Метод для получения истории последних событий бота. Данный метод будет полезен, если вы не можете получать события в реальном времени на ваш &#x60;URL&#x60;, но вам требуется обрабатывать все события, на которые вы подписались.  История событий сохраняется только при активном пункте «Сохранять историю событий» во вкладке «Исходящий webhook» настроек бота. При этом указывать «Webhook &#x60;URL&#x60;» не требуется.  Для получения истории событий конкретного бота вам необходимо знать его &#x60;access_token&#x60; и использовать его при запросе. Каждое событие представляет &#x60;JSON&#x60; объект вебхука.

### Example
```kotlin
// Import classes:
//import org.openapitools.client.infrastructure.*
//import org.openapitools.client.models.*

val apiInstance = BotsApi()
val limit : kotlin.Int = 56 // kotlin.Int | Количество возвращаемых сущностей за один запрос
val cursor : kotlin.String = cursor_example // kotlin.String | Курсор для пагинации (из meta.paginate.next_page)
try {
    val result : BotOperationsGetWebhookEvents200Response = apiInstance.botOperationsGetWebhookEvents(limit, cursor)
    println(result)
} catch (e: ClientException) {
    println("4xx response calling BotsApi#botOperationsGetWebhookEvents")
    e.printStackTrace()
} catch (e: ServerException) {
    println("5xx response calling BotsApi#botOperationsGetWebhookEvents")
    e.printStackTrace()
}
```

### Parameters
| **limit** | **kotlin.Int**| Количество возвращаемых сущностей за один запрос | [optional] [default to 50] |
| Name | Type | Description  | Notes |
| ------------- | ------------- | ------------- | ------------- |
| **cursor** | **kotlin.String**| Курсор для пагинации (из meta.paginate.next_page) | [optional] |

### Return type

[**BotOperationsGetWebhookEvents200Response**](BotOperationsGetWebhookEvents200Response.md)

### Authorization


Configure BearerAuth:
    ApiClient.accessToken = ""

### HTTP request headers

 - **Content-Type**: Not defined
 - **Accept**: application/json

<a id="botOperationsUpdateBot"></a>
# **botOperationsUpdateBot**
> BotOperationsUpdateBot200Response botOperationsUpdateBot(id, botUpdateRequest)



Редактирование бота  Метод для редактирования бота.  Для редактирования бота вам необходимо знать его &#x60;user_id&#x60; и указать его в &#x60;URL&#x60; запроса. Все редактируемые параметры бота указываются в теле запроса. Узнать &#x60;user_id&#x60; бота можно в настройках бота во вкладке «API».  Вы не можете редактировать бота, настройки которого вам недоступны (поле «Кто может редактировать настройки бота» находится во вкладке «Основное» в настройках бота).

### Example
```kotlin
// Import classes:
//import org.openapitools.client.infrastructure.*
//import org.openapitools.client.models.*

val apiInstance = BotsApi()
val id : kotlin.Int = 56 // kotlin.Int | Идентификатор бота
val botUpdateRequest : BotUpdateRequest = {"bot":{"webhook":{"outgoing_url":"https://www.website.com/tasks/new"}}} // BotUpdateRequest | 
try {
    val result : BotOperationsUpdateBot200Response = apiInstance.botOperationsUpdateBot(id, botUpdateRequest)
    println(result)
} catch (e: ClientException) {
    println("4xx response calling BotsApi#botOperationsUpdateBot")
    e.printStackTrace()
} catch (e: ServerException) {
    println("5xx response calling BotsApi#botOperationsUpdateBot")
    e.printStackTrace()
}
```

### Parameters
| **id** | **kotlin.Int**| Идентификатор бота | |
| Name | Type | Description  | Notes |
| ------------- | ------------- | ------------- | ------------- |
| **botUpdateRequest** | [**BotUpdateRequest**](BotUpdateRequest.md)|  | |

### Return type

[**BotOperationsUpdateBot200Response**](BotOperationsUpdateBot200Response.md)

### Authorization


Configure BearerAuth:
    ApiClient.accessToken = ""

### HTTP request headers

 - **Content-Type**: application/json
 - **Accept**: application/json

