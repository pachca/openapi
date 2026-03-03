# Открытие представления

**Метод**: `POST`

**Путь**: `/views/open`

> **Скоуп:** `views:write`

Метод для открытия модального окна с представлением для пользователя.

Чтобы открыть модальное окно с представлением, ваше приложение должно иметь действительный, неистекший `trigger_id`.

## Тело запроса

**Обязательно**

Формат: `application/json`

### Схема

- `type` (string, **обязательный**): Способ открытия представления
  - Пример: `modal`
  - **Возможные значения:**
    - `modal`: Модальное окно
- `trigger_id` (string, **обязательный**): Уникальный идентификатор события (полученный, например, в исходящем вебхуке о нажатии кнопки)
  - Пример: `791a056b-006c-49dd-834b-c633fde52fe8`
- `private_metadata` (string, опциональный): Необязательная строка, которая будет отправлена в ваше приложение при отправке пользователем заполненной формы. Используйте это поле, например, для передачи в формате `JSON` какой то дополнительной информации вместе с заполненной пользователем формой.
  - Пример: `{"timeoff_id":4378}`
  - Максимальная длина: 3000 символов
- `callback_id` (string, опциональный): Необязательный идентификатор для распознавания этого представления, который будет отправлен в ваше приложение при отправке пользователем заполненной формы. Используйте это поле, например, для понимания, какую форму должен был заполнить пользователь.
  - Пример: `timeoff_reguest_form`
  - Максимальная длина: 255 символов
