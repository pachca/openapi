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

- `type: string` (required) — Способ открытия представления
  Значения: `modal` — Модальное окно
- `trigger_id: string` (required) — Уникальный идентификатор события (полученный, например, в исходящем вебхуке о нажатии кнопки)
- `private_metadata: string` (max length: 3000) — Необязательная строка, которая будет отправлена в ваше приложение при отправке пользователем заполненной формы. Используйте это поле, например, для передачи в формате `JSON` какой то дополнительной информации вместе с заполненной пользователем формой.
- `callback_id: string` (max length: 255) — Необязательный идентификатор для распознавания этого представления, который будет отправлен в ваше приложение при отправке пользователем заполненной формы. Используйте это поле, например, для понимания, какую форму должен был заполнить пользователь.
- `view: object` (required) — Собранный объект представления
  - `title: string` (required, max length: 24) — Заголовок представления
  - `close_text: string` (default: Отменить, max length: 24) — Текст кнопки закрытия представления
  - `submit_text: string` (default: Отправить, max length: 24) — Текст кнопки отправки формы
  - `blocks: array (union)` (required, max items: 100) — Массив блоков представления
    **Возможные типы элементов:**

    - **ViewBlockHeader**: Блок header — заголовок
      - `type: string` (required) — Тип блока
        Значения: `header` — Для заголовков всегда header
      - `text: string` (required, max length: 150) — Текст заголовка
    - **ViewBlockPlainText**: Блок plain_text — обычный текст
      - `type: string` (required) — Тип блока
        Значения: `plain_text` — Для обычного текста всегда plain_text
      - `text: string` (required, max length: 12000) — Текст
    - **ViewBlockMarkdown**: Блок markdown — форматированный текст
      - `type: string` (required) — Тип блока
        Значения: `markdown` — Для форматированного текста всегда markdown
      - `text: string` (required, max length: 12000) — Текст
    - **ViewBlockDivider**: Блок divider — разделитель
      - `type: string` (required) — Тип блока
        Значения: `divider` — Для разделителя всегда divider
    - **ViewBlockInput**: Блок input — текстовое поле ввода
      - `type: string` (required) — Тип блока
        Значения: `input` — Для текстового поля всегда input
      - `name: string` (required, max length: 255) — Название, которое будет передано в ваше приложение как ключ указанного пользователем значения
      - `label: string` (required, max length: 150) — Подпись к полю
      - `placeholder: string` (max length: 150) — Подсказка внутри поля ввода, пока оно пустое
      - `multiline: boolean` — Многострочное поле
      - `initial_value: string` (max length: 3000) — Начальное значение в поле
      - `min_length: integer, int32` (min: 0, max: 3000) — Минимальная длина текста, который должен написать пользователь. Если пользователь напишет меньше, он получит ошибку.
      - `max_length: integer, int32` (min: 1, max: 3000) — Максимальная длина текста, который должен написать пользователь. Если пользователь напишет больше, он получит ошибку.
      - `required: boolean` — Обязательность
      - `hint: string` (max length: 2000) — Подсказка, которая отображается под полем серым цветом
    - **ViewBlockSelect**: Блок select — выпадающий список
      - `type: string` (required) — Тип блока
        Значения: `select` — Для выпадающего списка всегда select
      - `name: string` (required, max length: 255) — Название, которое будет передано в ваше приложение как ключ указанного пользователем выбора
      - `label: string` (required, max length: 150) — Подпись к выпадающему списку
      - `options: array of object` (max items: 100) — Массив доступных пунктов в выпадающем списке
        - `text: string` (required, max length: 75) — Отображаемый текст
        - `value: string` (required, max length: 150) — Уникальное строковое значение, которое будет передано в ваше приложение при выборе этого пункта
        - `description: string` (max length: 75) — Пояснение, которое будет указано серым цветом в этом пункте под отображаемым текстом
        - `selected: boolean` — Изначально выбранный пункт. Только один пункт может быть выбран.
      - `required: boolean` — Обязательность
      - `hint: string` (max length: 2000) — Подсказка, которая отображается под выпадающим списком серым цветом
    - **ViewBlockRadio**: Блок radio — радиокнопки
      - `type: string` (required) — Тип блока
        Значения: `radio` — Для радиокнопок всегда radio
      - `name: string` (required, max length: 255) — Название, которое будет передано в ваше приложение как ключ указанного пользователем выбора
      - `label: string` (required, max length: 150) — Подпись к группе радиокнопок
      - `options: array of object` (max items: 10) — Массив радиокнопок
        - `text: string` (required, max length: 75) — Отображаемый текст
        - `value: string` (required, max length: 150) — Уникальное строковое значение, которое будет передано в ваше приложение при выборе этого пункта
        - `description: string` (max length: 75) — Пояснение, которое будет указано серым цветом в этом пункте под отображаемым текстом
        - `selected: boolean` — Изначально выбранный пункт. Только один пункт может быть выбран.
      - `required: boolean` — Обязательность
      - `hint: string` (max length: 2000) — Подсказка, которая отображается под группой радиокнопок серым цветом
    - **ViewBlockCheckbox**: Блок checkbox — чекбоксы
      - `type: string` (required) — Тип блока
        Значения: `checkbox` — Для чекбоксов всегда checkbox
      - `name: string` (required, max length: 255) — Название, которое будет передано в ваше приложение как ключ указанного пользователем выбора
      - `label: string` (required, max length: 150) — Подпись к группе чекбоксов
      - `options: array of object` (max items: 10) — Массив чекбоксов
        - `text: string` (required, max length: 75) — Отображаемый текст
        - `value: string` (required, max length: 150) — Уникальное строковое значение, которое будет передано в ваше приложение при выборе этого пункта
        - `description: string` (max length: 75) — Пояснение, которое будет указано серым цветом в этом пункте под отображаемым текстом
        - `checked: boolean` — Изначально выбранный пункт
      - `required: boolean` — Обязательность
      - `hint: string` (max length: 2000) — Подсказка, которая отображается под группой чекбоксов серым цветом
    - **ViewBlockDate**: Блок date — выбор даты
      - `type: string` (required) — Тип блока
        Значения: `date` — Для выбора даты всегда date
      - `name: string` (required, max length: 255) — Название, которое будет передано в ваше приложение как ключ указанного пользователем значения
      - `label: string` (required, max length: 150) — Подпись к полю
      - `initial_date: date` — Начальное значение в поле в формате YYYY-MM-DD
      - `required: boolean` — Обязательность
      - `hint: string` (max length: 2000) — Подсказка, которая отображается под полем серым цветом
    - **ViewBlockTime**: Блок time — выбор времени
      - `type: string` (required) — Тип блока
        Значения: `time` — Для выбора времени всегда time
      - `name: string` (required, max length: 255) — Название, которое будет передано в ваше приложение как ключ указанного пользователем значения
      - `label: string` (required, max length: 150) — Подпись к полю
      - `initial_time: string, time` — Начальное значение в поле в формате HH:mm
      - `required: boolean` — Обязательность
      - `hint: string` (max length: 2000) — Подсказка, которая отображается под полем серым цветом
    - **ViewBlockFileInput**: Блок file_input — загрузка файлов
      - `type: string` (required) — Тип блока
        Значения: `file_input` — Для загрузки файлов всегда file_input
      - `name: string` (required, max length: 255) — Название, которое будет передано в ваше приложение как ключ указанного пользователем значения
      - `label: string` (required, max length: 150) — Подпись к полю
      - `filetypes: array of string` — Массив допустимых расширений файлов, указанные в виде строк (например, ["png","jpg","gif"]). Если это поле не указано, все расширения файлов будут приняты.
      - `max_files: integer, int32` (default: 10, min: 1, max: 10) — Максимальное количество файлов, которое может загрузить пользователь в это поле.
      - `required: boolean` — Обязательность
      - `hint: string` (max length: 2000) — Подсказка, которая отображается под полем серым цветом

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

