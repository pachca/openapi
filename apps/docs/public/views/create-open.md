# Открытие представления

**Метод**: `POST`

**Путь**: `/views/open`

Метод для открытия модального окна с представлением для пользователя.

Чтобы открыть модальное окно с представлением, ваше приложение должно иметь действительный, неистекший `trigger_id`.

## Тело запроса

**Обязательно**

Формат: `application/json`

### Схема

- `type` (string, **обязательный**): Способ открытия представления
  - **Возможные значения:**
    - `modal`: Модальное окно
- `trigger_id` (string, **обязательный**): Уникальный идентификатор события (полученный, например, в исходящем вебхуке о нажатии кнопки)
- `private_metadata` (string, опциональный): Необязательная строка, которая будет отправлена в ваше приложение при отправке пользователем заполненной формы. Используйте это поле, например, для передачи в формате `JSON` какой то дополнительной информации вместе с заполненной пользователем формой.
  - Максимальная длина: 3000 символов
- `callback_id` (string, опциональный): Необязательный идентификатор для распознавания этого представления, который будет отправлен в ваше приложение при отправке пользователем заполненной формы. Используйте это поле, например, для понимания, какую форму должен был заполнить пользователь.
  - Максимальная длина: 255 символов
- `view` (object, **обязательный**): Собранный объект представления
  - `title` (string, **обязательный**): Заголовок представления
    - Максимальная длина: 24 символов
  - `close_text` (string, опциональный): Текст кнопки закрытия представления
    - По умолчанию: `Отменить`
    - Максимальная длина: 24 символов
  - `submit_text` (string, опциональный): Текст кнопки отправки формы
    - По умолчанию: `Отправить`
    - Максимальная длина: 24 символов
  - `blocks` (array (union), **обязательный**): Массив блоков представления
    - Максимум элементов: 100
    **Возможные типы элементов:**

    - **ViewBlockHeader**: Блок header — заголовок
      - `type` (string, **обязательный**): Тип блока
        - **Возможные значения:**
          - `header`: Для заголовков всегда header
      - `text` (string, **обязательный**): Текст заголовка
        - Максимальная длина: 150 символов
    - **ViewBlockPlainText**: Блок plain_text — обычный текст
      - `type` (string, **обязательный**): Тип блока
        - **Возможные значения:**
          - `plain_text`: Для обычного текста всегда plain_text
      - `text` (string, **обязательный**): Текст
        - Максимальная длина: 12000 символов
    - **ViewBlockMarkdown**: Блок markdown — форматированный текст
      - `type` (string, **обязательный**): Тип блока
        - **Возможные значения:**
          - `markdown`: Для форматированного текста всегда markdown
      - `text` (string, **обязательный**): Текст
        - Максимальная длина: 12000 символов
    - **ViewBlockDivider**: Блок divider — разделитель
      - `type` (string, **обязательный**): Тип блока
        - **Возможные значения:**
          - `divider`: Для разделителя всегда divider
    - **ViewBlockInput**: Блок input — текстовое поле ввода
      - `type` (string, **обязательный**): Тип блока
        - **Возможные значения:**
          - `input`: Для текстового поля всегда input
      - `name` (string, **обязательный**): Название, которое будет передано в ваше приложение как ключ указанного пользователем значения
        - Максимальная длина: 255 символов
      - `label` (string, **обязательный**): Подпись к полю
        - Максимальная длина: 150 символов
      - `placeholder` (string, опциональный): Подсказка внутри поля ввода, пока оно пустое
        - Максимальная длина: 150 символов
      - `multiline` (boolean, опциональный): Многострочное поле
      - `initial_value` (string, опциональный): Начальное значение в поле
        - Максимальная длина: 3000 символов
      - `min_length` (integer, int32, опциональный): Минимальная длина текста, который должен написать пользователь. Если пользователь напишет меньше, он получит ошибку.
        - Минимум: 0
        - Максимум: 3000
      - `max_length` (integer, int32, опциональный): Максимальная длина текста, который должен написать пользователь. Если пользователь напишет больше, он получит ошибку.
        - Минимум: 1
        - Максимум: 3000
      - `required` (boolean, опциональный): Обязательность
      - `hint` (string, опциональный): Подсказка, которая отображается под полем серым цветом
        - Максимальная длина: 2000 символов
    - **ViewBlockSelect**: Блок select — выпадающий список
      - `type` (string, **обязательный**): Тип блока
        - **Возможные значения:**
          - `select`: Для выпадающего списка всегда select
      - `name` (string, **обязательный**): Название, которое будет передано в ваше приложение как ключ указанного пользователем выбора
        - Максимальная длина: 255 символов
      - `label` (string, **обязательный**): Подпись к выпадающему списку
        - Максимальная длина: 150 символов
      - `options` (array[object], опциональный): Массив доступных пунктов в выпадающем списке
        - Максимум элементов: 100
        - `text` (string, **обязательный**): Отображаемый текст
          - Максимальная длина: 75 символов
        - `value` (string, **обязательный**): Уникальное строковое значение, которое будет передано в ваше приложение при выборе этого пункта
          - Максимальная длина: 150 символов
        - `description` (string, опциональный): Пояснение, которое будет указано серым цветом в этом пункте под отображаемым текстом
          - Максимальная длина: 75 символов
        - `checked` (boolean, опциональный): Изначально выбранный пункт. Только один пункт может быть выбран.
        - `selected` (boolean, опциональный): Изначально выбранный пункт. Только один пункт может быть выбран.
      - `required` (boolean, опциональный): Обязательность
      - `hint` (string, опциональный): Подсказка, которая отображается под выпадающим списком серым цветом
        - Максимальная длина: 2000 символов
    - **ViewBlockRadio**: Блок radio — радиокнопки
      - `type` (string, **обязательный**): Тип блока
        - **Возможные значения:**
          - `radio`: Для радиокнопок всегда radio
      - `name` (string, **обязательный**): Название, которое будет передано в ваше приложение как ключ указанного пользователем выбора
        - Максимальная длина: 255 символов
      - `label` (string, **обязательный**): Подпись к группе радиокнопок
        - Максимальная длина: 150 символов
      - `options` (array[object], опциональный): Массив радиокнопок
        - Максимум элементов: 10
        - `text` (string, **обязательный**): Отображаемый текст
          - Максимальная длина: 75 символов
        - `value` (string, **обязательный**): Уникальное строковое значение, которое будет передано в ваше приложение при выборе этого пункта
          - Максимальная длина: 150 символов
        - `description` (string, опциональный): Пояснение, которое будет указано серым цветом в этом пункте под отображаемым текстом
          - Максимальная длина: 75 символов
        - `checked` (boolean, опциональный): Изначально выбранный пункт. Только один пункт может быть выбран.
        - `selected` (boolean, опциональный): Изначально выбранный пункт. Только один пункт может быть выбран.
      - `required` (boolean, опциональный): Обязательность
      - `hint` (string, опциональный): Подсказка, которая отображается под группой радиокнопок серым цветом
        - Максимальная длина: 2000 символов
    - **ViewBlockCheckbox**: Блок checkbox — чекбоксы
      - `type` (string, **обязательный**): Тип блока
        - **Возможные значения:**
          - `checkbox`: Для чекбоксов всегда checkbox
      - `name` (string, **обязательный**): Название, которое будет передано в ваше приложение как ключ указанного пользователем выбора
        - Максимальная длина: 255 символов
      - `label` (string, **обязательный**): Подпись к группе чекбоксов
        - Максимальная длина: 150 символов
      - `options` (array[object], опциональный): Массив чекбоксов
        - Максимум элементов: 10
        - `text` (string, **обязательный**): Отображаемый текст
          - Максимальная длина: 75 символов
        - `value` (string, **обязательный**): Уникальное строковое значение, которое будет передано в ваше приложение при выборе этого пункта
          - Максимальная длина: 150 символов
        - `description` (string, опциональный): Пояснение, которое будет указано серым цветом в этом пункте под отображаемым текстом
          - Максимальная длина: 75 символов
        - `checked` (boolean, опциональный): Изначально выбранный пункт. Только один пункт может быть выбран.
        - `selected` (boolean, опциональный): Изначально выбранный пункт. Только один пункт может быть выбран.
      - `required` (boolean, опциональный): Обязательность
      - `hint` (string, опциональный): Подсказка, которая отображается под группой чекбоксов серым цветом
        - Максимальная длина: 2000 символов
    - **ViewBlockDate**: Блок date — выбор даты
      - `type` (string, **обязательный**): Тип блока
        - **Возможные значения:**
          - `date`: Для выбора даты всегда date
      - `name` (string, **обязательный**): Название, которое будет передано в ваше приложение как ключ указанного пользователем значения
        - Максимальная длина: 255 символов
      - `label` (string, **обязательный**): Подпись к полю
        - Максимальная длина: 150 символов
      - `initial_date` (string, date, опциональный): Начальное значение в поле в формате YYYY-MM-DD
      - `required` (boolean, опциональный): Обязательность
      - `hint` (string, опциональный): Подсказка, которая отображается под полем серым цветом
        - Максимальная длина: 2000 символов
    - **ViewBlockTime**: Блок time — выбор времени
      - `type` (string, **обязательный**): Тип блока
        - **Возможные значения:**
          - `time`: Для выбора времени всегда time
      - `name` (string, **обязательный**): Название, которое будет передано в ваше приложение как ключ указанного пользователем значения
        - Максимальная длина: 255 символов
      - `label` (string, **обязательный**): Подпись к полю
        - Максимальная длина: 150 символов
      - `initial_time` (string, time, опциональный): Начальное значение в поле в формате HH:mm
      - `required` (boolean, опциональный): Обязательность
      - `hint` (string, опциональный): Подсказка, которая отображается под полем серым цветом
        - Максимальная длина: 2000 символов
    - **ViewBlockFileInput**: Блок file_input — загрузка файлов
      - `type` (string, **обязательный**): Тип блока
        - **Возможные значения:**
          - `file_input`: Для загрузки файлов всегда file_input
      - `name` (string, **обязательный**): Название, которое будет передано в ваше приложение как ключ указанного пользователем значения
        - Максимальная длина: 255 символов
      - `label` (string, **обязательный**): Подпись к полю
        - Максимальная длина: 150 символов
      - `filetypes` (array[string], опциональный): Массив допустимых расширений файлов, указанные в виде строк (например, ["png","jpg","gif"]). Если это поле не указано, все расширения файлов будут приняты.
      - `max_files` (integer, int32, опциональный): Максимальное количество файлов, которое может загрузить пользователь в это поле.
        - По умолчанию: `10`
        - Минимум: 1
        - Максимум: 10
      - `required` (boolean, опциональный): Обязательность
      - `hint` (string, опциональный): Подсказка, которая отображается под полем серым цветом
        - Максимальная длина: 2000 символов

