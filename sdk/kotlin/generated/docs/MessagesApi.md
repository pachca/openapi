# MessagesApi

All URIs are relative to *https://api.pachca.com/api/shared/v1*

| Method | HTTP request | Description |
| ------------- | ------------- | ------------- |
| [**chatMessageOperationsListChatMessages**](MessagesApi.md#chatMessageOperationsListChatMessages) | **GET** /messages |  |
| [**messageOperationsCreateMessage**](MessagesApi.md#messageOperationsCreateMessage) | **POST** /messages |  |
| [**messageOperationsDeleteMessage**](MessagesApi.md#messageOperationsDeleteMessage) | **DELETE** /messages/{id} |  |
| [**messageOperationsGetMessage**](MessagesApi.md#messageOperationsGetMessage) | **GET** /messages/{id} |  |
| [**messageOperationsPinMessage**](MessagesApi.md#messageOperationsPinMessage) | **POST** /messages/{id}/pin |  |
| [**messageOperationsUnpinMessage**](MessagesApi.md#messageOperationsUnpinMessage) | **DELETE** /messages/{id}/pin |  |
| [**messageOperationsUpdateMessage**](MessagesApi.md#messageOperationsUpdateMessage) | **PUT** /messages/{id} |  |


<a id="chatMessageOperationsListChatMessages"></a>
# **chatMessageOperationsListChatMessages**
> ChatMessageOperationsListChatMessages200Response chatMessageOperationsListChatMessages(chatId, sortLeftCurlyBracketFieldRightCurlyBracket, limit, cursor)



Список сообщений чата  Метод для получения списка сообщений бесед, каналов, тредов и личных сообщений.  Для получения сообщений вам необходимо знать &#x60;chat_id&#x60; требуемой беседы, канала, треда или диалога, и указать его в &#x60;URL&#x60; запроса. Сообщения будут возвращены в порядке убывания даты отправки (то есть, сначала будут идти последние сообщения чата). Для получения более ранних сообщений чата доступны параметры &#x60;limit&#x60; и &#x60;cursor&#x60;.

### Example
```kotlin
// Import classes:
//import org.openapitools.client.infrastructure.*
//import org.openapitools.client.models.*

val apiInstance = MessagesApi()
val chatId : kotlin.Int = 56 // kotlin.Int | Идентификатор чата (беседа, канал, диалог или чат треда)
val sortLeftCurlyBracketFieldRightCurlyBracket : SortOrder =  // SortOrder | Составной параметр сортировки сущностей выборки. На данный момент сортировка доступна только по полю `id` (идентификатор сообщения).
val limit : kotlin.Int = 56 // kotlin.Int | Количество возвращаемых сущностей за один запрос
val cursor : kotlin.String = cursor_example // kotlin.String | Курсор для пагинации (из `meta.paginate.next_page`)
try {
    val result : ChatMessageOperationsListChatMessages200Response = apiInstance.chatMessageOperationsListChatMessages(chatId, sortLeftCurlyBracketFieldRightCurlyBracket, limit, cursor)
    println(result)
} catch (e: ClientException) {
    println("4xx response calling MessagesApi#chatMessageOperationsListChatMessages")
    e.printStackTrace()
} catch (e: ServerException) {
    println("5xx response calling MessagesApi#chatMessageOperationsListChatMessages")
    e.printStackTrace()
}
```

### Parameters
| **chatId** | **kotlin.Int**| Идентификатор чата (беседа, канал, диалог или чат треда) | |
| **sortLeftCurlyBracketFieldRightCurlyBracket** | [**SortOrder**](.md)| Составной параметр сортировки сущностей выборки. На данный момент сортировка доступна только по полю &#x60;id&#x60; (идентификатор сообщения). | [optional] [enum: asc, desc] |
| **limit** | **kotlin.Int**| Количество возвращаемых сущностей за один запрос | [optional] [default to 50] |
| Name | Type | Description  | Notes |
| ------------- | ------------- | ------------- | ------------- |
| **cursor** | **kotlin.String**| Курсор для пагинации (из &#x60;meta.paginate.next_page&#x60;) | [optional] |

### Return type

[**ChatMessageOperationsListChatMessages200Response**](ChatMessageOperationsListChatMessages200Response.md)

### Authorization


Configure BearerAuth:
    ApiClient.accessToken = ""

### HTTP request headers

 - **Content-Type**: Not defined
 - **Accept**: application/json

<a id="messageOperationsCreateMessage"></a>
# **messageOperationsCreateMessage**
> MessageOperationsCreateMessage201Response messageOperationsCreateMessage(messageCreateRequest)



Новое сообщение  Метод для отправки сообщения в беседу или канал, личного сообщения пользователю или комментария в тред.  При использовании &#x60;entity_type: \&quot;discussion\&quot;&#x60; (или просто без указания &#x60;entity_type&#x60;) допускается отправка любого &#x60;chat_id&#x60; в поле &#x60;entity_id&#x60;. То есть, сообщение можно отправить зная только идентификатор чата. При этом, вы имеете возможность отправить сообщение в тред по его идентификатору или личное сообщение по идентификатору пользователя.  Для отправки личного сообщения пользователю создавать чат не требуется. Достаточно указать &#x60;entity_type: \&quot;user\&quot;&#x60; и идентификатор пользователя. Чат будет создан автоматически, если между вами ещё не было переписки. Между двумя пользователями может быть только один личный чат.

### Example
```kotlin
// Import classes:
//import org.openapitools.client.infrastructure.*
//import org.openapitools.client.models.*

val apiInstance = MessagesApi()
val messageCreateRequest : MessageCreateRequest = {"message":{"entity_type":"discussion","entity_id":198,"content":"Вчера мы продали 756 футболок (что на 10% больше, чем в прошлое воскресенье)","buttons":[[{"text":"Подробнее","url":"https://example.com/details"},{"text":"Отлично!","data":"awesome"}]]}} // MessageCreateRequest | 
try {
    val result : MessageOperationsCreateMessage201Response = apiInstance.messageOperationsCreateMessage(messageCreateRequest)
    println(result)
} catch (e: ClientException) {
    println("4xx response calling MessagesApi#messageOperationsCreateMessage")
    e.printStackTrace()
} catch (e: ServerException) {
    println("5xx response calling MessagesApi#messageOperationsCreateMessage")
    e.printStackTrace()
}
```

### Parameters
| Name | Type | Description  | Notes |
| ------------- | ------------- | ------------- | ------------- |
| **messageCreateRequest** | [**MessageCreateRequest**](MessageCreateRequest.md)|  | |

### Return type

[**MessageOperationsCreateMessage201Response**](MessageOperationsCreateMessage201Response.md)

### Authorization


Configure BearerAuth:
    ApiClient.accessToken = ""

### HTTP request headers

 - **Content-Type**: application/json
 - **Accept**: application/json

<a id="messageOperationsDeleteMessage"></a>
# **messageOperationsDeleteMessage**
> kotlin.Any messageOperationsDeleteMessage(id)



Удаление сообщения  Метод для удаления сообщения.  Удаление сообщения доступно отправителю, админам и редакторам в чате. В личных сообщениях оба пользователя являются редакторами. Ограничений по давности отправки сообщения нет.  Для удаления сообщения вам необходимо знать его &#x60;id&#x60; и указать его в &#x60;URL&#x60; запроса.

### Example
```kotlin
// Import classes:
//import org.openapitools.client.infrastructure.*
//import org.openapitools.client.models.*

val apiInstance = MessagesApi()
val id : kotlin.Int = 56 // kotlin.Int | Идентификатор сообщения
try {
    val result : kotlin.Any = apiInstance.messageOperationsDeleteMessage(id)
    println(result)
} catch (e: ClientException) {
    println("4xx response calling MessagesApi#messageOperationsDeleteMessage")
    e.printStackTrace()
} catch (e: ServerException) {
    println("5xx response calling MessagesApi#messageOperationsDeleteMessage")
    e.printStackTrace()
}
```

### Parameters
| Name | Type | Description  | Notes |
| ------------- | ------------- | ------------- | ------------- |
| **id** | **kotlin.Int**| Идентификатор сообщения | |

### Return type

[**kotlin.Any**](kotlin.Any.md)

### Authorization


Configure BearerAuth:
    ApiClient.accessToken = ""

### HTTP request headers

 - **Content-Type**: Not defined
 - **Accept**: application/json

<a id="messageOperationsGetMessage"></a>
# **messageOperationsGetMessage**
> MessageOperationsCreateMessage201Response messageOperationsGetMessage(id)



Информация о сообщении  Метод для получения информации о сообщении.  Для получения сообщения вам необходимо знать его &#x60;id&#x60; и указать его в &#x60;URL&#x60; запроса.

### Example
```kotlin
// Import classes:
//import org.openapitools.client.infrastructure.*
//import org.openapitools.client.models.*

val apiInstance = MessagesApi()
val id : kotlin.Int = 56 // kotlin.Int | Идентификатор сообщения
try {
    val result : MessageOperationsCreateMessage201Response = apiInstance.messageOperationsGetMessage(id)
    println(result)
} catch (e: ClientException) {
    println("4xx response calling MessagesApi#messageOperationsGetMessage")
    e.printStackTrace()
} catch (e: ServerException) {
    println("5xx response calling MessagesApi#messageOperationsGetMessage")
    e.printStackTrace()
}
```

### Parameters
| Name | Type | Description  | Notes |
| ------------- | ------------- | ------------- | ------------- |
| **id** | **kotlin.Int**| Идентификатор сообщения | |

### Return type

[**MessageOperationsCreateMessage201Response**](MessageOperationsCreateMessage201Response.md)

### Authorization


Configure BearerAuth:
    ApiClient.accessToken = ""

### HTTP request headers

 - **Content-Type**: Not defined
 - **Accept**: application/json

<a id="messageOperationsPinMessage"></a>
# **messageOperationsPinMessage**
> kotlin.Any messageOperationsPinMessage(id)



Закрепление сообщения  Метод для закрепления сообщения в чате.  Для закрепления сообщения вам необходимо знать &#x60;id&#x60; сообщения и указать его в &#x60;URL&#x60; запроса.

### Example
```kotlin
// Import classes:
//import org.openapitools.client.infrastructure.*
//import org.openapitools.client.models.*

val apiInstance = MessagesApi()
val id : kotlin.Int = 56 // kotlin.Int | Идентификатор сообщения
try {
    val result : kotlin.Any = apiInstance.messageOperationsPinMessage(id)
    println(result)
} catch (e: ClientException) {
    println("4xx response calling MessagesApi#messageOperationsPinMessage")
    e.printStackTrace()
} catch (e: ServerException) {
    println("5xx response calling MessagesApi#messageOperationsPinMessage")
    e.printStackTrace()
}
```

### Parameters
| Name | Type | Description  | Notes |
| ------------- | ------------- | ------------- | ------------- |
| **id** | **kotlin.Int**| Идентификатор сообщения | |

### Return type

[**kotlin.Any**](kotlin.Any.md)

### Authorization


Configure BearerAuth:
    ApiClient.accessToken = ""

### HTTP request headers

 - **Content-Type**: Not defined
 - **Accept**: application/json

<a id="messageOperationsUnpinMessage"></a>
# **messageOperationsUnpinMessage**
> kotlin.Any messageOperationsUnpinMessage(id)



Открепление сообщения  Метод для открепления сообщения из чата.  Для открепления сообщения вам необходимо знать &#x60;id&#x60; сообщения и указать его в &#x60;URL&#x60; запроса.

### Example
```kotlin
// Import classes:
//import org.openapitools.client.infrastructure.*
//import org.openapitools.client.models.*

val apiInstance = MessagesApi()
val id : kotlin.Int = 56 // kotlin.Int | Идентификатор сообщения
try {
    val result : kotlin.Any = apiInstance.messageOperationsUnpinMessage(id)
    println(result)
} catch (e: ClientException) {
    println("4xx response calling MessagesApi#messageOperationsUnpinMessage")
    e.printStackTrace()
} catch (e: ServerException) {
    println("5xx response calling MessagesApi#messageOperationsUnpinMessage")
    e.printStackTrace()
}
```

### Parameters
| Name | Type | Description  | Notes |
| ------------- | ------------- | ------------- | ------------- |
| **id** | **kotlin.Int**| Идентификатор сообщения | |

### Return type

[**kotlin.Any**](kotlin.Any.md)

### Authorization


Configure BearerAuth:
    ApiClient.accessToken = ""

### HTTP request headers

 - **Content-Type**: Not defined
 - **Accept**: application/json

<a id="messageOperationsUpdateMessage"></a>
# **messageOperationsUpdateMessage**
> MessageOperationsCreateMessage201Response messageOperationsUpdateMessage(id, messageUpdateRequest)



Редактирование сообщения  Метод для редактирования сообщения или комментария.  Для редактирования сообщения вам необходимо знать его &#x60;id&#x60; и указать его в &#x60;URL&#x60; запроса. Все редактируемые параметры сообщения указываются в теле запроса.

### Example
```kotlin
// Import classes:
//import org.openapitools.client.infrastructure.*
//import org.openapitools.client.models.*

val apiInstance = MessagesApi()
val id : kotlin.Int = 56 // kotlin.Int | Идентификатор сообщения
val messageUpdateRequest : MessageUpdateRequest = {"message":{"content":"Вот попробуйте написать правильно это с первого раза: Будущий, Полощи, Прийти, Грейпфрут, Мозаика, Бюллетень, Дуршлаг, Винегрет.","files":[]}} // MessageUpdateRequest | 
try {
    val result : MessageOperationsCreateMessage201Response = apiInstance.messageOperationsUpdateMessage(id, messageUpdateRequest)
    println(result)
} catch (e: ClientException) {
    println("4xx response calling MessagesApi#messageOperationsUpdateMessage")
    e.printStackTrace()
} catch (e: ServerException) {
    println("5xx response calling MessagesApi#messageOperationsUpdateMessage")
    e.printStackTrace()
}
```

### Parameters
| **id** | **kotlin.Int**| Идентификатор сообщения | |
| Name | Type | Description  | Notes |
| ------------- | ------------- | ------------- | ------------- |
| **messageUpdateRequest** | [**MessageUpdateRequest**](MessageUpdateRequest.md)|  | |

### Return type

[**MessageOperationsCreateMessage201Response**](MessageOperationsCreateMessage201Response.md)

### Authorization


Configure BearerAuth:
    ApiClient.accessToken = ""

### HTTP request headers

 - **Content-Type**: application/json
 - **Accept**: application/json