## Пример запроса

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

## Ответы

### 201: The request has succeeded and a new resource has been created as a result.

### 400: The server could not understand the request due to invalid syntax.

**Схема ответа при ошибке:**

- `errors: array of object` (required) — Массив ошибок
  - `key: string` (required) — Ключ поля с ошибкой
  - `value: string` (required) — Значение поля, которое вызвало ошибку
  - `message: string` (required) — Сообщение об ошибке
  - `code: string` (required) — Код ошибки
    Значения: `blank` — Обязательное поле (не может быть пустым), `too_long` — Слишком длинное значение (пояснения вы получите в поле message), `invalid` — Поле не соответствует правилам (пояснения вы получите в поле message), `inclusion` — Поле имеет непредусмотренное значение, `exclusion` — Поле имеет недопустимое значение, `taken` — Название для этого поля уже существует, `wrong_emoji` — Emoji статуса не может содержать значения отличные от Emoji символа, `not_found` — Объект не найден, `already_exists` — Объект уже существует (пояснения вы получите в поле message), `personal_chat` — Ошибка личного чата (пояснения вы получите в поле message), `displayed_error` — Отображаемая ошибка (пояснения вы получите в поле message), `not_authorized` — Действие запрещено, `invalid_date_range` — Выбран слишком большой диапазон дат, `invalid_webhook_url` — Некорректный URL вебхука, `rate_limit` — Достигнут лимит запросов, `licenses_limit` — Превышен лимит активных сотрудников (пояснения вы получите в поле message), `user_limit` — Превышен лимит количества реакций, которые может добавить пользователь (20 уникальных реакций), `unique_limit` — Превышен лимит количества уникальных реакций, которые можно добавить на сообщение (30 уникальных реакций), `general_limit` — Превышен лимит количества реакций, которые можно добавить на сообщение (1000 реакций), `unhandled` — Ошибка выполнения запроса (пояснения вы получите в поле message), `trigger_not_found` — Не удалось найти идентификатор события, `trigger_expired` — Время жизни идентификатора события истекло, `required` — Обязательный параметр не передан, `in` — Недопустимое значение (не входит в список допустимых), `not_applicable` — Значение неприменимо в данном контексте (пояснения вы получите в поле message), `self_update` — Нельзя изменить свои собственные данные, `owner_protected` — Нельзя изменить данные владельца, `already_assigned` — Значение уже назначено, `forbidden` — Недостаточно прав для выполнения действия (пояснения вы получите в поле message), `permission_denied` — Доступ запрещён (недостаточно прав), `access_denied` — Доступ запрещён, `wrong_params` — Некорректные параметры запроса (пояснения вы получите в поле message), `payment_required` — Требуется оплата, `min_length` — Значение слишком короткое (пояснения вы получите в поле message), `max_length` — Значение слишком длинное (пояснения вы получите в поле message), `use_of_system_words` — Использовано зарезервированное системное слово (here, all)
  - `payload: Record<string, object>` (required) — Дополнительные данные об ошибке. Содержимое зависит от кода ошибки: `{id: number}` — при ошибке кастомного свойства (идентификатор свойства), `{record: {type: string, id: number}, query: string}` — при ошибке авторизации. В большинстве случаев `null`
    **Структура значений Record:**
    - Тип значения: `any`

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

