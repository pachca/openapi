
# MessageUpdateRequestMessageFilesInner

## Properties
| Name | Type | Description | Notes |
| ------------ | ------------- | ------------- | ------------- |
| **key** | **kotlin.String** | Путь к файлу, полученный в результате [загрузки файла](POST /direct_url) |  |
| **name** | **kotlin.String** | Название файла, которое вы хотите отображать пользователю (рекомендуется писать вместе с расширением) |  |
| **fileType** | **kotlin.String** | Тип файла: файл (file), изображение (image) |  [optional] |
| **propertySize** | **kotlin.Int** | Размер файла в байтах, отображаемый пользователю |  [optional] |
| **width** | **kotlin.Int** | Ширина изображения в px (используется в случае, если file_type указан как image) |  [optional] |
| **height** | **kotlin.Int** | Высота изображения в px (используется в случае, если file_type указан как image) |  [optional] |



