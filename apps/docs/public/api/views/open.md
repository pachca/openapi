> Расположение: Методы API → Формы
> Краткое содержание: Показывает пользователю модальное окно с формой в ответ на его действие
> Это Markdown-версия конкретной страницы. Для контекста за её пределами (правила API, полный перечень методов, авторизация) ОБЯЗАТЕЛЬНО открой [llms.txt](https://dev.pachca.com/llms.txt) перед ответом — это сэкономит токены и предотвратит неполный ответ.

# Открытие представления

**Метод**: `POST`

**Путь**: `/views/open`

> **Скоуп:** `views:write`

Показывает пользователю модальное окно с формой в ответ на его действие. Метод вызывают токеном бота: события о нажатии кнопок приходят только ботам, от имени бота окно и открывается.

Открыть окно можно единственным способом — по `trigger_id` из события о нажатии кнопки. Один `trigger_id` открывает одно окно и живёт 3 секунды. У бота с вебхуком они отсчитываются с момента, когда Пачка передала нажатие, а у бота, который читает [Историю событий](/api/bots/list-events), с момента записи нажатия в журнал. Поэтому окно открывают первым делом, а всё остальное по событию делают уже после.

Заполненная форма приходит обратно событием `view_submit`: на исходящий вебхук, а если адрес не задан — в журнал. На вебхук отвечают прямо в ответе на него, и Пачка ждёт его 3 секунды. Событие из журнала закрывают методом [Ответ на отправку формы](/api/views/submit-response), на это есть 5 секунд. Не успели — пользователь увидит ошибку отправки.

## Тело запроса

**Обязательно**

Формат: `application/json`

### Схема

- `type: string` (required) — Способ открытия представления. Пример: `"modal"`
  Значения: `modal` — Модальное окно
- `trigger_id: string` (required) — Уникальный идентификатор события (полученный, например, в исходящем вебхуке о нажатии кнопки). Пример: `"791a056b-006c-49dd-834b-c633fde52fe8"`
- `private_metadata: string` (max length: 3000) — Необязательная строка, которая будет отправлена в ваше приложение при отправке пользователем заполненной формы. Используйте это поле, например, для передачи в формате `JSON` какой то дополнительной информации вместе с заполненной пользователем формой. Пример: `"{\"timeoff_id\":4378}"`
- `callback_id: string` (max length: 255) — Необязательный идентификатор для распознавания этого представления, который будет отправлен в ваше приложение при отправке пользователем заполненной формы. Используйте это поле, например, для понимания, какую форму должен был заполнить пользователь. Пример: `"timeoff_request_form"`
- `view: object` (required) — Собранный объект представления
  - `title: string` (required, max length: 24, min length: 1) — Заголовок представления. Пример: `"Уведомление об отпуске"`
  - `close_text: string` (default: Отменить, max length: 24, min length: 1) — Текст кнопки закрытия представления. Отображается только в десктоп-вебе. В мобильных приложениях (iOS/Android) кнопка закрытия — это крестик в шапке, и заданный текст там не показывается. Пример: `"Закрыть"`
  - `submit_text: string` (default: Отправить, max length: 24, min length: 1) — Текст кнопки отправки формы. Пример: `"Отправить заявку"`
  - `blocks: array (union)` (required, max items: 100) — Массив блоков представления. Имена блоков (`name`) не повторяются, в select и radio заранее выбрано не больше одного варианта, а `min_length` поля ввода не больше его `max_length`.
    **Возможные типы элементов:**

    - **ViewBlockHeader**: Блок header — заголовок
      - `type: string` (required) — Тип блока
        Значения: `header` — Для заголовков всегда header
      - `text: string` (required, max length: 150, min length: 1) — Текст заголовка
    - **ViewBlockPlainText**: Блок plain_text — обычный текст
      - `type: string` (required) — Тип блока
        Значения: `plain_text` — Для обычного текста всегда plain_text
      - `text: string` (required, max length: 12000, min length: 1) — Текст
    - **ViewBlockMarkdown**: Блок markdown — форматированный текст
      - `type: string` (required) — Тип блока
        Значения: `markdown` — Для форматированного текста всегда markdown
      - `text: string` (required, max length: 12000, min length: 1) — Текст
    - **ViewBlockDivider**: Блок divider — разделитель
      - `type: string` (required) — Тип блока
        Значения: `divider` — Для разделителя всегда divider
    - **ViewBlockInput**: Блок input — текстовое поле ввода
      - `type: string` (required) — Тип блока
        Значения: `input` — Для текстового поля всегда input
      - `name: string` (required, max length: 255, min length: 1) — Название, которое будет передано в ваше приложение как ключ указанного пользователем значения
      - `label: string` (required, max length: 150, min length: 1) — Подпись к полю
      - `placeholder: string` (max length: 150) — Подсказка внутри поля ввода, пока оно пустое
      - `multiline: boolean` (default: false) — Многострочное поле
      - `initial_value: string` (max length: 3000) — Начальное значение в поле
      - `min_length: integer, int32` (min: 0, max: 3000) — Минимальная длина текста, который должен написать пользователь. Если пользователь напишет меньше, он получит ошибку.
      - `max_length: integer, int32` (min: 1, max: 3000) — Максимальная длина текста, который должен написать пользователь. Если пользователь напишет больше, он получит ошибку.
      - `required: boolean` (default: false) — Обязательность
      - `hint: string` (max length: 2000) — Подсказка, которая отображается под полем серым цветом
    - **ViewBlockSelect**: Блок select — выпадающий список
      - `type: string` (required) — Тип блока
        Значения: `select` — Для выпадающего списка всегда select
      - `name: string` (required, max length: 255, min length: 1) — Название, которое будет передано в ваше приложение как ключ указанного пользователем выбора
      - `label: string` (required, max length: 150, min length: 1) — Подпись к выпадающему списку
      - `options: array of object` (required, max items: 100) — Массив доступных пунктов в выпадающем списке
        - `text: string` (required, max length: 75, min length: 1) — Отображаемый текст
        - `value: string` (required, max length: 255, min length: 1) — Уникальное строковое значение, которое будет передано в ваше приложение при выборе этого пункта
        - `description: string` (max length: 75) — Пояснение, которое будет указано серым цветом в этом пункте под отображаемым текстом
        - `selected: boolean` — Изначально выбранный пункт. Только один пункт может быть выбран.
      - `required: boolean` (default: false) — Обязательность
      - `hint: string` (max length: 2000) — Подсказка, которая отображается под выпадающим списком серым цветом
    - **ViewBlockRadio**: Блок radio — радиокнопки
      - `type: string` (required) — Тип блока
        Значения: `radio` — Для радиокнопок всегда radio
      - `name: string` (required, max length: 255, min length: 1) — Название, которое будет передано в ваше приложение как ключ указанного пользователем выбора
      - `label: string` (required, max length: 150, min length: 1) — Подпись к группе радиокнопок
      - `options: array of object` (required, max items: 20) — Массив радиокнопок
        - `text: string` (required, max length: 75, min length: 1) — Отображаемый текст
        - `value: string` (required, max length: 255, min length: 1) — Уникальное строковое значение, которое будет передано в ваше приложение при выборе этого пункта
        - `description: string` (max length: 75) — Пояснение, которое будет указано серым цветом в этом пункте под отображаемым текстом
        - `checked: boolean` — Изначально выбранная радиокнопка. Только одна радиокнопка может быть выбрана.
      - `required: boolean` (default: false) — Обязательность
      - `hint: string` (max length: 2000) — Подсказка, которая отображается под группой радиокнопок серым цветом
    - **ViewBlockCheckbox**: Блок checkbox — чекбоксы
      - `type: string` (required) — Тип блока
        Значения: `checkbox` — Для чекбоксов всегда checkbox
      - `name: string` (required, max length: 255, min length: 1) — Название, которое будет передано в ваше приложение как ключ указанного пользователем выбора
      - `label: string` (required, max length: 150, min length: 1) — Подпись к группе чекбоксов
      - `options: array of object` (required, max items: 20) — Массив чекбоксов
        - `text: string` (required, max length: 75, min length: 1) — Отображаемый текст
        - `value: string` (required, max length: 255, min length: 1) — Уникальное строковое значение, которое будет передано в ваше приложение при выборе этого пункта
        - `description: string` (max length: 75) — Пояснение, которое будет указано серым цветом в этом пункте под отображаемым текстом
        - `checked: boolean` — Изначально выбранный пункт
      - `required: boolean` (default: false) — Обязательность
      - `hint: string` (max length: 2000) — Подсказка, которая отображается под группой чекбоксов серым цветом
    - **ViewBlockDate**: Блок date — выбор даты
      - `type: string` (required) — Тип блока
        Значения: `date` — Для выбора даты всегда date
      - `name: string` (required, max length: 255, min length: 1) — Название, которое будет передано в ваше приложение как ключ указанного пользователем значения
      - `label: string` (required, max length: 150, min length: 1) — Подпись к полю
      - `initial_date: date` — Начальное значение в поле в формате YYYY-MM-DD
      - `required: boolean` (default: false) — Обязательность
      - `hint: string` (max length: 2000) — Подсказка, которая отображается под полем серым цветом
    - **ViewBlockTime**: Блок time — выбор времени
      - `type: string` (required) — Тип блока
        Значения: `time` — Для выбора времени всегда time
      - `name: string` (required, max length: 255, min length: 1) — Название, которое будет передано в ваше приложение как ключ указанного пользователем значения
      - `label: string` (required, max length: 150, min length: 1) — Подпись к полю
      - `initial_time: string` — Начальное значение в поле в формате HH:mm. Значение в формате HH:mm:ss тоже принимается — секунды отбрасываются.
      - `required: boolean` (default: false) — Обязательность
      - `hint: string` (max length: 2000) — Подсказка, которая отображается под полем серым цветом
    - **ViewBlockFileInput**: Блок file_input — загрузка файлов
      - `type: string` (required) — Тип блока
        Значения: `file_input` — Для загрузки файлов всегда file_input
      - `name: string` (required, max length: 255, min length: 1) — Название, которое будет передано в ваше приложение как ключ указанного пользователем значения
      - `label: string` (required, max length: 150, min length: 1) — Подпись к полю
      - `filetypes: array of string` — Массив допустимых расширений файлов, указанные в виде строк (например, ["png","jpg","gif"]). Точка в начале не нужна, но допустима — она подставляется сама. Значение с косой чертой считается MIME-типом и остаётся как есть. Если это поле не указано, все расширения файлов будут приняты. Значение подставляется в фильтр окна выбора файла, поэтому расширение полученного файла проверяйте у себя.
      - `max_files: integer, int32` (default: 10, min: 1, max: 10) — Максимальное количество файлов, которое может загрузить пользователь в это поле
      - `required: boolean` (default: false) — Обязательность
      - `hint: string` (max length: 2000) — Подсказка, которая отображается под полем серым цветом

### Пример

```json
{
  "type": "modal",
  "trigger_id": "791a056b-006c-49dd-834b-c633fde52fe8",
  "private_metadata": "{\"timeoff_id\":4378}",
  "callback_id": "timeoff_request_form",
  "view": {
    "title": "Уведомление об отпуске",
    "close_text": "Закрыть",
    "submit_text": "Отправить заявку",
    "blocks": [
      {
        "type": "header",
        "text": "Основная информация"
      },
      {
        "type": "plain_text",
        "text": "Заполните форму. После отправки формы в общий чат будет отправлено текстовое уведомление, а ваш отпуск будет сохранен в базе."
      },
      {
        "type": "markdown",
        "text": "Информацию о доступных вам днях отпуска вы можете прочитать по [ссылке](https://example.com/timeoff)"
      },
      {
        "type": "divider"
      },
      {
        "type": "input",
        "name": "info",
        "label": "Описание отпуска",
        "placeholder": "Куда собираетесь и что будете делать",
        "multiline": true,
        "initial_value": "Начальный текст",
        "min_length": 10,
        "max_length": 500,
        "required": true,
        "hint": "Возможно вам подскаджут, какие места лучше посетить"
      },
      {
        "type": "select",
        "name": "team",
        "label": "Выберите команду",
        "options": [
          {
            "text": "Ничего",
            "value": "nothing",
            "description": "Каждый день бот будет присылать список новых задач в вашей команде",
            "selected": true
          }
        ],
        "hint": "Выберите одну из команд"
      },
      {
        "type": "radio",
        "name": "accessibility",
        "label": "Доступность",
        "options": [
          {
            "text": "Ничего",
            "value": "nothing",
            "description": "Каждый день бот будет присылать список новых задач в вашей команде",
            "checked": true
          }
        ],
        "required": true,
        "hint": "Если вы не планируете выходить на связь, то выберите вариант Ничего"
      },
      {
        "type": "checkbox",
        "name": "newsletters",
        "label": "Рассылки",
        "options": [
          {
            "text": "Ничего",
            "value": "nothing",
            "description": "Каждый день бот будет присылать список новых задач в вашей команде",
            "checked": true
          }
        ],
        "hint": "Выберите интересующие вас рассылки"
      },
      {
        "type": "date",
        "name": "date_start",
        "label": "Дата начала отпуска",
        "initial_date": "2025-07-01",
        "required": true,
        "hint": "Укажите дату начала отпуска"
      },
      {
        "type": "time",
        "name": "newsletter_time",
        "label": "Время рассылки",
        "initial_time": "11:00",
        "hint": "Укажите, в какое время присылать выбранные рассылки"
      },
      {
        "type": "file_input",
        "name": "request_doc",
        "label": "Заявление",
        "filetypes": [
          "pdf",
          "jpg",
          "png"
        ],
        "max_files": 1,
        "required": true,
        "hint": "Загрузите заполненное заявление с электронной подписью (в формате pdf, jpg или png)"
      }
    ]
  }
}
```

## Пример запроса

```bash
curl "https://api.pachca.com/api/shared/v1/views/open" \
  -H "Authorization: Bearer YOUR_ACCESS_TOKEN" \
  -H "Content-Type: application/json" \
  -d '{
  "type": "modal",
  "trigger_id": "791a056b-006c-49dd-834b-c633fde52fe8",
  "private_metadata": "{\"timeoff_id\":4378}",
  "callback_id": "timeoff_request_form",
  "view": {
    "title": "Уведомление об отпуске",
    "close_text": "Закрыть",
    "submit_text": "Отправить заявку",
    "blocks": [
      {
        "type": "header",
        "text": "Основная информация"
      },
      {
        "type": "plain_text",
        "text": "Заполните форму. После отправки формы в общий чат будет отправлено текстовое уведомление, а ваш отпуск будет сохранен в базе."
      },
      {
        "type": "markdown",
        "text": "Информацию о доступных вам днях отпуска вы можете прочитать по [ссылке](https://example.com/timeoff)"
      },
      {
        "type": "divider"
      },
      {
        "type": "input",
        "name": "info",
        "label": "Описание отпуска",
        "placeholder": "Куда собираетесь и что будете делать",
        "multiline": true,
        "initial_value": "Начальный текст",
        "min_length": 10,
        "max_length": 500,
        "required": true,
        "hint": "Возможно вам подскаджут, какие места лучше посетить"
      },
      {
        "type": "select",
        "name": "team",
        "label": "Выберите команду",
        "options": [
          {
            "text": "Ничего",
            "value": "nothing",
            "description": "Каждый день бот будет присылать список новых задач в вашей команде",
            "selected": true
          }
        ],
        "hint": "Выберите одну из команд"
      },
      {
        "type": "radio",
        "name": "accessibility",
        "label": "Доступность",
        "options": [
          {
            "text": "Ничего",
            "value": "nothing",
            "description": "Каждый день бот будет присылать список новых задач в вашей команде",
            "checked": true
          }
        ],
        "required": true,
        "hint": "Если вы не планируете выходить на связь, то выберите вариант Ничего"
      },
      {
        "type": "checkbox",
        "name": "newsletters",
        "label": "Рассылки",
        "options": [
          {
            "text": "Ничего",
            "value": "nothing",
            "description": "Каждый день бот будет присылать список новых задач в вашей команде",
            "checked": true
          }
        ],
        "hint": "Выберите интересующие вас рассылки"
      },
      {
        "type": "date",
        "name": "date_start",
        "label": "Дата начала отпуска",
        "initial_date": "2025-07-01",
        "required": true,
        "hint": "Укажите дату начала отпуска"
      },
      {
        "type": "time",
        "name": "newsletter_time",
        "label": "Время рассылки",
        "initial_time": "11:00",
        "hint": "Укажите, в какое время присылать выбранные рассылки"
      },
      {
        "type": "file_input",
        "name": "request_doc",
        "label": "Заявление",
        "filetypes": [
          "pdf",
          "jpg",
          "png"
        ],
        "max_files": 1,
        "required": true,
        "hint": "Загрузите заполненное заявление с электронной подписью (в формате pdf, jpg или png)"
      }
    ]
  }
}'
```

## Ответы

### 201: The request has succeeded and a new resource has been created as a result.

**Схема ответа:**

- `success: boolean` (required) — Признак того, что окно открыто. В успешном ответе всегда `true`. Пример: `true`

**Пример ответа:**

```json
{
  "success": true
}
```

### 400: The server could not understand the request due to invalid syntax.

**Схема ответа при ошибке:** `ApiError`. Поля и коды описаны в разделе [Ошибки](/api/errors).

**Пример ответа:**

```json
{
  "errors": [
    {
      "key": "field.name",
      "value": "invalid_value",
      "message": "Поле не может быть пустым",
      "code": "blank",
      "payload": null
    }
  ]
}
```

### 401: Access is unauthorized.

**Схема ответа при ошибке:** `OAuthError`. Поля и коды описаны в разделе [Ошибки](/api/errors).

**Пример ответа:**

```json
{
  "error": "invalid_token",
  "error_description": "Access token is missing"
}
```

### 402: Client error

**Схема ответа при ошибке:** `ApiError`. Поля и коды описаны в разделе [Ошибки](/api/errors).

**Пример ответа:**

```json
{
  "errors": [
    {
      "key": "field.name",
      "value": "invalid_value",
      "message": "Поле не может быть пустым",
      "code": "blank",
      "payload": null
    }
  ]
}
```

### 403: Access is forbidden.

**Схема ответа при ошибке:** `ApiError` или `OAuthError`. Поля и коды описаны в разделе [Ошибки](/api/errors).

**Пример ответа:**

```json
{
  "errors": [
    {
      "key": "field.name",
      "value": "invalid_value",
      "message": "Поле не может быть пустым",
      "code": "blank",
      "payload": null
    }
  ]
}
```

### 410: Client error

**Схема ответа при ошибке:** `ApiError`. Поля и коды описаны в разделе [Ошибки](/api/errors).

**Пример ответа:**

```json
{
  "errors": [
    {
      "key": "field.name",
      "value": "invalid_value",
      "message": "Поле не может быть пустым",
      "code": "blank",
      "payload": null
    }
  ]
}
```

### 422: Client error

**Схема ответа при ошибке:** `ApiError`. Поля и коды описаны в разделе [Ошибки](/api/errors).

**Пример ответа:**

```json
{
  "errors": [
    {
      "key": "field.name",
      "value": "invalid_value",
      "message": "Поле не может быть пустым",
      "code": "blank",
      "payload": null
    }
  ]
}
```