- `error: string` (required) — Код ошибки
- `error_description: string` (required) — Описание ошибки

**Пример ответа:**

```json
{
  "error": "invalid_token",
  "error_description": "Access token is missing"
}
```

### 402: Client error

**Схема ответа при ошибке:**

- `errors: array of object` (required) — Массив ошибок
  - `key: string` (required) — Ключ поля с ошибкой
  - `value: string` (required) — Значение поля, которое вызвало ошибку
  - `message: string` (required) — Сообщение об ошибке
  - `code: string` (required) — Код ошибки
    Значения: `blank` — Обязательное поле (не может быть пустым), `too_long` — Слишком длинное значение (пояснения вы получите в поле message), `invalid` — Поле не соответствует правилам (пояснения вы получите в поле message), `inclusion` — Поле имеет непредусмотренное значение, `exclusion` — Поле имеет недопустимое значение, `taken` — Название для этого поля уже существует, `wrong_emoji` — Emoji статуса не может содержать значения отличные от Emoji символа, `not_found` — Объект не найден, `already_exists` — Объект уже существует (пояснения вы получите в поле message), `personal_chat` — Ошибка личного чата (пояснения вы получите в поле message), `displayed_error` — Отображаемая ошибка (пояснения вы получите в поле message), `not_authorized` — Действие запрещено, `invalid_date_range` — Выбран слишком большой диапазон дат, `invalid_webhook_url` — Некорректный URL вебхука, `rate_limit` — Достигнут лимит запросов, `licenses_limit` — Превышен лимит активных сотрудников (пояснения вы получите в поле message), `user_limit` — Превышен лимит количества реакций, которые может добавить пользователь (20 уникальных реакций), `unique_limit` — Превышен лимит количества уникальных реакций, которые можно добавить на сообщение (30 уникальных реакций), `general_limit` — Превышен лимит количества реакций, которые можно добавить на сообщение (1000 реакций), `unhandled` — Ошибка выполнения запроса (пояснения вы получите в поле message), `trigger_not_found` — Не удалось найти идентификатор события, `trigger_expired` — Время жизни идентификатора события истекло, `required` — Обязательный параметр не передан, `in` — Недопустимое значение (не входит в список допустимых), `not_applicable` — Значение неприменимо в данном контексте (пояснения вы получите в поле message), `self_update` — Нельзя изменить свои собственные данные, `owner_protected` — Нельзя изменить данные владельца, `already_assigned` — Значение уже назначено, `forbidden` — Недостаточно прав для выполнения действия (пояснения вы получите в поле message), `permission_denied` — Доступ запрещён (недостаточно прав), `access_denied` — Доступ запрещён, `wrong_params` — Некорректные параметры запроса (пояснения вы получите в поле message), `payment_required` — Требуется оплата, `min_length` — Значение слишком короткое (пояснения вы получите в поле message), `max_length` — Значение слишком длинное (пояснения вы получите в поле message), `use_of_system_words` — Использовано зарезервированное системное слово (here, all)
  - `payload: Record<string, object>` (required) — Дополнительные данные об ошибке. Содержимое зависит от кода ошибки: `{id: number}` — при ошибке кастомного свойства (идентификатор свойства), `{record: {type: string, id: number}, query: string}` — при ошибке авторизации. В большинстве случаев `null`
    **Структура значений Record:**
    - Тип значения: `any`

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

