# TasksApi

All URIs are relative to *https://api.pachca.com/api/shared/v1*

| Method | HTTP request | Description |
| ------------- | ------------- | ------------- |
| [**taskOperationsCreateTask**](TasksApi.md#taskOperationsCreateTask) | **POST** /tasks |  |
| [**taskOperationsDeleteTask**](TasksApi.md#taskOperationsDeleteTask) | **DELETE** /tasks/{id} |  |
| [**taskOperationsGetTask**](TasksApi.md#taskOperationsGetTask) | **GET** /tasks/{id} |  |
| [**taskOperationsListTasks**](TasksApi.md#taskOperationsListTasks) | **GET** /tasks |  |
| [**taskOperationsUpdateTask**](TasksApi.md#taskOperationsUpdateTask) | **PUT** /tasks/{id} |  |


<a id="taskOperationsCreateTask"></a>
# **taskOperationsCreateTask**
> TaskOperationsCreateTask201Response taskOperationsCreateTask(taskCreateRequest)



Новое напоминание  Метод для создания нового напоминания.  При создании напоминания обязательным условием является указания типа напоминания: звонок, встреча, простое напоминание, событие или письмо. При этом не требуется дополнительное описание - вы просто создадите напоминание с соответствующим текстом. Если вы укажите описание напоминания - то именно оно и станет текстом напоминания.  У напоминания должны быть ответственные, если их не указывать - ответственным назначается вы.  Ответственным для напоминания без привязки к каким-либо сущностям может стать любой сотрудник компании. Актуальный состав сотрудников компании вы можете получить в методе [список сотрудников](GET /users).  Напоминание можно привязать к чату, указав &#x60;chat_id&#x60;. Для привязки к чату необходимо быть его участником.

### Example
```kotlin
// Import classes:
//import org.openapitools.client.infrastructure.*
//import org.openapitools.client.models.*

val apiInstance = TasksApi()
val taskCreateRequest : TaskCreateRequest = {"task":{"kind":"reminder","content":"Забрать со склада 21 заказ","due_at":"2020-06-05T12:00:00.000+03:00","priority":2,"custom_properties":[{"id":78,"value":"Синий склад"}]}} // TaskCreateRequest | 
try {
    val result : TaskOperationsCreateTask201Response = apiInstance.taskOperationsCreateTask(taskCreateRequest)
    println(result)
} catch (e: ClientException) {
    println("4xx response calling TasksApi#taskOperationsCreateTask")
    e.printStackTrace()
} catch (e: ServerException) {
    println("5xx response calling TasksApi#taskOperationsCreateTask")
    e.printStackTrace()
}
```

### Parameters
| Name | Type | Description  | Notes |
| ------------- | ------------- | ------------- | ------------- |
| **taskCreateRequest** | [**TaskCreateRequest**](TaskCreateRequest.md)|  | |

### Return type

[**TaskOperationsCreateTask201Response**](TaskOperationsCreateTask201Response.md)

### Authorization


Configure BearerAuth:
    ApiClient.accessToken = ""

### HTTP request headers

 - **Content-Type**: application/json
 - **Accept**: application/json

<a id="taskOperationsDeleteTask"></a>
# **taskOperationsDeleteTask**
> kotlin.Any taskOperationsDeleteTask(id)



Удаление напоминания  Метод для удаления напоминания.  Для удаления напоминания вам необходимо знать его &#x60;id&#x60; и указать его в &#x60;URL&#x60; запроса.

### Example
```kotlin
// Import classes:
//import org.openapitools.client.infrastructure.*
//import org.openapitools.client.models.*

val apiInstance = TasksApi()
val id : kotlin.Int = 56 // kotlin.Int | Идентификатор напоминания
try {
    val result : kotlin.Any = apiInstance.taskOperationsDeleteTask(id)
    println(result)
} catch (e: ClientException) {
    println("4xx response calling TasksApi#taskOperationsDeleteTask")
    e.printStackTrace()
} catch (e: ServerException) {
    println("5xx response calling TasksApi#taskOperationsDeleteTask")
    e.printStackTrace()
}
```

### Parameters
| Name | Type | Description  | Notes |
| ------------- | ------------- | ------------- | ------------- |
| **id** | **kotlin.Int**| Идентификатор напоминания | |

### Return type

[**kotlin.Any**](kotlin.Any.md)

### Authorization


Configure BearerAuth:
    ApiClient.accessToken = ""

### HTTP request headers

 - **Content-Type**: Not defined
 - **Accept**: application/json

<a id="taskOperationsGetTask"></a>
# **taskOperationsGetTask**
> TaskOperationsCreateTask201Response taskOperationsGetTask(id)



Информация о напоминании  Метод для получения информации о напоминании.  Для получения напоминания вам необходимо знать его &#x60;id&#x60; и указать его в &#x60;URL&#x60; запроса.

### Example
```kotlin
// Import classes:
//import org.openapitools.client.infrastructure.*
//import org.openapitools.client.models.*

val apiInstance = TasksApi()
val id : kotlin.Int = 56 // kotlin.Int | Идентификатор напоминания
try {
    val result : TaskOperationsCreateTask201Response = apiInstance.taskOperationsGetTask(id)
    println(result)
} catch (e: ClientException) {
    println("4xx response calling TasksApi#taskOperationsGetTask")
    e.printStackTrace()
} catch (e: ServerException) {
    println("5xx response calling TasksApi#taskOperationsGetTask")
    e.printStackTrace()
}
```

### Parameters
| Name | Type | Description  | Notes |
| ------------- | ------------- | ------------- | ------------- |
| **id** | **kotlin.Int**| Идентификатор напоминания | |

### Return type

[**TaskOperationsCreateTask201Response**](TaskOperationsCreateTask201Response.md)

### Authorization


Configure BearerAuth:
    ApiClient.accessToken = ""

### HTTP request headers

 - **Content-Type**: Not defined
 - **Accept**: application/json

<a id="taskOperationsListTasks"></a>
# **taskOperationsListTasks**
> TaskOperationsListTasks200Response taskOperationsListTasks(limit, cursor)



Список напоминаний  Метод для получения списка напоминаний.

### Example
```kotlin
// Import classes:
//import org.openapitools.client.infrastructure.*
//import org.openapitools.client.models.*

val apiInstance = TasksApi()
val limit : kotlin.Int = 56 // kotlin.Int | Количество возвращаемых сущностей за один запрос
val cursor : kotlin.String = cursor_example // kotlin.String | Курсор для пагинации (из `meta.paginate.next_page`)
try {
    val result : TaskOperationsListTasks200Response = apiInstance.taskOperationsListTasks(limit, cursor)
    println(result)
} catch (e: ClientException) {
    println("4xx response calling TasksApi#taskOperationsListTasks")
    e.printStackTrace()
} catch (e: ServerException) {
    println("5xx response calling TasksApi#taskOperationsListTasks")
    e.printStackTrace()
}
```

### Parameters
| **limit** | **kotlin.Int**| Количество возвращаемых сущностей за один запрос | [optional] [default to 50] |
| Name | Type | Description  | Notes |
| ------------- | ------------- | ------------- | ------------- |
| **cursor** | **kotlin.String**| Курсор для пагинации (из &#x60;meta.paginate.next_page&#x60;) | [optional] |

### Return type

[**TaskOperationsListTasks200Response**](TaskOperationsListTasks200Response.md)

### Authorization


Configure BearerAuth:
    ApiClient.accessToken = ""

### HTTP request headers

 - **Content-Type**: Not defined
 - **Accept**: application/json

<a id="taskOperationsUpdateTask"></a>
# **taskOperationsUpdateTask**
> TaskOperationsCreateTask201Response taskOperationsUpdateTask(id, taskUpdateRequest)



Редактирование напоминания  Метод для редактирования напоминания.  Для редактирования напоминания вам необходимо знать его &#x60;id&#x60; и указать его в &#x60;URL&#x60; запроса. Все редактируемые параметры напоминания указываются в теле запроса.

### Example
```kotlin
// Import classes:
//import org.openapitools.client.infrastructure.*
//import org.openapitools.client.models.*

val apiInstance = TasksApi()
val id : kotlin.Int = 56 // kotlin.Int | Идентификатор напоминания
val taskUpdateRequest : TaskUpdateRequest = {"task":{"status":"done"}} // TaskUpdateRequest | 
try {
    val result : TaskOperationsCreateTask201Response = apiInstance.taskOperationsUpdateTask(id, taskUpdateRequest)
    println(result)
} catch (e: ClientException) {
    println("4xx response calling TasksApi#taskOperationsUpdateTask")
    e.printStackTrace()
} catch (e: ServerException) {
    println("5xx response calling TasksApi#taskOperationsUpdateTask")
    e.printStackTrace()
}
```

### Parameters
| **id** | **kotlin.Int**| Идентификатор напоминания | |
| Name | Type | Description  | Notes |
| ------------- | ------------- | ------------- | ------------- |
| **taskUpdateRequest** | [**TaskUpdateRequest**](TaskUpdateRequest.md)|  | |

### Return type

[**TaskOperationsCreateTask201Response**](TaskOperationsCreateTask201Response.md)

### Authorization


Configure BearerAuth:
    ApiClient.accessToken = ""

### HTTP request headers

 - **Content-Type**: application/json
 - **Accept**: application/json

