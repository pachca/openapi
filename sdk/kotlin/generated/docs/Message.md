
# Message

## Properties
| Name | Type | Description | Notes |
| ------------ | ------------- | ------------- | ------------- |
| **id** | **kotlin.Int** | Идентификатор сообщения |  |
| **entityType** | [**MessageEntityType**](MessageEntityType.md) | Тип сущности, к которой относится сообщение |  |
| **entityId** | **kotlin.Int** | Идентификатор сущности, к которой относится сообщение (беседы/канала, треда или пользователя) |  |
| **chatId** | **kotlin.Int** | Идентификатор чата, в котором находится сообщение |  |
| **rootChatId** | **kotlin.Int** | Идентификатор корневого чата. Для сообщений в тредах — идентификатор чата, в котором был создан тред. Для обычных сообщений совпадает с &#x60;chat_id&#x60;. |  |
| **content** | **kotlin.String** | Текст сообщения |  |
| **userId** | **kotlin.Int** | Идентификатор пользователя, создавшего сообщение |  |
| **createdAt** | [**java.time.OffsetDateTime**](java.time.OffsetDateTime.md) | Дата и время создания сообщения (ISO-8601, UTC+0) в формате YYYY-MM-DDThh:mm:ss.sssZ |  |
| **url** | **kotlin.String** | Прямая ссылка на сообщение |  |
| **files** | [**kotlin.collections.List&lt;java.io.File&gt;**](java.io.File.md) | Прикрепленные файлы |  |
| **buttons** | **kotlin.collections.List&lt;kotlin.collections.List&lt;Button&gt;&gt;** | Массив строк, каждая из которых представлена массивом кнопок |  |
| **thread** | [**Thread**](Thread.md) | Тред сообщения |  |
| **forwarding** | [**Forwarding**](Forwarding.md) | Информация о пересланном сообщении |  |
| **parentMessageId** | **kotlin.Int** | Идентификатор сообщения, к которому написан ответ |  |
| **displayAvatarUrl** | **kotlin.String** | Ссылка на аватарку отправителя сообщения |  |
| **displayName** | **kotlin.String** | Полное имя отправителя сообщения |  |
| **changedAt** | [**java.time.OffsetDateTime**](java.time.OffsetDateTime.md) | Дата и время последнего редактирования сообщения (ISO-8601, UTC+0) в формате YYYY-MM-DDThh:mm:ss.sssZ |  |
| **deletedAt** | [**java.time.OffsetDateTime**](java.time.OffsetDateTime.md) | Дата и время удаления сообщения (ISO-8601, UTC+0) в формате YYYY-MM-DDThh:mm:ss.sssZ |  |