- `view` (object, **обязательный**): Собранный объект представления
  - `title` (string, **обязательный**): Заголовок представления
    - Пример: `Уведомление об отпуске`
    - Максимальная длина: 24 символов
  - `close_text` (string, опциональный): Текст кнопки закрытия представления
    - Пример: `Закрыть`
    - По умолчанию: `Отменить`
    - Максимальная длина: 24 символов
  - `submit_text` (string, опциональный): Текст кнопки отправки формы
    - Пример: `Отправить заявку`
    - По умолчанию: `Отправить`
    - Максимальная длина: 24 символов
  - `blocks` (array (union), **обязательный**): Массив блоков представления
    - Максимум элементов: 100
    **Возможные типы элементов:**

    - **ViewBlockHeader**: Блок header — заголовок
      - `type` (string, **обязательный**): Тип блока
        - Пример: `header`
        - **Возможные значения:**
          - `header`: Для заголовков всегда header
      - `text` (string, **обязательный**): Текст заголовка
        - Пример: `Основная информация`
        - Максимальная длина: 150 символов
    - **ViewBlockPlainText**: Блок plain_text — обычный текст
      - `type` (string, **обязательный**): Тип блока
        - Пример: `plain_text`
        - **Возможные значения:**
          - `plain_text`: Для обычного текста всегда plain_text
      - `text` (string, **обязательный**): Текст
        - Пример: `Заполните форму. После отправки формы в общий чат будет отправлено текстовое уведомление, а ваш отпуск будет сохранен в базе.`
        - Максимальная длина: 12000 символов
    - **ViewBlockMarkdown**: Блок markdown — форматированный текст
      - `type` (string, **обязательный**): Тип блока
        - Пример: `markdown`
        - **Возможные значения:**
          - `markdown`: Для форматированного текста всегда markdown
      - `text` (string, **обязательный**): Текст
        - Пример: `Информацию о доступных вам днях отпуска вы можете прочитать по [ссылке](https://www.website.com/timeoff)`
        - Максимальная длина: 12000 символов
    - **ViewBlockDivider**: Блок divider — разделитель
      - `type` (string, **обязательный**): Тип блока
        - Пример: `divider`
        - **Возможные значения:**
          - `divider`: Для разделителя всегда divider
    - **ViewBlockInput**: Блок input — текстовое поле ввода
      - `type` (string, **обязательный**): Тип блока
        - Пример: `input`
        - **Возможные значения:**
          - `input`: Для текстового поля всегда input
      - `name` (string, **обязательный**): Название, которое будет передано в ваше приложение как ключ указанного пользователем значения
        - Пример: `info`
        - Максимальная длина: 255 символов
      - `label` (string, **обязательный**): Подпись к полю
        - Пример: `Описание отпуска`
        - Максимальная длина: 150 символов
      - `placeholder` (string, опциональный): Подсказка внутри поля ввода, пока оно пустое
        - Пример: `Куда собираетесь и что будете делать`
        - Максимальная длина: 150 символов
      - `multiline` (boolean, опциональный): Многострочное поле
        - Пример: `true`
      - `initial_value` (string, опциональный): Начальное значение в поле
        - Пример: `Начальный текст`
        - Максимальная длина: 3000 символов
      - `min_length` (integer, int32, опциональный): Минимальная длина текста, который должен написать пользователь. Если пользователь напишет меньше, он получит ошибку.
        - Пример: `10`
        - Минимум: 0
        - Максимум: 3000
      - `max_length` (integer, int32, опциональный): Максимальная длина текста, который должен написать пользователь. Если пользователь напишет больше, он получит ошибку.
        - Пример: `500`
        - Минимум: 1
        - Максимум: 3000
      - `required` (boolean, опциональный): Обязательность
        - Пример: `true`
      - `hint` (string, опциональный): Подсказка, которая отображается под полем серым цветом
        - Пример: `Возможно вам подскаджут, какие места лучше посетить`
        - Максимальная длина: 2000 символов
    - **ViewBlockSelect**: Блок select — выпадающий список
      - `type` (string, **обязательный**): Тип блока
        - Пример: `select`
        - **Возможные значения:**
          - `select`: Для выпадающего списка всегда select
      - `name` (string, **обязательный**): Название, которое будет передано в ваше приложение как ключ указанного пользователем выбора
        - Пример: `team`
        - Максимальная длина: 255 символов
      - `label` (string, **обязательный**): Подпись к выпадающему списку
        - Пример: `Выберите команду`
        - Максимальная длина: 150 символов
      - `options` (array[object], опциональный): Массив доступных пунктов в выпадающем списке
        - Максимум элементов: 100
        - `text` (string, **обязательный**): Отображаемый текст
          - Пример: `Ничего`
          - Максимальная длина: 75 символов
        - `value` (string, **обязательный**): Уникальное строковое значение, которое будет передано в ваше приложение при выборе этого пункта
          - Пример: `nothing`
          - Максимальная длина: 150 символов
        - `description` (string, опциональный): Пояснение, которое будет указано серым цветом в этом пункте под отображаемым текстом
          - Пример: `Каждый день бот будет присылать список новых задач в вашей команде`
          - Максимальная длина: 75 символов
        - `selected` (boolean, опциональный): Изначально выбранный пункт. Только один пункт может быть выбран.
          - Пример: `true`
      - `required` (boolean, опциональный): Обязательность
        - Пример: `false`
      - `hint` (string, опциональный): Подсказка, которая отображается под выпадающим списком серым цветом
        - Пример: `Выберите одну из команд`
        - Максимальная длина: 2000 символов
    - **ViewBlockRadio**: Блок radio — радиокнопки
      - `type` (string, **обязательный**): Тип блока
        - Пример: `radio`
        - **Возможные значения:**
          - `radio`: Для радиокнопок всегда radio
      - `name` (string, **обязательный**): Название, которое будет передано в ваше приложение как ключ указанного пользователем выбора
        - Пример: `accessibility`
        - Максимальная длина: 255 символов
      - `label` (string, **обязательный**): Подпись к группе радиокнопок
        - Пример: `Доступность`
        - Максимальная длина: 150 символов
      - `options` (array[object], опциональный): Массив радиокнопок
        - Максимум элементов: 10
        - `text` (string, **обязательный**): Отображаемый текст
          - Пример: `Ничего`
          - Максимальная длина: 75 символов
        - `value` (string, **обязательный**): Уникальное строковое значение, которое будет передано в ваше приложение при выборе этого пункта
          - Пример: `nothing`
          - Максимальная длина: 150 символов
        - `description` (string, опциональный): Пояснение, которое будет указано серым цветом в этом пункте под отображаемым текстом
          - Пример: `Каждый день бот будет присылать список новых задач в вашей команде`
          - Максимальная длина: 75 символов
        - `selected` (boolean, опциональный): Изначально выбранный пункт. Только один пункт может быть выбран.
          - Пример: `true`
      - `required` (boolean, опциональный): Обязательность
        - Пример: `true`
      - `hint` (string, опциональный): Подсказка, которая отображается под группой радиокнопок серым цветом
        - Пример: `Если вы не планируете выходить на связь, то выберите вариант Ничего`
        - Максимальная длина: 2000 символов
    - **ViewBlockCheckbox**: Блок checkbox — чекбоксы
      - `type` (string, **обязательный**): Тип блока
        - Пример: `checkbox`
        - **Возможные значения:**
          - `checkbox`: Для чекбоксов всегда checkbox
      - `name` (string, **обязательный**): Название, которое будет передано в ваше приложение как ключ указанного пользователем выбора
        - Пример: `newsletters`
        - Максимальная длина: 255 символов
      - `label` (string, **обязательный**): Подпись к группе чекбоксов
        - Пример: `Рассылки`
        - Максимальная длина: 150 символов
      - `options` (array[object], опциональный): Массив чекбоксов
        - Максимум элементов: 10
        - `text` (string, **обязательный**): Отображаемый текст
          - Пример: `Ничего`
          - Максимальная длина: 75 символов
        - `value` (string, **обязательный**): Уникальное строковое значение, которое будет передано в ваше приложение при выборе этого пункта
          - Пример: `nothing`
          - Максимальная длина: 150 символов
        - `description` (string, опциональный): Пояснение, которое будет указано серым цветом в этом пункте под отображаемым текстом
          - Пример: `Каждый день бот будет присылать список новых задач в вашей команде`
          - Максимальная длина: 75 символов
        - `checked` (boolean, опциональный): Изначально выбранный пункт
          - Пример: `true`
      - `required` (boolean, опциональный): Обязательность
        - Пример: `false`
      - `hint` (string, опциональный): Подсказка, которая отображается под группой чекбоксов серым цветом
        - Пример: `Выберите интересующие вас рассылки`
        - Максимальная длина: 2000 символов
    - **ViewBlockDate**: Блок date — выбор даты
      - `type` (string, **обязательный**): Тип блока
        - Пример: `date`
        - **Возможные значения:**
          - `date`: Для выбора даты всегда date
      - `name` (string, **обязательный**): Название, которое будет передано в ваше приложение как ключ указанного пользователем значения
        - Пример: `date_start`
        - Максимальная длина: 255 символов
      - `label` (string, **обязательный**): Подпись к полю
        - Пример: `Дата начала отпуска`
        - Максимальная длина: 150 символов
      - `initial_date` (string, date, опциональный): Начальное значение в поле в формате YYYY-MM-DD
        - Пример: `2025-07-01`
      - `required` (boolean, опциональный): Обязательность
        - Пример: `true`
      - `hint` (string, опциональный): Подсказка, которая отображается под полем серым цветом
        - Пример: `Укажите дату начала отпуска`
        - Максимальная длина: 2000 символов
    - **ViewBlockTime**: Блок time — выбор времени
      - `type` (string, **обязательный**): Тип блока
        - Пример: `time`
        - **Возможные значения:**
          - `time`: Для выбора времени всегда time
      - `name` (string, **обязательный**): Название, которое будет передано в ваше приложение как ключ указанного пользователем значения
        - Пример: `newsletter_time`
        - Максимальная длина: 255 символов
      - `label` (string, **обязательный**): Подпись к полю
        - Пример: `Время рассылки`
        - Максимальная длина: 150 символов
      - `initial_time` (string, time, опциональный): Начальное значение в поле в формате HH:mm
        - Пример: `11:00`
      - `required` (boolean, опциональный): Обязательность
        - Пример: `false`
      - `hint` (string, опциональный): Подсказка, которая отображается под полем серым цветом
        - Пример: `Укажите, в какое время присылать выбранные рассылки`
        - Максимальная длина: 2000 символов
    - **ViewBlockFileInput**: Блок file_input — загрузка файлов
      - `type` (string, **обязательный**): Тип блока
        - Пример: `file_input`
        - **Возможные значения:**
          - `file_input`: Для загрузки файлов всегда file_input
      - `name` (string, **обязательный**): Название, которое будет передано в ваше приложение как ключ указанного пользователем значения
        - Пример: `request_doc`
        - Максимальная длина: 255 символов
      - `label` (string, **обязательный**): Подпись к полю
        - Пример: `Заявление`
        - Максимальная длина: 150 символов
      - `filetypes` (array[string], опциональный): Массив допустимых расширений файлов, указанные в виде строк (например, ["png","jpg","gif"]). Если это поле не указано, все расширения файлов будут приняты.
        - Пример: `["pdf","jpg","png"]`
      - `max_files` (integer, int32, опциональный): Максимальное количество файлов, которое может загрузить пользователь в это поле.
        - Пример: `1`
        - По умолчанию: `10`
        - Минимум: 1
        - Максимум: 10
      - `required` (boolean, опциональный): Обязательность
        - Пример: `true`
      - `hint` (string, опциональный): Подсказка, которая отображается под полем серым цветом
        - Пример: `Загрузите заполненное заявление с электронной подписью (в формате pdf, jpg или png)`
        - Максимальная длина: 2000 символов

