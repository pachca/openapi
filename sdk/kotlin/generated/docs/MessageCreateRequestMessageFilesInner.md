
# MessageCreateRequestMessageFilesInner

## Properties
| Name | Type | Description | Notes |
| ------------ | ------------- | ------------- | ------------- |
| **key** | **kotlin.String** | Путь к файлу, полученный в результате [загрузки файла](POST /direct_url) |  |
| **name** | **kotlin.String** | Название файла, которое вы хотите отображать пользователю (рекомендуется писать вместе с расширением) |  |
| **fileType** | [**inline**](#FileType) | Тип файла |  |
| **propertySize** | **kotlin.Int** | Размер файла в байтах, отображаемый пользователю |  |
| **width** | **kotlin.Int** | Ширина изображения в px (используется в случае, если file_type указан как image) |  [optional] |
| **height** | **kotlin.Int** | Высота изображения в px (используется в случае, если file_type указан как image) |  [optional] |


<a id="FileType"></a>
## Enum: file_type
| Name | Value |
| ---- | ----- |
| fileType | file, image |



