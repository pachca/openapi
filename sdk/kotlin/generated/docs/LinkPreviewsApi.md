# LinkPreviewsApi

All URIs are relative to *https://api.pachca.com/api/shared/v1*

| Method | HTTP request | Description |
| ------------- | ------------- | ------------- |
| [**linkPreviewOperationsCreateLinkPreviews**](LinkPreviewsApi.md#linkPreviewOperationsCreateLinkPreviews) | **POST** /messages/{id}/link_previews |  |


<a id="linkPreviewOperationsCreateLinkPreviews"></a>
# **linkPreviewOperationsCreateLinkPreviews**
> kotlin.Any linkPreviewOperationsCreateLinkPreviews(id, linkPreviewsRequest)



Unfurl (разворачивание ссылок)  Метод для создания предпросмотров ссылок в сообщениях.  Для создания предпросмотров ссылок вам необходимо знать &#x60;id&#x60; сообщения и указать его в &#x60;URL&#x60; запроса.  Изображения вы можете предоставить как публичной ссылкой (параметром &#x60;image_url&#x60;), так и с помощью прямой загрузки файла на наш сервер (параметром &#x60;image&#x60;) через метод &#x60;Загрузка файлов&#x60;. Если вы указали оба параметра сразу, то &#x60;image&#x60; является более приоритетным.  Если среди присланных &#x60;URL&#x60;-ключей будет выявлена ошибка (такого &#x60;URL&#x60; нет в сообщении или боту не прописан в настройках домен указанного &#x60;URL&#x60;), то запрос не будет выполнен (не будет создано ни одного предпросмотра).  На данный момент поддерживается отображение только первого созданного предпросмотра ссылки к сообщению. Все присланные вами &#x60;link_previews&#x60; будут сохранены и появятся в сообщениях в ближайших обновлениях.

### Example
```kotlin
// Import classes:
//import org.openapitools.client.infrastructure.*
//import org.openapitools.client.models.*

val apiInstance = LinkPreviewsApi()
val id : kotlin.Int = 56 // kotlin.Int | Идентификатор сообщения
val linkPreviewsRequest : LinkPreviewsRequest =  // LinkPreviewsRequest | 
try {
    val result : kotlin.Any = apiInstance.linkPreviewOperationsCreateLinkPreviews(id, linkPreviewsRequest)
    println(result)
} catch (e: ClientException) {
    println("4xx response calling LinkPreviewsApi#linkPreviewOperationsCreateLinkPreviews")
    e.printStackTrace()
} catch (e: ServerException) {
    println("5xx response calling LinkPreviewsApi#linkPreviewOperationsCreateLinkPreviews")
    e.printStackTrace()
}
```

### Parameters
| **id** | **kotlin.Int**| Идентификатор сообщения | |
| Name | Type | Description  | Notes |
| ------------- | ------------- | ------------- | ------------- |
| **linkPreviewsRequest** | [**LinkPreviewsRequest**](LinkPreviewsRequest.md)|  | |

### Return type

[**kotlin.Any**](kotlin.Any.md)

### Authorization


Configure BearerAuth:
    ApiClient.accessToken = ""

### HTTP request headers

 - **Content-Type**: application/json
 - **Accept**: application/json

