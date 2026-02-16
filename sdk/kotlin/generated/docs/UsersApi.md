# UsersApi

All URIs are relative to *https://api.pachca.com/api/shared/v1*

| Method | HTTP request | Description |
| ------------- | ------------- | ------------- |
| [**userOperationsCreateUser**](UsersApi.md#userOperationsCreateUser) | **POST** /users |  |
| [**userOperationsDeleteUser**](UsersApi.md#userOperationsDeleteUser) | **DELETE** /users/{id} |  |
| [**userOperationsGetUser**](UsersApi.md#userOperationsGetUser) | **GET** /users/{id} |  |
| [**userOperationsListUsers**](UsersApi.md#userOperationsListUsers) | **GET** /users |  |
| [**userOperationsUpdateUser**](UsersApi.md#userOperationsUpdateUser) | **PUT** /users/{id} |  |


<a id="userOperationsCreateUser"></a>
# **userOperationsCreateUser**
> ProfileOperationsGetProfile200Response userOperationsCreateUser(userCreateRequest)



Создать сотрудника  #admin_access_token_required  Метод для создания нового сотрудника в вашей компании.  Вы можете заполнять дополнительные поля сотрудника, которые созданы в вашей компании. Получить актуальный список идентификаторов дополнительных полей сотрудника вы можете в методе [Список дополнительных полей](GET /custom_properties).

### Example
```kotlin
// Import classes:
//import org.openapitools.client.infrastructure.*
//import org.openapitools.client.models.*

val apiInstance = UsersApi()
val userCreateRequest : UserCreateRequest = {"user":{"first_name":"Олег","last_name":"Петров","email":"olegp@example.com","department":"Продукт","list_tags":["Product","Design"],"custom_properties":[{"id":1678,"value":"Санкт-Петербург"}]},"skip_email_notify":true} // UserCreateRequest | 
try {
    val result : ProfileOperationsGetProfile200Response = apiInstance.userOperationsCreateUser(userCreateRequest)
    println(result)
} catch (e: ClientException) {
    println("4xx response calling UsersApi#userOperationsCreateUser")
    e.printStackTrace()
} catch (e: ServerException) {
    println("5xx response calling UsersApi#userOperationsCreateUser")
    e.printStackTrace()
}
```

### Parameters
| Name | Type | Description  | Notes |
| ------------- | ------------- | ------------- | ------------- |
| **userCreateRequest** | [**UserCreateRequest**](UserCreateRequest.md)|  | |

### Return type

[**ProfileOperationsGetProfile200Response**](ProfileOperationsGetProfile200Response.md)

### Authorization


Configure BearerAuth:
    ApiClient.username = ""
    ApiClient.password = ""

### HTTP request headers

 - **Content-Type**: application/json
 - **Accept**: application/json

<a id="userOperationsDeleteUser"></a>
# **userOperationsDeleteUser**
> kotlin.Any userOperationsDeleteUser(id)



Удаление сотрудника  #admin_access_token_required  Метод для удаления сотрудника.  Для удаления сотрудника вам необходимо знать его &#x60;id&#x60; и указать его в &#x60;URL&#x60; запроса.

### Example
```kotlin
// Import classes:
//import org.openapitools.client.infrastructure.*
//import org.openapitools.client.models.*

val apiInstance = UsersApi()
val id : kotlin.Int = 56 // kotlin.Int | Идентификатор пользователя
try {
    val result : kotlin.Any = apiInstance.userOperationsDeleteUser(id)
    println(result)
} catch (e: ClientException) {
    println("4xx response calling UsersApi#userOperationsDeleteUser")
    e.printStackTrace()
} catch (e: ServerException) {
    println("5xx response calling UsersApi#userOperationsDeleteUser")
    e.printStackTrace()
}
```

### Parameters
| Name | Type | Description  | Notes |
| ------------- | ------------- | ------------- | ------------- |
| **id** | **kotlin.Int**| Идентификатор пользователя | |

### Return type

[**kotlin.Any**](kotlin.Any.md)

### Authorization


Configure BearerAuth:
    ApiClient.username = ""
    ApiClient.password = ""

### HTTP request headers

 - **Content-Type**: Not defined
 - **Accept**: application/json

<a id="userOperationsGetUser"></a>
# **userOperationsGetUser**
> ProfileOperationsGetProfile200Response userOperationsGetUser(id)



Информация о сотруднике  Метод для получения информации о сотруднике.  Для получения сотрудника вам необходимо знать его &#x60;id&#x60; и указать его в &#x60;URL&#x60; запроса.

### Example
```kotlin
// Import classes:
//import org.openapitools.client.infrastructure.*
//import org.openapitools.client.models.*

val apiInstance = UsersApi()
val id : kotlin.Int = 56 // kotlin.Int | Идентификатор пользователя
try {
    val result : ProfileOperationsGetProfile200Response = apiInstance.userOperationsGetUser(id)
    println(result)
} catch (e: ClientException) {
    println("4xx response calling UsersApi#userOperationsGetUser")
    e.printStackTrace()
} catch (e: ServerException) {
    println("5xx response calling UsersApi#userOperationsGetUser")
    e.printStackTrace()
}
```

### Parameters
| Name | Type | Description  | Notes |
| ------------- | ------------- | ------------- | ------------- |
| **id** | **kotlin.Int**| Идентификатор пользователя | |

### Return type

[**ProfileOperationsGetProfile200Response**](ProfileOperationsGetProfile200Response.md)

### Authorization


Configure BearerAuth:
    ApiClient.username = ""
    ApiClient.password = ""

### HTTP request headers

 - **Content-Type**: Not defined
 - **Accept**: application/json

<a id="userOperationsListUsers"></a>
# **userOperationsListUsers**
> ChatMemberOperationsListMembers200Response userOperationsListUsers(query, limit, cursor)



Список сотрудников  Метод для получения актуального списка сотрудников вашей компании.

### Example
```kotlin
// Import classes:
//import org.openapitools.client.infrastructure.*
//import org.openapitools.client.models.*

val apiInstance = UsersApi()
val query : kotlin.String = query_example // kotlin.String | Поисковая фраза для фильтрации результатов. Поиск работает по полям: `first_name` (имя), `last_name` (фамилия), `email` (электронная почта), `phone_number` (телефон) и `nickname` (никнейм).
val limit : kotlin.Int = 56 // kotlin.Int | Количество возвращаемых сущностей за один запрос
val cursor : kotlin.String = cursor_example // kotlin.String | Курсор для пагинации (из `meta.paginate.next_page`)
try {
    val result : ChatMemberOperationsListMembers200Response = apiInstance.userOperationsListUsers(query, limit, cursor)
    println(result)
} catch (e: ClientException) {
    println("4xx response calling UsersApi#userOperationsListUsers")
    e.printStackTrace()
} catch (e: ServerException) {
    println("5xx response calling UsersApi#userOperationsListUsers")
    e.printStackTrace()
}
```

### Parameters
| **query** | **kotlin.String**| Поисковая фраза для фильтрации результатов. Поиск работает по полям: &#x60;first_name&#x60; (имя), &#x60;last_name&#x60; (фамилия), &#x60;email&#x60; (электронная почта), &#x60;phone_number&#x60; (телефон) и &#x60;nickname&#x60; (никнейм). | [optional] |
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

<a id="userOperationsUpdateUser"></a>
# **userOperationsUpdateUser**
> ProfileOperationsGetProfile200Response userOperationsUpdateUser(id, userUpdateRequest)



Редактирование сотрудника  #admin_access_token_required  Метод для редактирования сотрудника.  Для редактирования сотрудника вам необходимо знать его &#x60;id&#x60; и указать его в &#x60;URL&#x60; запроса. Все редактируемые параметры сотрудника указываются в теле запроса. Получить актуальный список идентификаторов дополнительных полей сотрудника вы можете в методе [Список дополнительных полей](GET /custom_properties).

### Example
```kotlin
// Import classes:
//import org.openapitools.client.infrastructure.*
//import org.openapitools.client.models.*

val apiInstance = UsersApi()
val id : kotlin.Int = 56 // kotlin.Int | Идентификатор пользователя
val userUpdateRequest : UserUpdateRequest = {"user":{"nickname":"olegpetrov","role":"user","list_tags":["Product"]}} // UserUpdateRequest | 
try {
    val result : ProfileOperationsGetProfile200Response = apiInstance.userOperationsUpdateUser(id, userUpdateRequest)
    println(result)
} catch (e: ClientException) {
    println("4xx response calling UsersApi#userOperationsUpdateUser")
    e.printStackTrace()
} catch (e: ServerException) {
    println("5xx response calling UsersApi#userOperationsUpdateUser")
    e.printStackTrace()
}
```

### Parameters
| **id** | **kotlin.Int**| Идентификатор пользователя | |
| Name | Type | Description  | Notes |
| ------------- | ------------- | ------------- | ------------- |
| **userUpdateRequest** | [**UserUpdateRequest**](UserUpdateRequest.md)|  | |

### Return type

[**ProfileOperationsGetProfile200Response**](ProfileOperationsGetProfile200Response.md)

### Authorization


Configure BearerAuth:
    ApiClient.username = ""
    ApiClient.password = ""

### HTTP request headers

 - **Content-Type**: application/json
 - **Accept**: application/json