### Пример

```json
{
  "type": "modal",
  "trigger_id": "791a056b-006c-49dd-834b-c633fde52fe8",
  "private_metadata": "{\"timeoff_id\":4378}",
  "callback_id": "timeoff_reguest_form",
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
        "text": "Информацию о доступных вам днях отпуска вы можете прочитать по [ссылке](https://www.website.com/timeoff)"
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
        "required": false,
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
            "selected": true
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
        "required": false,
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
        "required": false,
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

## Примеры запроса

### cURL

```bash
curl "https://api.pachca.com/api/shared/v1/views/open" \
  -H "Authorization: Bearer YOUR_ACCESS_TOKEN" \
  -H "Content-Type: application/json" \
  -d '{
  "type": "modal",
  "trigger_id": "791a056b-006c-49dd-834b-c633fde52fe8",
  "private_metadata": "{\"timeoff_id\":4378}",
  "callback_id": "timeoff_reguest_form",
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
        "text": "Информацию о доступных вам днях отпуска вы можете прочитать по [ссылке](https://www.website.com/timeoff)"
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
        "required": false,
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
            "selected": true
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
        "required": false,
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
        "required": false,
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

### JavaScript

```javascript
const response = await fetch('https://api.pachca.com/api/shared/v1/views/open', {
  method: 'POST',
  headers: {
    'Authorization': 'Bearer YOUR_ACCESS_TOKEN',
    'Content-Type': 'application/json'
  },
  body: JSON.stringify({
      "type": "modal",
      "trigger_id": "791a056b-006c-49dd-834b-c633fde52fe8",
      "private_metadata": "{\"timeoff_id\":4378}",
      "callback_id": "timeoff_reguest_form",
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
                  "text": "Информацию о доступных вам днях отпуска вы можете прочитать по [ссылке](https://www.website.com/timeoff)"
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
                  "required": false,
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
                          "selected": true
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
                  "required": false,
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
                  "required": false,
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
  })
});

const data = await response.json();
console.log(data);
```

