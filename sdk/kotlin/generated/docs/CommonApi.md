# CommonApi

All URIs are relative to *https://api.pachca.com/api/shared/v1*

| Method | HTTP request | Description |
| ------------- | ------------- | ------------- |
| [**commonOperationsListProperties**](CommonApi.md#commonOperationsListProperties) | **GET** /custom_properties |  |
| [**directUploadOperationsUploadFile**](CommonApi.md#directUploadOperationsUploadFile) | **POST** /direct_url |  |
| [**exportOperationsDownloadExport**](CommonApi.md#exportOperationsDownloadExport) | **GET** /chats/exports/{id} |  |
| [**exportOperationsRequestExport**](CommonApi.md#exportOperationsRequestExport) | **POST** /chats/exports |  |
| [**uploadOperationsGetUploadParams**](CommonApi.md#uploadOperationsGetUploadParams) | **POST** /uploads |  |


<a id="commonOperationsListProperties"></a>
# **commonOperationsListProperties**
> CommonOperationsListProperties200Response commonOperationsListProperties(entityType)



Список дополнительных полей  На данный момент работа с дополнительными полями типа \&quot;Файл\&quot; недоступна.  Метод для получения актуального списка дополнительных полей участников и напоминаний в вашей компании.  По умолчанию в вашей компании все сущности имеют только базовые поля. Но администратор вашей компании может добавлять дополнительные поля, редактировать их и удалять. Если при создании сотрудников (или напоминаний) вы используете дополнительные поля, которые не являются актуальными (удалены или не существуют) - вы получите ошибку.

### Example
```kotlin
// Import classes:
//import org.openapitools.client.infrastructure.*
//import org.openapitools.client.models.*

val apiInstance = CommonApi()
val entityType : SearchEntityType = User // SearchEntityType | Тип сущности
try {
    val result : CommonOperationsListProperties200Response = apiInstance.commonOperationsListProperties(entityType)
    println(result)
} catch (e: ClientException) {
    println("4xx response calling CommonApi#commonOperationsListProperties")
    e.printStackTrace()
} catch (e: ServerException) {
    println("5xx response calling CommonApi#commonOperationsListProperties")
    e.printStackTrace()
}
```

### Parameters
| Name | Type | Description  | Notes |
| ------------- | ------------- | ------------- | ------------- |
| **entityType** | [**SearchEntityType**](.md)| Тип сущности | [enum: User, Task] |

### Return type

[**CommonOperationsListProperties200Response**](CommonOperationsListProperties200Response.md)

### Authorization


Configure BearerAuth:
    ApiClient.accessToken = ""

### HTTP request headers

 - **Content-Type**: Not defined
 - **Accept**: application/json

<a id="directUploadOperationsUploadFile"></a>
# **directUploadOperationsUploadFile**
> directUploadOperationsUploadFile(contentDisposition, acl, policy, xAmzCredential, xAmzAlgorithm, xAmzDate, xAmzSignature, key, file)



Загрузка файла  Для того чтобы прикрепить файл к сообщению или к другой сущности через API, требуется сначала загрузить файл на сервер (через метод получения подписи и ключа), а затем сформировать ссылку на него.  **Процесс загрузки состоит из трёх шагов:**  1. [Получение подписи, ключа и других параметров](POST /uploads) — сделать &#x60;POST&#x60;-запрос без тела запроса для получения параметров загрузки. 2. **Загрузка файла** — после получения всех параметров, нужно сделать &#x60;POST&#x60; запрос c форматом &#x60;multipart/form-data&#x60; на адрес &#x60;direct_url&#x60;, включая те же поля, что пришли (content-disposition, acl, policy, x-amz-credential, x-amz-algorithm, x-amz-date, x-amz-signature, key) и сам файл. При успешной загрузке — &#x60;HTTP&#x60; статус &#x60;201&#x60;. 3. **Прикрепление файла к сообщению или другой сущности** — после загрузки файла, чтобы прикрепить его к сообщению или другой сущности API, необходимо сформировать путь файла. Для этого в поле &#x60;key&#x60;, полученном на этапе подписи, заменить шаблон &#x60;${filename}&#x60; на фактическое имя файла. Пример: Если ваш файл называется &#x60;Логотип для сайта.png&#x60;, а в ответе на метод &#x60;/uploads&#x60; ключ был &#x60;attaches/files/93746/e354-...-5e6f/${filename}&#x60;, итоговый ключ будет &#x60;attaches/files/93746/e354-...-5e6f/Логотип для сайта.png&#x60;.

### Example
```kotlin
// Import classes:
//import org.openapitools.client.infrastructure.*
//import org.openapitools.client.models.*

val apiInstance = CommonApi()
val contentDisposition : kotlin.String = contentDisposition_example // kotlin.String | Параметр Content-Disposition, полученный в ответе на запрос [Получение подписи, ключа и других параметров](POST /uploads)
val acl : kotlin.String = acl_example // kotlin.String | Параметр acl, полученный в ответе на запрос [Получение подписи, ключа и других параметров](POST /uploads)
val policy : kotlin.String = policy_example // kotlin.String | Параметр policy, полученный в ответе на запрос [Получение подписи, ключа и других параметров](POST /uploads)
val xAmzCredential : kotlin.String = xAmzCredential_example // kotlin.String | Параметр x-amz-credential, полученный в ответе на запрос [Получение подписи, ключа и других параметров](POST /uploads)
val xAmzAlgorithm : kotlin.String = xAmzAlgorithm_example // kotlin.String | Параметр x-amz-algorithm, полученный в ответе на запрос [Получение подписи, ключа и других параметров](POST /uploads)
val xAmzDate : kotlin.String = xAmzDate_example // kotlin.String | Параметр x-amz-date, полученный в ответе на запрос [Получение подписи, ключа и других параметров](POST /uploads)
val xAmzSignature : kotlin.String = xAmzSignature_example // kotlin.String | Параметр x-amz-signature, полученный в ответе на запрос [Получение подписи, ключа и других параметров](POST /uploads)
val key : kotlin.String = key_example // kotlin.String | Параметр key, полученный в ответе на запрос [Получение подписи, ключа и других параметров](POST /uploads)
val file : io.ktor.client.request.forms.FormPart<io.ktor.client.request.forms.InputProvider> = BINARY_DATA_HERE // io.ktor.client.request.forms.FormPart<io.ktor.client.request.forms.InputProvider> | Файл для загрузки
try {
    apiInstance.directUploadOperationsUploadFile(contentDisposition, acl, policy, xAmzCredential, xAmzAlgorithm, xAmzDate, xAmzSignature, key, file)
} catch (e: ClientException) {
    println("4xx response calling CommonApi#directUploadOperationsUploadFile")
    e.printStackTrace()
} catch (e: ServerException) {
    println("5xx response calling CommonApi#directUploadOperationsUploadFile")
    e.printStackTrace()
}
```

### Parameters
| **contentDisposition** | **kotlin.String**| Параметр Content-Disposition, полученный в ответе на запрос [Получение подписи, ключа и других параметров](POST /uploads) | |
| **acl** | **kotlin.String**| Параметр acl, полученный в ответе на запрос [Получение подписи, ключа и других параметров](POST /uploads) | |
| **policy** | **kotlin.String**| Параметр policy, полученный в ответе на запрос [Получение подписи, ключа и других параметров](POST /uploads) | |
| **xAmzCredential** | **kotlin.String**| Параметр x-amz-credential, полученный в ответе на запрос [Получение подписи, ключа и других параметров](POST /uploads) | |
| **xAmzAlgorithm** | **kotlin.String**| Параметр x-amz-algorithm, полученный в ответе на запрос [Получение подписи, ключа и других параметров](POST /uploads) | |
| **xAmzDate** | **kotlin.String**| Параметр x-amz-date, полученный в ответе на запрос [Получение подписи, ключа и других параметров](POST /uploads) | |
| **xAmzSignature** | **kotlin.String**| Параметр x-amz-signature, полученный в ответе на запрос [Получение подписи, ключа и других параметров](POST /uploads) | |
| **key** | **kotlin.String**| Параметр key, полученный в ответе на запрос [Получение подписи, ключа и других параметров](POST /uploads) | |
| Name | Type | Description  | Notes |
| ------------- | ------------- | ------------- | ------------- |
| **file** | **io.ktor.client.request.forms.FormPart&lt;io.ktor.client.request.forms.InputProvider&gt;**| Файл для загрузки | |

### Return type

null (empty response body)

### Authorization


Configure BearerAuth:
    ApiClient.accessToken = ""

### HTTP request headers

 - **Content-Type**: multipart/form-data
 - **Accept**: Not defined

<a id="exportOperationsDownloadExport"></a>
# **exportOperationsDownloadExport**
> exportOperationsDownloadExport(id)



Скачать архив экспорта  Метод для скачивания готового архива экспорта сообщений.  Для получения архива вам необходимо знать его &#x60;id&#x60; и указать его в &#x60;URL&#x60; запроса.  В ответ на запрос сервер вернёт &#x60;302 Found&#x60; с заголовком &#x60;Location&#x60;, содержащим временную ссылку на скачивание файла. Большинство HTTP-клиентов автоматически следуют редиректу и скачивают файл.

### Example
```kotlin
// Import classes:
//import org.openapitools.client.infrastructure.*
//import org.openapitools.client.models.*

val apiInstance = CommonApi()
val id : kotlin.Int = 22322 // kotlin.Int | Идентификатор экспорта
try {
    apiInstance.exportOperationsDownloadExport(id)
} catch (e: ClientException) {
    println("4xx response calling CommonApi#exportOperationsDownloadExport")
    e.printStackTrace()
} catch (e: ServerException) {
    println("5xx response calling CommonApi#exportOperationsDownloadExport")
    e.printStackTrace()
}
```

### Parameters
| Name | Type | Description  | Notes |
| ------------- | ------------- | ------------- | ------------- |
| **id** | **kotlin.Int**| Идентификатор экспорта | |

### Return type

null (empty response body)

### Authorization


Configure BearerAuth:
    ApiClient.accessToken = ""

### HTTP request headers

 - **Content-Type**: Not defined
 - **Accept**: application/json

<a id="exportOperationsRequestExport"></a>
# **exportOperationsRequestExport**
> exportOperationsRequestExport(exportRequest)



Экспорт сообщений  Метод для запрашивания экспорта сообщений за указанный период.

### Example
```kotlin
// Import classes:
//import org.openapitools.client.infrastructure.*
//import org.openapitools.client.models.*

val apiInstance = CommonApi()
val exportRequest : ExportRequest =  // ExportRequest | 
try {
    apiInstance.exportOperationsRequestExport(exportRequest)
} catch (e: ClientException) {
    println("4xx response calling CommonApi#exportOperationsRequestExport")
    e.printStackTrace()
} catch (e: ServerException) {
    println("5xx response calling CommonApi#exportOperationsRequestExport")
    e.printStackTrace()
}
```

### Parameters
| Name | Type | Description  | Notes |
| ------------- | ------------- | ------------- | ------------- |
| **exportRequest** | [**ExportRequest**](ExportRequest.md)|  | |

### Return type

null (empty response body)

### Authorization


Configure BearerAuth:
    ApiClient.accessToken = ""

### HTTP request headers

 - **Content-Type**: application/json
 - **Accept**: application/json

<a id="uploadOperationsGetUploadParams"></a>
# **uploadOperationsGetUploadParams**
> UploadParams uploadOperationsGetUploadParams()



Получение подписи, ключа и других параметров  Метод для получения подписи, ключа и других параметров, необходимых для загрузки файла.  Данный метод необходимо использовать для загрузки каждого файла.

### Example
```kotlin
// Import classes:
//import org.openapitools.client.infrastructure.*
//import org.openapitools.client.models.*

val apiInstance = CommonApi()
try {
    val result : UploadParams = apiInstance.uploadOperationsGetUploadParams()
    println(result)
} catch (e: ClientException) {
    println("4xx response calling CommonApi#uploadOperationsGetUploadParams")
    e.printStackTrace()
} catch (e: ServerException) {
    println("5xx response calling CommonApi#uploadOperationsGetUploadParams")
    e.printStackTrace()
}
```

### Parameters
This endpoint does not need any parameter.

### Return type

[**UploadParams**](UploadParams.md)

### Authorization


Configure BearerAuth:
    ApiClient.accessToken = ""

### HTTP request headers

 - **Content-Type**: Not defined
 - **Accept**: application/json