**Схема ответа при ошибке:**

- `error: string` (required) — Код ошибки
- `error_description: string` (required) — Описание ошибки

**Пример ответа:**

```json
{
  "error": "invalid_token",
  "error_description": "Access token is missing"
}
```

### 410: Client error

**Схема ответа при ошибке:**

- `errors: array of object` (required) — Массив ошибок
  - `key: string` (required) — Ключ поля с ошибкой
  - `value: string` (required) — Значение поля, которое вызвало ошибку
  - `message: string` (required) — Сообщение об ошибке
  - `code: string` (required) — Код ошибки
    Значения: `blank` — Обязательное поле (не может быть пустым), `too_long` — Слишком длинное значение (пояснения вы получите в поле message), `invalid` — Поле не соответствует правилам (пояснения вы получите в поле message), `inclusion` — Поле имеет непредусмотренное значение, `exclusion` — Поле имеет недопустимое значение, `taken` — Название для этого поля уже существует, `wrong_emoji` — Emoji статуса не может содержать значения отличные от Emoji символа, `not_found` — Объект не найден, `already_exists` — Объект уже существует (пояснения вы получите в поле message), `personal_chat` — Ошибка личного чата (пояснения вы получите в поле message), `displayed_error` — Отображаемая ошибка (пояснения вы получите в поле message), `not_authorized` — Действие запрещено, `invalid_date_range` — Выбран слишком большой диапазон дат, `invalid_webhook_url` — Некорректный URL вебхука, `rate_limit` — Достигнут лимит запросов, `licenses_limit` — Превышен лимит активных сотрудников (пояснения вы получите в поле message), `user_limit` — Превышен лимит количества реакций, которые может добавить пользователь (20 уникальных реакций), `unique_limit` — Превышен лимит количества уникальных реакций, которые можно добавить на сообщение (30 уникальных реакций), `general_limit` — Превышен лимит количества реакций, которые можно добавить на сообщение (1000 реакций), `unhandled` — Ошибка выполнения запроса (пояснения вы получите в поле message), `trigger_not_found` — Не удалось найти идентификатор события, `trigger_expired` — Время жизни идентификатора события истекло, `required` — Обязательный параметр не передан, `in` — Недопустимое значение (не входит в список допустимых), `not_applicable` — Значение неприменимо в данном контексте (пояснения вы получите в поле message), `self_update` — Нельзя изменить свои собственные данные, `owner_protected` — Нельзя изменить данные владельца, `already_assigned` — Значение уже назначено, `forbidden` — Недостаточно прав для выполнения действия (пояснения вы получите в поле message), `permission_denied` — Доступ запрещён (недостаточно прав), `access_denied` — Доступ запрещён, `wrong_params` — Некорректные параметры запроса (пояснения вы получите в поле message), `payment_required` — Требуется оплата, `min_length` — Значение слишком короткое (пояснения вы получите в поле message), `max_length` — Значение слишком длинное (пояснения вы получите в поле message), `use_of_system_words` — Использовано зарезервированное системное слово (here, all)
  - `payload: Record<string, object>` (required) — Дополнительные данные об ошибке. Содержимое зависит от кода ошибки: `{id: number}` — при ошибке кастомного свойства (идентификатор свойства), `{record: {type: string, id: number}, query: string}` — при ошибке авторизации. В большинстве случаев `null`
    **Структура значений Record:**
    - Тип значения: `any`

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