### Python

```python
import requests

data = {
    'type': 'modal',
    'trigger_id': '791a056b-006c-49dd-834b-c633fde52fe8',
    'private_metadata': '{"timeoff_id":4378}',
    'callback_id': 'timeoff_reguest_form',
    'view': {
        'title': 'Уведомление об отпуске',
        'close_text': 'Закрыть',
        'submit_text': 'Отправить заявку',
        'blocks': [
            {
                'type': 'header',
                'text': 'Основная информация'
            },
            {
                'type': 'plain_text',
                'text': 'Заполните форму. После отправки формы в общий чат будет отправлено текстовое уведомление, а ваш отпуск будет сохранен в базе.'
            },
            {
                'type': 'markdown',
                'text': 'Информацию о доступных вам днях отпуска вы можете прочитать по [ссылке](https://www.website.com/timeoff)'
            },
            {
                'type': 'divider'
            },
            {
                'type': 'input',
                'name': 'info',
                'label': 'Описание отпуска',
                'placeholder': 'Куда собираетесь и что будете делать',
                'multiline': True,
                'initial_value': 'Начальный текст',
                'min_length': 10,
                'max_length': 500,
                'required': True,
                'hint': 'Возможно вам подскаджут, какие места лучше посетить'
            },
            {
                'type': 'select',
                'name': 'team',
                'label': 'Выберите команду',
                'options': [
                    {
                        'text': 'Ничего',
                        'value': 'nothing',
                        'description': 'Каждый день бот будет присылать список новых задач в вашей команде',
                        'selected': True
                    }
                ],
                'required': False,
                'hint': 'Выберите одну из команд'
            },
            {
                'type': 'radio',
                'name': 'accessibility',
                'label': 'Доступность',
                'options': [
                    {
                        'text': 'Ничего',
                        'value': 'nothing',
                        'description': 'Каждый день бот будет присылать список новых задач в вашей команде',
                        'selected': True
                    }
                ],
                'required': True,
                'hint': 'Если вы не планируете выходить на связь, то выберите вариант Ничего'
            },
            {
                'type': 'checkbox',
                'name': 'newsletters',
                'label': 'Рассылки',
                'options': [
                    {
                        'text': 'Ничего',
                        'value': 'nothing',
                        'description': 'Каждый день бот будет присылать список новых задач в вашей команде',
                        'checked': True
                    }
                ],
                'required': False,
                'hint': 'Выберите интересующие вас рассылки'
            },
            {
                'type': 'date',
                'name': 'date_start',
                'label': 'Дата начала отпуска',
                'initial_date': '2025-07-01',
                'required': True,
                'hint': 'Укажите дату начала отпуска'
            },
            {
                'type': 'time',
                'name': 'newsletter_time',
                'label': 'Время рассылки',
                'initial_time': '11:00',
                'required': False,
                'hint': 'Укажите, в какое время присылать выбранные рассылки'
            },
            {
                'type': 'file_input',
                'name': 'request_doc',
                'label': 'Заявление',
                'filetypes': [
                    'pdf',
                    'jpg',
                    'png'
                ],
                'max_files': 1,
                'required': True,
                'hint': 'Загрузите заполненное заявление с электронной подписью (в формате pdf, jpg или png)'
            }
        ]
    }
}

headers = {
    'Authorization': 'Bearer YOUR_ACCESS_TOKEN',
    'Content-Type': 'application/json'
}

response = requests.post(
    'https://api.pachca.com/api/shared/v1/views/open',
    headers=headers,
    json=data
)

print(response.json())
```

### Node.js

