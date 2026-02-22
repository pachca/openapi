# pachca-forms — Справочник эндпоинтов

## Открытие представления

**POST** `/views/open`

Открытие представления

Метод для открытия модального окна с представлением для пользователя.

Чтобы открыть модальное окно с представлением, ваше приложение должно иметь действительный, неистекший `trigger_id`.

**Тело запроса** (`application/json`):

- `type` (string (`modal`), **обязательный**): Способ открытия представления
- `trigger_id` (string, **обязательный**): Уникальный идентификатор события (полученный, например, в исходящем вебхуке о нажатии кнопки)
- `private_metadata` (string, опциональный): Необязательная строка, которая будет отправлена в ваше приложение при отправке пользователем заполненной формы. Используйте это поле, например, для передачи в формате `JSON` какой то дополнительной информации вместе с заполненной пользователем формой.
- `callback_id` (string, опциональный): Необязательный идентификатор для распознавания этого представления, который будет отправлен в ваше приложение при отправке пользователем заполненной формы. Используйте это поле, например, для понимания, какую форму должен был заполнить пользователь.
- `view` (object, **обязательный**): Собранный объект представления
  - `title` (string, **обязательный**): Заголовок представления
  - `close_text` (string, опциональный): Текст кнопки закрытия представления
  - `submit_text` (string, опциональный): Текст кнопки отправки формы
  - `blocks` (array, **обязательный**): Массив блоков представления

**Пример:**

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
            "selected": true
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

---