- `errors: array of object` (required) — Массив ошибок
  - `key: string` (required) — Ключ поля с ошибкой
  - `value: string` (required) — Значение поля, которое вызвало ошибку
  - `message: string` (required) — Сообщение об ошибке
  - `code: string` (required) — Код ошибки
    Значения: `blank` — Обязательное поле (не может быть пустым), `too_long` — Слишком длинное значение (пояснения вы получите в поле message), `invalid` — Поле не соответствует правилам (пояснения вы получите в поле message), `inclusion` — Поле имеет непредусмотренное значение, `exclusion` — Поле имеет недопустимое значение, `taken` — Название для этого поля уже существует, `wrong_emoji` — Emoji статуса не может содержать значения отличные от Emoji символа, `not_found` — Объект не найден, `already_exists` — Объект уже существует (пояснения вы получите в поле message), `personal_chat` — Ошибка личного чата (пояснения вы получите в поле message), `displayed_error` — Отображаемая ошибка (пояснения вы получите в поле message), `not_authorized` — Действие запрещено, `invalid_date_range` — Выбран слишком большой диапазон дат, `invalid_webhook_url` — Некорректный URL вебхука, `rate_limit` — Достигнут лимит запросов, `licenses_limit` — Превышен лимит активных сотрудников (пояснения вы получите в поле message), `user_limit` — Превышен лимит количества реакций, которые может добавить пользователь (20 уникальных реакций), `unique_limit` — Превышен лимит количества уникальных реакций, которые можно добавить на сообщение (30 уникальных реакций), `general_limit` — Превышен лимит количества реакций, которые можно добавить на сообщение (1000 реакций), `unhandled` — Ошибка выполнения запроса (пояснения вы получите в поле message), `trigger_not_found` — Не удалось найти идентификатор события, `trigger_expired` — Время жизни идентификатора события истекло, `required` — Обязательный параметр не передан, `in` — Недопустимое значение (не входит в список допустимых), `not_applicable` — Значение неприменимо в данном контексте (пояснения вы получите в поле message), `self_update` — Нельзя изменить свои собственные данные, `owner_protected` — Нельзя изменить данные владельца, `already_assigned` — Значение уже назначено, `forbidden` — Недостаточно прав для выполнения действия (пояснения вы получите в поле message), `permission_denied` — Доступ запрещён (недостаточно прав), `access_denied` — Доступ запрещён, `wrong_params` — Некорректные параметры запроса (пояснения вы получите в поле message), `payment_required` — Требуется оплата, `min_length` — Значение слишком короткое (пояснения вы получите в поле message), `max_length` — Значение слишком длинное (пояснения вы получите в поле message), `use_of_system_words` — Использовано зарезервированное системное слово (here, all)
  - `payload: Record<string, object>` (required) — Дополнительные данные об ошибке. Содержимое зависит от кода ошибки: `{id: number}` — при ошибке кастомного свойства (идентификатор свойства), `{record: {type: string, id: number}, query: string}` — при ошибке авторизации. В большинстве случаев `null`
    **Структура значений Record:**
    - Тип значения: `any`

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