```javascript
const https = require('https');

const options = {
    hostname: 'api.pachca.com',
    port: 443,
    path: '/api/shared/v1/views/open',
    method: 'POST',
    headers: {
        'Content-Type': 'application/json',
        'Authorization': 'Bearer YOUR_ACCESS_TOKEN'
    }
};

const req = https.request(options, (res) => {
    let data = '';

    res.on('data', (chunk) => {
        data += chunk;
    });

    res.on('end', () => {
        console.log(JSON.parse(data));
    });
});

req.write(JSON.stringify({
    "type": "modal",
    "trigger_id": "791a056b-006c-49dd-834b-c633fde52fe8",
    "private_metadata": "{\"timeoff_id\":4378}",
    "callback_id": "timeoff_reguest_form",
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
                "text": "Информацию о доступных вам днях отпуска вы можете прочитать по [ссылке](https://www.website.com/timeoff)"
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
                "required": false,
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
                        "selected": true
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
                "required": false,
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
                "required": false,
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
}));
req.on('error', (error) => {
    console.error(error);
});

req.end();
```

### Ruby

```ruby
require 'net/http'
require 'json'

uri = URI('https://api.pachca.com/api/shared/v1/views/open')
request = Net::HTTP::Post.new(uri)
request['Authorization'] = 'Bearer YOUR_ACCESS_TOKEN'
request['Content-Type'] = 'application/json'

request.body = {
  'type' => 'modal',
  'trigger_id' => '791a056b-006c-49dd-834b-c633fde52fe8',
  'private_metadata' => '{"timeoff_id":4378}',
  'callback_id' => 'timeoff_reguest_form',
  'view' => {
    'title' => 'Уведомление об отпуске',
    'close_text' => 'Закрыть',
    'submit_text' => 'Отправить заявку',
    'blocks' => [
      {
        'type' => 'header',
        'text' => 'Основная информация'
      },
      {
        'type' => 'plain_text',
        'text' => 'Заполните форму. После отправки формы в общий чат будет отправлено текстовое уведомление, а ваш отпуск будет сохранен в базе.'
      },
      {
        'type' => 'markdown',
        'text' => 'Информацию о доступных вам днях отпуска вы можете прочитать по [ссылке](https://www.website.com/timeoff)'
      },
      {
        'type' => 'divider'
      },
      {
        'type' => 'input',
        'name' => 'info',
        'label' => 'Описание отпуска',
        'placeholder' => 'Куда собираетесь и что будете делать',
        'multiline' => true,
        'initial_value' => 'Начальный текст',
        'min_length' => 10,
        'max_length' => 500,
        'required' => true,
        'hint' => 'Возможно вам подскаджут, какие места лучше посетить'
      },
      {
        'type' => 'select',
        'name' => 'team',
        'label' => 'Выберите команду',
        'options' => [
          {
            'text' => 'Ничего',
            'value' => 'nothing',
            'description' => 'Каждый день бот будет присылать список новых задач в вашей команде',
            'selected' => true
          }
        ],
        'required' => false,
        'hint' => 'Выберите одну из команд'
      },
      {
        'type' => 'radio',
        'name' => 'accessibility',
        'label' => 'Доступность',
        'options' => [
          {
            'text' => 'Ничего',
            'value' => 'nothing',
            'description' => 'Каждый день бот будет присылать список новых задач в вашей команде',
            'selected' => true
          }
        ],
        'required' => true,
        'hint' => 'Если вы не планируете выходить на связь, то выберите вариант Ничего'
      },
      {
        'type' => 'checkbox',
        'name' => 'newsletters',
        'label' => 'Рассылки',
        'options' => [
          {
            'text' => 'Ничего',
            'value' => 'nothing',
            'description' => 'Каждый день бот будет присылать список новых задач в вашей команде',
            'checked' => true
          }
        ],
        'required' => false,
        'hint' => 'Выберите интересующие вас рассылки'
      },
      {
        'type' => 'date',
        'name' => 'date_start',
        'label' => 'Дата начала отпуска',
        'initial_date' => '2025-07-01',
        'required' => true,
        'hint' => 'Укажите дату начала отпуска'
      },
      {
        'type' => 'time',
        'name' => 'newsletter_time',
        'label' => 'Время рассылки',
        'initial_time' => '11:00',
        'required' => false,
        'hint' => 'Укажите, в какое время присылать выбранные рассылки'
      },
      {
        'type' => 'file_input',
        'name' => 'request_doc',
        'label' => 'Заявление',
        'filetypes' => [
          'pdf',
          'jpg',
          'png'
        ],
        'max_files' => 1,
        'required' => true,
        'hint' => 'Загрузите заполненное заявление с электронной подписью (в формате pdf, jpg или png)'
      }
    ]
  }
}.to_json

response = Net::HTTP.start(uri.hostname, uri.port, use_ssl: true) do |http|
  http.request(request)
end

puts JSON.parse(response.body)
```

### PHP

