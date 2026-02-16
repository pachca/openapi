
# MessageUpdateRequestMessage

## Properties
| Name | Type | Description | Notes |
| ------------ | ------------- | ------------- | ------------- |
| **content** | **kotlin.String** | Текст сообщения |  [optional] |
| **files** | [**kotlin.collections.List&lt;MessageUpdateRequestMessageFilesInner&gt;**](MessageUpdateRequestMessageFilesInner.md) | Прикрепляемые файлы |  [optional] |
| **buttons** | **kotlin.collections.List&lt;kotlin.collections.List&lt;Button&gt;&gt;** | Массив строк, каждая из которых представлена массивом кнопок. Максимум 100 кнопок у сообщения, до 8 кнопок в строке. Для удаления кнопок пришлите пустой массив. |  [optional] |
| **displayAvatarUrl** | **kotlin.String** | Ссылка на специальную аватарку отправителя для этого сообщения. Использование этого поля возможно только с access_token бота. |  [optional] |
| **displayName** | **kotlin.String** | Полное специальное имя отправителя для этого сообщения. Использование этого поля возможно только с access_token бота. |  [optional] |