### Пример

```json
{
  "trigger_id": "791a056b-006c-49dd-834b-c633fde52fe8",
  "type": "modal",
  "private_metadata": "{'timeoff_id':4378}",
  "callback_id": "timeoff_reguest_form",
  "view": {
    "title": "Уведомление об отпуске",
    "close_text": "Закрыть",
    "submit_text": "Отправить заявку",
    "blocks": [
      {
        "type": "plain_text",
        "text": "Заполните форму. После отправки формы в общий чат будет отправлено текстовое уведомление, а ваш отпуск будет сохранен в базе."
      },
      {
        "type": "markdown",
        "text": "Информацию о доступных вам днях отпуска вы можете прочитать по [ссылке](https://www.website.com/timeoff)"
      },
      {
        "type": "header",
        "text": "Основная информация"
      },
      {
        "type": "date",
        "name": "date_start",
        "label": "Дата начала отпуска",
        "initial_date": "2025-07-01",
        "required": true
      },
      {
        "type": "date",
        "name": "date_end",
        "label": "Дата окончания отпуска",
        "initial_date": "2025-07-28",
        "required": true
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
      },
      {
        "type": "radio",
        "name": "accessibility",
        "label": "Доступность",
        "options": [
          {
            "text": "Ничего",
            "value": "nothing",
            "checked": true
          },
          {
            "text": "Только телефон",
            "value": "phone_only"
          },
          {
            "text": "Телефон и ноутбук",
            "value": "phone_notebook"
          }
        ],
        "required": true,
        "hint": "Если вы не планируете выходить на связь, то выберите вариант Ничего"
      },
      {
        "type": "divider"
      },
      {
        "type": "header",
        "text": "Дополнительно"
      },
      {
        "type": "input",
        "name": "info",
        "label": "Описание отпуска",
        "placeholder": "Куда собираетесь и что будете делать",
        "multiline": true,
        "hint": "Возможно вам подскаджут, какие места лучше посетить"
      },
      {
        "type": "checkbox",
        "name": "newsletters",
        "label": "Рассылки",
        "options": [
          {
            "text": "Получать уведомления о новых задачах в команде",
            "value": "new_tasks",
            "description": "Каждый день бот будет присылать список новых задач в вашей команде"
          },
          {
            "text": "Получать уведомления об обновлениях в проектах",
            "value": "project_updates",
            "description": "Два раза в неделю бот будет присылать обновления по проектам"
          }
        ]
      },
      {
        "type": "select",
        "name": "team",
        "label": "Выберите команду",
        "options": [
          {
            "text": "Все команды",
            "value": "all"
          },
          {
            "text": "Web",
            "value": "web",
            "selected": true
          },
          {
            "text": "iOS",
            "value": "ios"
          },
          {
            "text": "Android",
            "value": "android"
          },
          {
            "text": "Back",
            "value": "back"
          },
          {
            "text": "Design",
            "value": "design"
          },
          {
            "text": "Success",
            "value": "success"
          }
        ]
      },
      {
        "type": "time",
        "name": "newsletter_time",
        "label": "Время рассылки",
        "initial_time": "11:00",
        "hint": "Укажите, в какое время присылать выбранные рассылки"
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
  "trigger_id": "791a056b-006c-49dd-834b-c633fde52fe8",
  "type": "modal",
  "private_metadata": "{'timeoff_id':4378}",
  "callback_id": "timeoff_reguest_form",
  "view": {
    "title": "Уведомление об отпуске",
    "close_text": "Закрыть",
    "submit_text": "Отправить заявку",
    "blocks": [
      {
        "type": "plain_text",
        "text": "Заполните форму. После отправки формы в общий чат будет отправлено текстовое уведомление, а ваш отпуск будет сохранен в базе."
      },
      {
        "type": "markdown",
        "text": "Информацию о доступных вам днях отпуска вы можете прочитать по [ссылке](https://www.website.com/timeoff)"
      },
      {
        "type": "header",
        "text": "Основная информация"
      },
      {
        "type": "date",
        "name": "date_start",
        "label": "Дата начала отпуска",
        "initial_date": "2025-07-01",
        "required": true
      },
      {
        "type": "date",
        "name": "date_end",
        "label": "Дата окончания отпуска",
        "initial_date": "2025-07-28",
        "required": true
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
      },
      {
        "type": "radio",
        "name": "accessibility",
        "label": "Доступность",
        "options": [
          {
            "text": "Ничего",
            "value": "nothing",
            "checked": true
          },
          {
            "text": "Только телефон",
            "value": "phone_only"
          },
          {
            "text": "Телефон и ноутбук",
            "value": "phone_notebook"
          }
        ],
        "required": true,
        "hint": "Если вы не планируете выходить на связь, то выберите вариант Ничего"
      },
      {
        "type": "divider"
      },
      {
        "type": "header",
        "text": "Дополнительно"
      },
      {
        "type": "input",
        "name": "info",
        "label": "Описание отпуска",
        "placeholder": "Куда собираетесь и что будете делать",
        "multiline": true,
        "hint": "Возможно вам подскаджут, какие места лучше посетить"
      },
      {
        "type": "checkbox",
        "name": "newsletters",
        "label": "Рассылки",
        "options": [
          {
            "text": "Получать уведомления о новых задачах в команде",
            "value": "new_tasks",
            "description": "Каждый день бот будет присылать список новых задач в вашей команде"
          },
          {
            "text": "Получать уведомления об обновлениях в проектах",
            "value": "project_updates",
            "description": "Два раза в неделю бот будет присылать обновления по проектам"
          }
        ]
      },
      {
        "type": "select",
        "name": "team",
        "label": "Выберите команду",
        "options": [
          {
            "text": "Все команды",
            "value": "all"
          },
          {
            "text": "Web",
            "value": "web",
            "selected": true
          },
          {
            "text": "iOS",
            "value": "ios"
          },
          {
            "text": "Android",
            "value": "android"
          },
          {
            "text": "Back",
            "value": "back"
          },
          {
            "text": "Design",
            "value": "design"
          },
          {
            "text": "Success",
            "value": "success"
          }
        ]
      },
      {
        "type": "time",
        "name": "newsletter_time",
        "label": "Время рассылки",
        "initial_time": "11:00",
        "hint": "Укажите, в какое время присылать выбранные рассылки"
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
      "trigger_id": "791a056b-006c-49dd-834b-c633fde52fe8",
      "type": "modal",
      "private_metadata": "{'timeoff_id':4378}",
      "callback_id": "timeoff_reguest_form",
      "view": {
          "title": "Уведомление об отпуске",
          "close_text": "Закрыть",
          "submit_text": "Отправить заявку",
          "blocks": [
              {
                  "type": "plain_text",
                  "text": "Заполните форму. После отправки формы в общий чат будет отправлено текстовое уведомление, а ваш отпуск будет сохранен в базе."
              },
              {
                  "type": "markdown",
                  "text": "Информацию о доступных вам днях отпуска вы можете прочитать по [ссылке](https://www.website.com/timeoff)"
              },
              {
                  "type": "header",
                  "text": "Основная информация"
              },
              {
                  "type": "date",
                  "name": "date_start",
                  "label": "Дата начала отпуска",
                  "initial_date": "2025-07-01",
                  "required": true
              },
              {
                  "type": "date",
                  "name": "date_end",
                  "label": "Дата окончания отпуска",
                  "initial_date": "2025-07-28",
                  "required": true
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
              },
              {
                  "type": "radio",
                  "name": "accessibility",
                  "label": "Доступность",
                  "options": [
                      {
                          "text": "Ничего",
                          "value": "nothing",
                          "checked": true
                      },
                      {
                          "text": "Только телефон",
                          "value": "phone_only"
                      },
                      {
                          "text": "Телефон и ноутбук",
                          "value": "phone_notebook"
                      }
                  ],
                  "required": true,
                  "hint": "Если вы не планируете выходить на связь, то выберите вариант Ничего"
              },
              {
                  "type": "divider"
              },
              {
                  "type": "header",
                  "text": "Дополнительно"
              },
              {
                  "type": "input",
                  "name": "info",
                  "label": "Описание отпуска",
                  "placeholder": "Куда собираетесь и что будете делать",
                  "multiline": true,
                  "hint": "Возможно вам подскаджут, какие места лучше посетить"
              },
              {
                  "type": "checkbox",
                  "name": "newsletters",
                  "label": "Рассылки",
                  "options": [
                      {
                          "text": "Получать уведомления о новых задачах в команде",
                          "value": "new_tasks",
                          "description": "Каждый день бот будет присылать список новых задач в вашей команде"
                      },
                      {
                          "text": "Получать уведомления об обновлениях в проектах",
                          "value": "project_updates",
                          "description": "Два раза в неделю бот будет присылать обновления по проектам"
                      }
                  ]
              },
              {
                  "type": "select",
                  "name": "team",
                  "label": "Выберите команду",
                  "options": [
                      {
                          "text": "Все команды",
                          "value": "all"
                      },
                      {
                          "text": "Web",
                          "value": "web",
                          "selected": true
                      },
                      {
                          "text": "iOS",
                          "value": "ios"
                      },
                      {
                          "text": "Android",
                          "value": "android"
                      },
                      {
                          "text": "Back",
                          "value": "back"
                      },
                      {
                          "text": "Design",
                          "value": "design"
                      },
                      {
                          "text": "Success",
                          "value": "success"
                      }
                  ]
              },
              {
                  "type": "time",
                  "name": "newsletter_time",
                  "label": "Время рассылки",
                  "initial_time": "11:00",
                  "hint": "Укажите, в какое время присылать выбранные рассылки"
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
    'trigger_id': '791a056b-006c-49dd-834b-c633fde52fe8',
    'type': 'modal',
    'private_metadata': '{'timeoff_id':4378}',
    'callback_id': 'timeoff_reguest_form',
    'view': {
        'title': 'Уведомление об отпуске',
        'close_text': 'Закрыть',
        'submit_text': 'Отправить заявку',
        'blocks': [
            {
                'type': 'plain_text',
                'text': 'Заполните форму. После отправки формы в общий чат будет отправлено текстовое уведомление, а ваш отпуск будет сохранен в базе.'
            },
            {
                'type': 'markdown',
                'text': 'Информацию о доступных вам днях отпуска вы можете прочитать по [ссылке](https://www.website.com/timeoff)'
            },
            {
                'type': 'header',
                'text': 'Основная информация'
            },
            {
                'type': 'date',
                'name': 'date_start',
                'label': 'Дата начала отпуска',
                'initial_date': '2025-07-01',
                'required': True
            },
            {
                'type': 'date',
                'name': 'date_end',
                'label': 'Дата окончания отпуска',
                'initial_date': '2025-07-28',
                'required': True
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
            },
            {
                'type': 'radio',
                'name': 'accessibility',
                'label': 'Доступность',
                'options': [
                    {
                        'text': 'Ничего',
                        'value': 'nothing',
                        'checked': True
                    },
                    {
                        'text': 'Только телефон',
                        'value': 'phone_only'
                    },
                    {
                        'text': 'Телефон и ноутбук',
                        'value': 'phone_notebook'
                    }
                ],
                'required': True,
                'hint': 'Если вы не планируете выходить на связь, то выберите вариант Ничего'
            },
            {
                'type': 'divider'
            },
            {
                'type': 'header',
                'text': 'Дополнительно'
            },
            {
                'type': 'input',
                'name': 'info',
                'label': 'Описание отпуска',
                'placeholder': 'Куда собираетесь и что будете делать',
                'multiline': True,
                'hint': 'Возможно вам подскаджут, какие места лучше посетить'
            },
            {
                'type': 'checkbox',
                'name': 'newsletters',
                'label': 'Рассылки',
                'options': [
                    {
                        'text': 'Получать уведомления о новых задачах в команде',
                        'value': 'new_tasks',
                        'description': 'Каждый день бот будет присылать список новых задач в вашей команде'
                    },
                    {
                        'text': 'Получать уведомления об обновлениях в проектах',
                        'value': 'project_updates',
                        'description': 'Два раза в неделю бот будет присылать обновления по проектам'
                    }
                ]
            },
            {
                'type': 'select',
                'name': 'team',
                'label': 'Выберите команду',
                'options': [
                    {
                        'text': 'Все команды',
                        'value': 'all'
                    },
                    {
                        'text': 'Web',
                        'value': 'web',
                        'selected': True
                    },
                    {
                        'text': 'iOS',
                        'value': 'ios'
                    },
                    {
                        'text': 'Android',
                        'value': 'android'
                    },
                    {
                        'text': 'Back',
                        'value': 'back'
                    },
                    {
                        'text': 'Design',
                        'value': 'design'
                    },
                    {
                        'text': 'Success',
                        'value': 'success'
                    }
                ]
            },
            {
                'type': 'time',
                'name': 'newsletter_time',
                'label': 'Время рассылки',
                'initial_time': '11:00',
                'hint': 'Укажите, в какое время присылать выбранные рассылки'
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
    "trigger_id": "791a056b-006c-49dd-834b-c633fde52fe8",
    "type": "modal",
    "private_metadata": "{'timeoff_id':4378}",
    "callback_id": "timeoff_reguest_form",
    "view": {
        "title": "Уведомление об отпуске",
        "close_text": "Закрыть",
        "submit_text": "Отправить заявку",
        "blocks": [
            {
                "type": "plain_text",
                "text": "Заполните форму. После отправки формы в общий чат будет отправлено текстовое уведомление, а ваш отпуск будет сохранен в базе."
            },
            {
                "type": "markdown",
                "text": "Информацию о доступных вам днях отпуска вы можете прочитать по [ссылке](https://www.website.com/timeoff)"
            },
            {
                "type": "header",
                "text": "Основная информация"
            },
            {
                "type": "date",
                "name": "date_start",
                "label": "Дата начала отпуска",
                "initial_date": "2025-07-01",
                "required": true
            },
            {
                "type": "date",
                "name": "date_end",
                "label": "Дата окончания отпуска",
                "initial_date": "2025-07-28",
                "required": true
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
            },
            {
                "type": "radio",
                "name": "accessibility",
                "label": "Доступность",
                "options": [
                    {
                        "text": "Ничего",
                        "value": "nothing",
                        "checked": true
                    },
                    {
                        "text": "Только телефон",
                        "value": "phone_only"
                    },
                    {
                        "text": "Телефон и ноутбук",
                        "value": "phone_notebook"
                    }
                ],
                "required": true,
                "hint": "Если вы не планируете выходить на связь, то выберите вариант Ничего"
            },
            {
                "type": "divider"
            },
            {
                "type": "header",
                "text": "Дополнительно"
            },
            {
                "type": "input",
                "name": "info",
                "label": "Описание отпуска",
                "placeholder": "Куда собираетесь и что будете делать",
                "multiline": true,
                "hint": "Возможно вам подскаджут, какие места лучше посетить"
            },
            {
                "type": "checkbox",
                "name": "newsletters",
                "label": "Рассылки",
                "options": [
                    {
                        "text": "Получать уведомления о новых задачах в команде",
                        "value": "new_tasks",
                        "description": "Каждый день бот будет присылать список новых задач в вашей команде"
                    },
                    {
                        "text": "Получать уведомления об обновлениях в проектах",
                        "value": "project_updates",
                        "description": "Два раза в неделю бот будет присылать обновления по проектам"
                    }
                ]
            },
            {
                "type": "select",
                "name": "team",
                "label": "Выберите команду",
                "options": [
                    {
                        "text": "Все команды",
                        "value": "all"
                    },
                    {
                        "text": "Web",
                        "value": "web",
                        "selected": true
                    },
                    {
                        "text": "iOS",
                        "value": "ios"
                    },
                    {
                        "text": "Android",
                        "value": "android"
                    },
                    {
                        "text": "Back",
                        "value": "back"
                    },
                    {
                        "text": "Design",
                        "value": "design"
                    },
                    {
                        "text": "Success",
                        "value": "success"
                    }
                ]
            },
            {
                "type": "time",
                "name": "newsletter_time",
                "label": "Время рассылки",
                "initial_time": "11:00",
                "hint": "Укажите, в какое время присылать выбранные рассылки"
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
  'trigger_id' => '791a056b-006c-49dd-834b-c633fde52fe8',
  'type' => 'modal',
  'private_metadata' => '{'timeoff_id':4378}',
  'callback_id' => 'timeoff_reguest_form',
  'view' => {
    'title' => 'Уведомление об отпуске',
    'close_text' => 'Закрыть',
    'submit_text' => 'Отправить заявку',
    'blocks' => [
      {
        'type' => 'plain_text',
        'text' => 'Заполните форму. После отправки формы в общий чат будет отправлено текстовое уведомление, а ваш отпуск будет сохранен в базе.'
      },
      {
        'type' => 'markdown',
        'text' => 'Информацию о доступных вам днях отпуска вы можете прочитать по [ссылке](https://www.website.com/timeoff)'
      },
      {
        'type' => 'header',
        'text' => 'Основная информация'
      },
      {
        'type' => 'date',
        'name' => 'date_start',
        'label' => 'Дата начала отпуска',
        'initial_date' => '2025-07-01',
        'required' => true
      },
      {
        'type' => 'date',
        'name' => 'date_end',
        'label' => 'Дата окончания отпуска',
        'initial_date' => '2025-07-28',
        'required' => true
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
      },
      {
        'type' => 'radio',
        'name' => 'accessibility',
        'label' => 'Доступность',
        'options' => [
          {
            'text' => 'Ничего',
            'value' => 'nothing',
            'checked' => true
          },
          {
            'text' => 'Только телефон',
            'value' => 'phone_only'
          },
          {
            'text' => 'Телефон и ноутбук',
            'value' => 'phone_notebook'
          }
        ],
        'required' => true,
        'hint' => 'Если вы не планируете выходить на связь, то выберите вариант Ничего'
      },
      {
        'type' => 'divider'
      },
      {
        'type' => 'header',
        'text' => 'Дополнительно'
      },
      {
        'type' => 'input',
        'name' => 'info',
        'label' => 'Описание отпуска',
        'placeholder' => 'Куда собираетесь и что будете делать',
        'multiline' => true,
        'hint' => 'Возможно вам подскаджут, какие места лучше посетить'
      },
      {
        'type' => 'checkbox',
        'name' => 'newsletters',
        'label' => 'Рассылки',
        'options' => [
          {
            'text' => 'Получать уведомления о новых задачах в команде',
            'value' => 'new_tasks',
            'description' => 'Каждый день бот будет присылать список новых задач в вашей команде'
          },
          {
            'text' => 'Получать уведомления об обновлениях в проектах',
            'value' => 'project_updates',
            'description' => 'Два раза в неделю бот будет присылать обновления по проектам'
          }
        ]
      },
      {
        'type' => 'select',
        'name' => 'team',
        'label' => 'Выберите команду',
        'options' => [
          {
            'text' => 'Все команды',
            'value' => 'all'
          },
          {
            'text' => 'Web',
            'value' => 'web',
            'selected' => true
          },
          {
            'text' => 'iOS',
            'value' => 'ios'
          },
          {
            'text' => 'Android',
            'value' => 'android'
          },
          {
            'text' => 'Back',
            'value' => 'back'
          },
          {
            'text' => 'Design',
            'value' => 'design'
          },
          {
            'text' => 'Success',
            'value' => 'success'
          }
        ]
      },
      {
        'type' => 'time',
        'name' => 'newsletter_time',
        'label' => 'Время рассылки',
        'initial_time' => '11:00',
        'hint' => 'Укажите, в какое время присылать выбранные рассылки'
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
    'trigger_id' => '791a056b-006c-49dd-834b-c633fde52fe8',
    'type' => 'modal',
    'private_metadata' => '{'timeoff_id':4378}',
    'callback_id' => 'timeoff_reguest_form',
    'view' => [
        'title' => 'Уведомление об отпуске',
        'close_text' => 'Закрыть',
        'submit_text' => 'Отправить заявку',
        'blocks' => [
            [
                'type' => 'plain_text',
                'text' => 'Заполните форму. После отправки формы в общий чат будет отправлено текстовое уведомление, а ваш отпуск будет сохранен в базе.'
            ],
            [
                'type' => 'markdown',
                'text' => 'Информацию о доступных вам днях отпуска вы можете прочитать по [ссылке](https://www.website.com/timeoff)'
            ],
            [
                'type' => 'header',
                'text' => 'Основная информация'
            ],
            [
                'type' => 'date',
                'name' => 'date_start',
                'label' => 'Дата начала отпуска',
                'initial_date' => '2025-07-01',
                'required' => true
            ],
            [
                'type' => 'date',
                'name' => 'date_end',
                'label' => 'Дата окончания отпуска',
                'initial_date' => '2025-07-28',
                'required' => true
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
            ],
            [
                'type' => 'radio',
                'name' => 'accessibility',
                'label' => 'Доступность',
                'options' => [
                    [
                        'text' => 'Ничего',
                        'value' => 'nothing',
                        'checked' => true
                    ],
                    [
                        'text' => 'Только телефон',
                        'value' => 'phone_only'
                    ],
                    [
                        'text' => 'Телефон и ноутбук',
                        'value' => 'phone_notebook'
                    ]
                ],
                'required' => true,
                'hint' => 'Если вы не планируете выходить на связь, то выберите вариант Ничего'
            ],
            [
                'type' => 'divider'
            ],
            [
                'type' => 'header',
                'text' => 'Дополнительно'
            ],
            [
                'type' => 'input',
                'name' => 'info',
                'label' => 'Описание отпуска',
                'placeholder' => 'Куда собираетесь и что будете делать',
                'multiline' => true,
                'hint' => 'Возможно вам подскаджут, какие места лучше посетить'
            ],
            [
                'type' => 'checkbox',
                'name' => 'newsletters',
                'label' => 'Рассылки',
                'options' => [
                    [
                        'text' => 'Получать уведомления о новых задачах в команде',
                        'value' => 'new_tasks',
                        'description' => 'Каждый день бот будет присылать список новых задач в вашей команде'
                    ],
                    [
                        'text' => 'Получать уведомления об обновлениях в проектах',
                        'value' => 'project_updates',
                        'description' => 'Два раза в неделю бот будет присылать обновления по проектам'
                    ]
                ]
            ],
            [
                'type' => 'select',
                'name' => 'team',
                'label' => 'Выберите команду',
                'options' => [
                    [
                        'text' => 'Все команды',
                        'value' => 'all'
                    ],
                    [
                        'text' => 'Web',
                        'value' => 'web',
                        'selected' => true
                    ],
                    [
                        'text' => 'iOS',
                        'value' => 'ios'
                    ],
                    [
                        'text' => 'Android',
                        'value' => 'android'
                    ],
                    [
                        'text' => 'Back',
                        'value' => 'back'
                    ],
                    [
                        'text' => 'Design',
                        'value' => 'design'
                    ],
                    [
                        'text' => 'Success',
                        'value' => 'success'
                    ]
                ]
            ],
            [
                'type' => 'time',
                'name' => 'newsletter_time',
                'label' => 'Время рассылки',
                'initial_time' => '11:00',
                'hint' => 'Укажите, в какое время присылать выбранные рассылки'
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

**Схема ответа:**

### 400: The server could not understand the request due to invalid syntax.

**Схема ответа при ошибке:**

- `errors` (array[object], **обязательный**): Массив ошибок
  - `key` (string, **обязательный**): Ключ поля с ошибкой
  - `value` (string, **обязательный**): Значение поля, которое вызвало ошибку
  - `message` (string, **обязательный**): Сообщение об ошибке
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

### 401: Access is unauthorized.

**Схема ответа при ошибке:**

- `error` (string, **обязательный**): Код ошибки
- `error_description` (string, **обязательный**): Описание ошибки

### 403: Access is forbidden.

**Схема ответа при ошибке:**

- `error` (string, **обязательный**): Код ошибки
- `error_description` (string, **обязательный**): Описание ошибки

### 410: Client error

**Схема ответа при ошибке:**

- `errors` (array[object], **обязательный**): Массив ошибок
  - `key` (string, **обязательный**): Ключ поля с ошибкой
  - `value` (string, **обязательный**): Значение поля, которое вызвало ошибку
  - `message` (string, **обязательный**): Сообщение об ошибке
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

### 422: Client error

**Схема ответа при ошибке:**

- `errors` (array[object], **обязательный**): Массив ошибок
  - `key` (string, **обязательный**): Ключ поля с ошибкой
  - `value` (string, **обязательный**): Значение поля, которое вызвало ошибку
  - `message` (string, **обязательный**): Сообщение об ошибке
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