```php
<?php

$curl = curl_init();

curl_setopt_array($curl, [
    CURLOPT_URL => 'https://api.pachca.com/api/shared/v1/views/open',
    CURLOPT_RETURNTRANSFER => true,
    CURLOPT_CUSTOMREQUEST => 'POST',
    CURLOPT_HTTPHEADER => [
        'Authorization: Bearer YOUR_ACCESS_TOKEN',
        'Content-Type: application/json',
    ],
    CURLOPT_POSTFIELDS => json_encode([
    'type' => 'modal',
    'trigger_id' => '791a056b-006c-49dd-834b-c633fde52fe8',
    'private_metadata' => '{"timeoff_id":4378}',
    'callback_id' => 'timeoff_reguest_form',
    'view' => [
        'title' => 'Уведомление об отпуске',
        'close_text' => 'Закрыть',
        'submit_text' => 'Отправить заявку',
        'blocks' => [
            [
                'type' => 'header',
                'text' => 'Основная информация'
            ],
            [
                'type' => 'plain_text',
                'text' => 'Заполните форму. После отправки формы в общий чат будет отправлено текстовое уведомление, а ваш отпуск будет сохранен в базе.'
            ],
            [
                'type' => 'markdown',
                'text' => 'Информацию о доступных вам днях отпуска вы можете прочитать по [ссылке](https://www.website.com/timeoff)'
            ],
            [
                'type' => 'divider'
            ],
            [
                'type' => 'input',
                'name' => 'info',
                'label' => 'Описание отпуска',
                'placeholder' => 'Куда собираетесь и что будете делать',
                'multiline' => true,
                'initial_value' => 'Начальный текст',
                'min_length' => 10,
                'max_length' => 500,
                'required' => true,
                'hint' => 'Возможно вам подскаджут, какие места лучше посетить'
            ],
            [
                'type' => 'select',
                'name' => 'team',
                'label' => 'Выберите команду',
                'options' => [
                    [
                        'text' => 'Ничего',
                        'value' => 'nothing',
                        'description' => 'Каждый день бот будет присылать список новых задач в вашей команде',
                        'selected' => true
                    ]
                ],
                'required' => false,
                'hint' => 'Выберите одну из команд'
            ],
            [
                'type' => 'radio',
                'name' => 'accessibility',
                'label' => 'Доступность',
                'options' => [
                    [
                        'text' => 'Ничего',
                        'value' => 'nothing',
                        'description' => 'Каждый день бот будет присылать список новых задач в вашей команде',
                        'selected' => true
                    ]
                ],
                'required' => true,
                'hint' => 'Если вы не планируете выходить на связь, то выберите вариант Ничего'
            ],
            [
                'type' => 'checkbox',
                'name' => 'newsletters',
                'label' => 'Рассылки',
                'options' => [
                    [
                        'text' => 'Ничего',
                        'value' => 'nothing',
                        'description' => 'Каждый день бот будет присылать список новых задач в вашей команде',
                        'checked' => true
                    ]
                ],
                'required' => false,
                'hint' => 'Выберите интересующие вас рассылки'
            ],
            [
                'type' => 'date',
                'name' => 'date_start',
                'label' => 'Дата начала отпуска',
                'initial_date' => '2025-07-01',
                'required' => true,
                'hint' => 'Укажите дату начала отпуска'
            ],
            [
                'type' => 'time',
                'name' => 'newsletter_time',
                'label' => 'Время рассылки',
                'initial_time' => '11:00',
                'required' => false,
                'hint' => 'Укажите, в какое время присылать выбранные рассылки'
            ],
            [
                'type' => 'file_input',
                'name' => 'request_doc',
                'label' => 'Заявление',
                'filetypes' => [
                    'pdf',
                    'jpg',
                    'png'
                ],
                'max_files' => 1,
                'required' => true,
                'hint' => 'Загрузите заполненное заявление с электронной подписью (в формате pdf, jpg или png)'
            ]
        ]
    ]
]),
]);

$response = curl_exec($curl);
curl_close($curl);

echo $response;
?>
```

## Ответы

### 201: The request has succeeded and a new resource has been created as a result.

### 400: The server could not understand the request due to invalid syntax.

**Схема ответа при ошибке:**

