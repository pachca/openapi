
# MessageCreateRequestMessage

## Properties
| Name | Type | Description | Notes |
| ------------ | ------------- | ------------- | ------------- |
| **entityId** | **kotlin.Int** | Идентификатор сущности |  |
| **content** | **kotlin.String** | Текст сообщения |  |
| **entityType** | [**MessageEntityType**](MessageEntityType.md) | Тип сущности |  [optional] |
| **files** | [**kotlin.collections.List&lt;MessageCreateRequestMessageFilesInner&gt;**](MessageCreateRequestMessageFilesInner.md) | Прикрепляемые файлы |  [optional] |
| **buttons** | **kotlin.collections.List&lt;kotlin.collections.List&lt;Button&gt;&gt;** | Массив строк, каждая из которых представлена массивом кнопок. Максимум 100 кнопок у сообщения, до 8 кнопок в строке. |  [optional] |
| **parentMessageId** | **kotlin.Int** | Идентификатор сообщения. Указывается в случае, если вы отправляете ответ на другое сообщение. |  [optional] |
| **displayAvatarUrl** | **kotlin.String** | Ссылка на специальную аватарку отправителя для этого сообщения. Использование этого поля возможно только с access_token бота. |  [optional] |
| **displayName** | **kotlin.String** | Полное специальное имя отправителя для этого сообщения. Использование этого поля возможно только с access_token бота. |  [optional] |
| **skipInviteMentions** | **kotlin.Boolean** | Пропуск добавления упоминаемых пользователей в тред. Работает только при отправке сообщения в тред. |  [optional] |
| **linkPreview** | **kotlin.Boolean** | Отображение предпросмотра первой найденной ссылки в тексте сообщения |  [optional] |



