
# ViewBlockFileInput

## Properties
| Name | Type | Description | Notes |
| ------------ | ------------- | ------------- | ------------- |
| **type** | [**inline**](#Type) | Тип блока |  |
| **name** | **kotlin.String** | Название, которое будет передано в ваше приложение как ключ указанного пользователем значения |  |
| **label** | **kotlin.String** | Подпись к полю |  |
| **filetypes** | **kotlin.collections.List&lt;kotlin.String&gt;** | Массив допустимых расширений файлов, указанные в виде строк (например, [\&quot;png\&quot;,\&quot;jpg\&quot;,\&quot;gif\&quot;]). Если это поле не указано, все расширения файлов будут приняты. |  [optional] |
| **maxFiles** | **kotlin.Int** | Максимальное количество файлов, которое может загрузить пользователь в это поле. |  [optional] |
| **required** | **kotlin.Boolean** | Обязательность |  [optional] |
| **hint** | **kotlin.String** | Подсказка, которая отображается под полем серым цветом |  [optional] |


<a id="Type"></a>
## Enum: type
| Name | Value |
| ---- | ----- |
| type | file_input |