- `errors` (array[object], **обязательный**): Массив ошибок
  - `key` (string, **обязательный**): Ключ поля с ошибкой
    - Пример: `field.name`
  - `value` (string, **обязательный**): Значение поля, которое вызвало ошибку
    - Пример: `invalid_value`
  - `message` (string, **обязательный**): Сообщение об ошибке
    - Пример: `Поле не может быть пустым`
  - `code` (string, **обязательный**): Код ошибки
    - **Возможные значения:**
      - `blank`: Обязательное поле (не может быть пустым)
      - `too_long`: Слишком длинное значение (пояснения вы получите в поле message)
      - `invalid`: Поле не соответствует правилам (пояснения вы получите в поле message)
      - `inclusion`: Поле имеет непредусмотренное значение
      - `exclusion`: Поле имеет недопустимое значение
      - `taken`: Название для этого поля уже существует
      - `wrong_emoji`: Emoji статуса не может содержать значения отличные от Emoji символа
      - `not_found`: Объект не найден
      - `already_exists`: Объект уже существует (пояснения вы получите в поле message)
      - `personal_chat`: Ошибка личного чата (пояснения вы получите в поле message)
      - `displayed_error`: Отображаемая ошибка (пояснения вы получите в поле message)
      - `not_authorized`: Действие запрещено
      - `invalid_date_range`: Выбран слишком большой диапазон дат
      - `invalid_webhook_url`: Некорректный URL вебхука
      - `rate_limit`: Достигнут лимит запросов
      - `licenses_limit`: Превышен лимит активных сотрудников (пояснения вы получите в поле message)
      - `user_limit`: Превышен лимит количества реакций, которые может добавить пользователь (20 уникальных реакций)
      - `unique_limit`: Превышен лимит количества уникальных реакций, которые можно добавить на сообщение (30 уникальных реакций)
      - `general_limit`: Превышен лимит количества реакций, которые можно добавить на сообщение (1000 реакций)
      - `unhandled`: Ошибка выполнения запроса (пояснения вы получите в поле message)
      - `trigger_not_found`: Не удалось найти идентификатор события
      - `trigger_expired`: Время жизни идентификатора события истекло
      - `required`: Обязательный параметр не передан
      - `in`: Недопустимое значение (не входит в список допустимых)
      - `not_applicable`: Значение неприменимо в данном контексте (пояснения вы получите в поле message)
      - `self_update`: Нельзя изменить свои собственные данные
      - `owner_protected`: Нельзя изменить данные владельца
      - `already_assigned`: Значение уже назначено
      - `forbidden`: Недостаточно прав для выполнения действия (пояснения вы получите в поле message)
      - `permission_denied`: Доступ запрещён (недостаточно прав)
      - `access_denied`: Доступ запрещён
      - `wrong_params`: Некорректные параметры запроса (пояснения вы получите в поле message)
      - `payment_required`: Требуется оплата
      - `min_length`: Значение слишком короткое (пояснения вы получите в поле message)
      - `max_length`: Значение слишком длинное (пояснения вы получите в поле message)
  - `payload` (string, **обязательный**): Дополнительные данные об ошибке
    - Пример: `null`

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

**Схема ответа при ошибке:**

- `error` (string, **обязательный**): Код ошибки
  - Пример: `invalid_token`
- `error_description` (string, **обязательный**): Описание ошибки
  - Пример: `Access token is missing`

**Пример ответа:**

```json
{
  "error": "invalid_token",
  "error_description": "Access token is missing"
}
```

### 403: Access is forbidden.

**Схема ответа при ошибке:**

- `error` (string, **обязательный**): Код ошибки
  - Пример: `invalid_token`
- `error_description` (string, **обязательный**): Описание ошибки
  - Пример: `Access token is missing`

**Пример ответа:**

```json
{
  "error": "invalid_token",
  "error_description": "Access token is missing"
}
```

### 410: Client error

**Схема ответа при ошибке:**

