# ViewsApi

All URIs are relative to *https://api.pachca.com/api/shared/v1*

| Method | HTTP request | Description |
| ------------- | ------------- | ------------- |
| [**formOperationsOpenView**](ViewsApi.md#formOperationsOpenView) | **POST** /views/open |  |


<a id="formOperationsOpenView"></a>
# **formOperationsOpenView**
> kotlin.Any formOperationsOpenView(openViewRequest)



Открытие представления  Метод для открытия модального окна с представлением для пользователя.  Чтобы открыть модальное окно с представлением, ваше приложение должно иметь действительный, неистекший &#x60;trigger_id&#x60;.

### Example
```kotlin
// Import classes:
//import org.openapitools.client.infrastructure.*
//import org.openapitools.client.models.*

val apiInstance = ViewsApi()
val openViewRequest : OpenViewRequest = {"trigger_id":"791a056b-006c-49dd-834b-c633fde52fe8","type":"modal","private_metadata":"{'timeoff_id':4378}","callback_id":"timeoff_reguest_form","view":{"title":"Уведомление об отпуске","close_text":"Закрыть","submit_text":"Отправить заявку","blocks":[{"type":"plain_text","text":"Заполните форму. После отправки формы в общий чат будет отправлено текстовое уведомление, а ваш отпуск будет сохранен в базе."},{"type":"markdown","text":"Информацию о доступных вам днях отпуска вы можете прочитать по [ссылке](https://www.website.com/timeoff)"},{"type":"header","text":"Основная информация"},{"type":"date","name":"date_start","label":"Дата начала отпуска","initial_date":"2025-07-01","required":true},{"type":"date","name":"date_end","label":"Дата окончания отпуска","initial_date":"2025-07-28","required":true},{"type":"file_input","name":"request_doc","label":"Заявление","filetypes":["pdf","jpg","png"],"max_files":1,"required":true,"hint":"Загрузите заполненное заявление с электронной подписью (в формате pdf, jpg или png)"},{"type":"radio","name":"accessibility","label":"Доступность","options":[{"text":"Ничего","value":"nothing","checked":true},{"text":"Только телефон","value":"phone_only"},{"text":"Телефон и ноутбук","value":"phone_notebook"}],"required":true,"hint":"Если вы не планируете выходить на связь, то выберите вариант Ничего"},{"type":"divider"},{"type":"header","text":"Дополнительно"},{"type":"input","name":"info","label":"Описание отпуска","placeholder":"Куда собираетесь и что будете делать","multiline":true,"hint":"Возможно вам подскаджут, какие места лучше посетить"},{"type":"checkbox","name":"newsletters","label":"Рассылки","options":[{"text":"Получать уведомления о новых задачах в команде","value":"new_tasks","description":"Каждый день бот будет присылать список новых задач в вашей команде"},{"text":"Получать уведомления об обновлениях в проектах","value":"project_updates","description":"Два раза в неделю бот будет присылать обновления по проектам"}]},{"type":"select","name":"team","label":"Выберите команду","options":[{"text":"Все команды","value":"all"},{"text":"Web","value":"web","selected":true},{"text":"iOS","value":"ios"},{"text":"Android","value":"android"},{"text":"Back","value":"back"},{"text":"Design","value":"design"},{"text":"Success","value":"success"}]},{"type":"time","name":"newsletter_time","label":"Время рассылки","initial_time":660,"hint":"Укажите, в какое время присылать выбранные рассылки"}]}} // OpenViewRequest | 
try {
    val result : kotlin.Any = apiInstance.formOperationsOpenView(openViewRequest)
    println(result)
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

[**kotlin.Any**](kotlin.Any.md)

### Authorization


Configure BearerAuth:
    ApiClient.username = ""
    ApiClient.password = ""

### HTTP request headers

 - **Content-Type**: application/json
 - **Accept**: application/json

