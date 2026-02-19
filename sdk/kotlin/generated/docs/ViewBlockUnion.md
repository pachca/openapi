
# ViewBlockUnion

## Properties
| Name | Type | Description | Notes |
| ------------ | ------------- | ------------- | ------------- |
| **type** | [**inline**](#Type) | Тип блока |  |
| **text** | **kotlin.String** | Текст |  |
| **name** | **kotlin.String** | Название, которое будет передано в ваше приложение как ключ указанного пользователем значения |  |
| **label** | **kotlin.String** | Подпись к полю |  |
| **placeholder** | **kotlin.String** | Подсказка внутри поля ввода, пока оно пустое |  [optional] |
| **multiline** | **kotlin.Boolean** | Многострочное поле |  [optional] |
| **initialValue** | **kotlin.String** | Начальное значение в поле |  [optional] |
| **minLength** | **kotlin.Int** | Минимальная длина текста, который должен написать пользователь. Если пользователь напишет меньше, он получит ошибку. |  [optional] |
| **maxLength** | **kotlin.Int** | Максимальная длина текста, который должен написать пользователь. Если пользователь напишет больше, он получит ошибку. |  [optional] |
| **required** | **kotlin.Boolean** | Обязательность |  [optional] |
| **hint** | **kotlin.String** | Подсказка, которая отображается под полем серым цветом |  [optional] |
| **options** | [**kotlin.collections.List&lt;ViewBlockCheckboxOption&gt;**](ViewBlockCheckboxOption.md) | Массив чекбоксов |  [optional] |
| **initialDate** | [**java.time.LocalDate**](java.time.LocalDate.md) | Начальное значение в поле в формате YYYY-MM-DD |  [optional] |
| **initialTime** | **kotlin.String** | Начальное значение в поле в формате HH:mm |  [optional] |
| **filetypes** | **kotlin.collections.List&lt;kotlin.String&gt;** | Массив допустимых расширений файлов, указанные в виде строк (например, [\&quot;png\&quot;,\&quot;jpg\&quot;,\&quot;gif\&quot;]). Если это поле не указано, все расширения файлов будут приняты. |  [optional] |
| **maxFiles** | **kotlin.Int** | Максимальное количество файлов, которое может загрузить пользователь в это поле. |  [optional] |


<a id="Type"></a>
## Enum: type
| Name | Value |
| ---- | ----- |
| type | header, plain_text, markdown, divider, input, select, radio, checkbox, date, time, file_input |