- `errors` (array[object], **обязательный**): Массив ошибок
  - `key` (string, **обязательный**): Ключ поля с ошибкой
    - Пример: `field.name`
  - `value` (string, **обязательный**): Значение поля, которое вызвало ошибку
    - Пример: `invalid_value`
  - `message` (string, **обязательный**): Сообщение об ошибке
    - Пример: `Поле не может быть пустым`
  - `code` (string, **обязательный**): Код ошибки
    - **Возможные значения:**
      - `blank`: Обязательное поле (не может быть пустым)
      - `too_long`: Слишком длинное значение (пояснения вы получите в поле message)
      - `invalid`: Поле не соответствует правилам (пояснения вы получите в поле message)
      - `inclusion`: Поле имеет непредусмотренное значение
      - `exclusion`: Поле имеет недопустимое значение
      - `taken`: Название для этого поля уже существует
      - `wrong_emoji`: Emoji статуса не может содержать значения отличные от Emoji символа
      - `not_found`: Объект не найден
      - `already_exists`: Объект уже существует (пояснения вы получите в поле message)
      - `personal_chat`: Ошибка личного чата (пояснения вы получите в поле message)
      - `displayed_error`: Отображаемая ошибка (пояснения вы получите в поле message)
      - `not_authorized`: Действие запрещено
      - `invalid_date_range`: Выбран слишком большой диапазон дат
      - `invalid_webhook_url`: Некорректный URL вебхука
      - `rate_limit`: Достигнут лимит запросов
      - `licenses_limit`: Превышен лимит активных сотрудников (пояснения вы получите в поле message)
      - `user_limit`: Превышен лимит количества реакций, которые может добавить пользователь (20 уникальных реакций)
      - `unique_limit`: Превышен лимит количества уникальных реакций, которые можно добавить на сообщение (30 уникальных реакций)
      - `general_limit`: Превышен лимит количества реакций, которые можно добавить на сообщение (1000 реакций)
      - `unhandled`: Ошибка выполнения запроса (пояснения вы получите в поле message)
      - `trigger_not_found`: Не удалось найти идентификатор события
      - `trigger_expired`: Время жизни идентификатора события истекло
      - `required`: Обязательный параметр не передан
      - `in`: Недопустимое значение (не входит в список допустимых)
      - `not_applicable`: Значение неприменимо в данном контексте (пояснения вы получите в поле message)
      - `self_update`: Нельзя изменить свои собственные данные
      - `owner_protected`: Нельзя изменить данные владельца
      - `already_assigned`: Значение уже назначено
      - `forbidden`: Недостаточно прав для выполнения действия (пояснения вы получите в поле message)
      - `permission_denied`: Доступ запрещён (недостаточно прав)
      - `access_denied`: Доступ запрещён
      - `wrong_params`: Некорректные параметры запроса (пояснения вы получите в поле message)
      - `payment_required`: Требуется оплата
      - `min_length`: Значение слишком короткое (пояснения вы получите в поле message)
      - `max_length`: Значение слишком длинное (пояснения вы получите в поле message)
  - `payload` (string, **обязательный**): Дополнительные данные об ошибке
    - Пример: `null`

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

**Схема ответа при ошибке:**

- `errors` (array[object], **обязательный**): Массив ошибок
  - `key` (string, **обязательный**): Ключ поля с ошибкой
    - Пример: `field.name`
  - `value` (string, **обязательный**): Значение поля, которое вызвало ошибку
    - Пример: `invalid_value`
  - `message` (string, **обязательный**): Сообщение об ошибке
    - Пример: `Поле не может быть пустым`
  - `code` (string, **обязательный**): Код ошибки
    - **Возможные значения:**
      - `blank`: Обязательное поле (не может быть пустым)
      - `too_long`: Слишком длинное значение (пояснения вы получите в поле message)
      - `invalid`: Поле не соответствует правилам (пояснения вы получите в поле message)
      - `inclusion`: Поле имеет непредусмотренное значение
      - `exclusion`: Поле имеет недопустимое значение
      - `taken`: Название для этого поля уже существует
      - `wrong_emoji`: Emoji статуса не может содержать значения отличные от Emoji символа
      - `not_found`: Объект не найден
      - `already_exists`: Объект уже существует (пояснения вы получите в поле message)
      - `personal_chat`: Ошибка личного чата (пояснения вы получите в поле message)
      - `displayed_error`: Отображаемая ошибка (пояснения вы получите в поле message)
      - `not_authorized`: Действие запрещено
      - `invalid_date_range`: Выбран слишком большой диапазон дат
      - `invalid_webhook_url`: Некорректный URL вебхука
      - `rate_limit`: Достигнут лимит запросов
      - `licenses_limit`: Превышен лимит активных сотрудников (пояснения вы получите в поле message)
      - `user_limit`: Превышен лимит количества реакций, которые может добавить пользователь (20 уникальных реакций)
      - `unique_limit`: Превышен лимит количества уникальных реакций, которые можно добавить на сообщение (30 уникальных реакций)
      - `general_limit`: Превышен лимит количества реакций, которые можно добавить на сообщение (1000 реакций)
      - `unhandled`: Ошибка выполнения запроса (пояснения вы получите в поле message)
      - `trigger_not_found`: Не удалось найти идентификатор события
      - `trigger_expired`: Время жизни идентификатора события истекло
      - `required`: Обязательный параметр не передан
      - `in`: Недопустимое значение (не входит в список допустимых)
      - `not_applicable`: Значение неприменимо в данном контексте (пояснения вы получите в поле message)
      - `self_update`: Нельзя изменить свои собственные данные
      - `owner_protected`: Нельзя изменить данные владельца
      - `already_assigned`: Значение уже назначено
      - `forbidden`: Недостаточно прав для выполнения действия (пояснения вы получите в поле message)
      - `permission_denied`: Доступ запрещён (недостаточно прав)
      - `access_denied`: Доступ запрещён
      - `wrong_params`: Некорректные параметры запроса (пояснения вы получите в поле message)
      - `payment_required`: Требуется оплата
      - `min_length`: Значение слишком короткое (пояснения вы получите в поле message)
      - `max_length`: Значение слишком длинное (пояснения вы получите в поле message)
  - `payload` (string, **обязательный**): Дополнительные данные об ошибке
    - Пример: `null`

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

