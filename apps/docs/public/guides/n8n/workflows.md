
# Примеры workflow

Ниже — готовые сценарии, которые можно воспроизвести в n8n. Каждый пример использует узлы **Pachca** и **Pachca Trigger** из расширения.

## Приветствие нового сотрудника

Автоматическое приветственное сообщение при добавлении сотрудника в канал.

![Workflow приветствия нового сотрудника](/images/n8n/workflow-welcome.avif)

*Приветствие нового сотрудника*


**Как работает:**

1. **Pachca Trigger** — событие `New Message`
2. **IF** — проверка: сообщение системное (тип `user_joined`)
3. **Pachca** (Message > Create) — отправка приветствия в тот же чат

**Что можно добавить:** отправка личного сообщения с полезными ссылками, добавление сотрудника в рабочие каналы.

<Card title="welcome.json" icon="FileSearch" href="/workflows/n8n/welcome.json" download>
  Готовый workflow для импорта в n8n
</Card>

> После импорта замените Credentials на свои во всех узлах Pachca.


---

## Пересылка сообщений между каналами

Автоматическая пересылка сообщений из одного чата в другой.

![Workflow пересылки сообщений](/images/n8n/workflow-forward.avif)

*Пересылка сообщений между каналами*


**Как работает:**

1. **Pachca Trigger** — событие `New Message` (в исходном канале)
2. **IF** — фильтрация: пропускать сервисные сообщения, пересылать только пользовательские
3. **Pachca** (Message > Create) — отправка в целевой канал с указанием автора

**Когда полезно:** дублирование важных новостей в общие каналы, агрегация обсуждений.

<Card title="forward.json" icon="FileSearch" href="/workflows/n8n/forward.json" download>
  Готовый workflow для импорта в n8n
</Card>

> После импорта замените Credentials, `CHAT_ID_ИСТОЧНИКА` и `CHAT_ID_ЦЕЛЕВОГО` на свои значения.


---

## Напоминание о задачах

Ежедневная проверка просроченных задач с уведомлением в чат.

![Workflow напоминания о задачах](/images/n8n/workflow-reminder.avif)

*Напоминание о просроченных задачах*


**Как работает:**

1. **Schedule Trigger** — ежедневный запуск (например, в 10:00)
2. **Pachca** (Task > Get Many) — получение списка задач
3. **IF** — фильтр: только просроченные (дедлайн < сегодня)
4. **Pachca** (Message > Create) — уведомление в чат со списком задач

**Что можно добавить:** личные уведомления ответственным, группировка по проектам.

<Card title="reminder.json" icon="FileSearch" href="/workflows/n8n/reminder.json" download>
  Готовый workflow для импорта в n8n
</Card>

> После импорта замените Credentials и `CHAT_ID` во всех узлах Pachca.


---

## Согласование с кнопками

Запрос на согласование через сообщение с кнопками и обработка ответа.

![Workflow согласования с кнопками](/images/n8n/workflow-approval.avif)

*Согласование с Data-кнопками*


**Как работает:**

1. **Manual Trigger** или **Webhook** — инициация запроса
2. **Pachca** (Message > Create) — отправка сообщения с кнопками «Согласовать» / «Отклонить»
3. **Pachca Trigger** (в отдельном workflow) — событие `Button Pressed`
4. **Switch** — маршрутизация по `data` из нажатой кнопки
5. **Pachca** (Message > Update) — обновление исходного сообщения с результатом

**Пример кнопок:**

```json
[
  [
    { "text": "Согласовать", "data": "approve" },
    { "text": "Отклонить", "data": "reject" }
  ]
]
```

Подробнее о кнопках — в разделе [Продвинутые функции](/guides/n8n/advanced#knopki-v-soobshheniyax).

- [approval.json](/workflows/n8n/approval.json) — Отправка запроса с кнопками
- [approval-handler.json](/workflows/n8n/approval-handler.json) — Обработка нажатий кнопок


> После импорта замените Credentials и `CHAT_ID` во всех узлах Pachca.


---

## Мониторинг и алерты

Периодическая проверка состояния и отправка алерта при аномалиях.

![Workflow мониторинга с алертами](/images/n8n/workflow-monitoring.avif)

*Мониторинг с отправкой алертов в Пачку*


**Как работает:**

1. **Schedule Trigger** — проверка каждые 5 минут
2. **HTTP Request** — запрос к внешнему API или сервису
3. **IF** — проверка: статус не 200 или метрика выше порога
4. **Pachca** (Message > Create) — отправка алерта в канал мониторинга

**Что можно добавить:** проверка нескольких сервисов, графики через разворачивание ссылок, эскалация в личные сообщения.

<Card title="monitoring.json" icon="FileSearch" href="/workflows/n8n/monitoring.json" download>
  Готовый workflow для импорта в n8n
</Card>

> После импорта замените Credentials, `CHAT_ID_МОНИТОРИНГА` и URL сервиса во всех узлах Pachca.


---

## Заявка на отпуск

Полноценный сценарий с кнопками, формой и согласованием в треде — бот принимает заявку через модальную форму и отправляет на согласование руководителю.

![Workflow заявки на отпуск с кнопками, формой и согласованием](/images/n8n/workflow-vacation.avif)

*Заявка на отпуск: триггер → кнопка → форма → тред → согласование*


**Как работает (два workflow):**

**Workflow 1 — Приём заявки:**

1. **Pachca Trigger** — событие `New Message`, фильтр по команде `/отпуск`
2. **Pachca** (Message > Create) — отправка сообщения с Data-кнопкой «Создать заявку»
3. **Pachca Trigger** (событие `Button Pressed`) — пользователь нажимает кнопку
4. **Pachca** (Form > Create) — открытие модальной формы с полями «Дата начала», «Дата окончания», «Комментарий»

**Workflow 2 — Обработка и согласование:**

1. **Pachca Trigger** — событие `Form Submitted`
2. **Pachca** (Thread > Create) — создание треда с деталями заявки
3. **Pachca** (Message > Create) — отправка в тред кнопок «Согласовать» / «Отклонить»
4. **Pachca Trigger** (событие `Button Pressed`) — руководитель нажимает кнопку
5. **Pachca** (Message > Create) — уведомление сотрудника о результате

**Что задействовано:** триггер, кнопки, формы, треды, условная логика.

> Подробнее о кнопках — в разделе [Кнопки в сообщениях](/guides/n8n/advanced#knopki-v-soobshheniyax), о формах — в разделе [Формы](/guides/n8n/advanced#formy).


- [vacation.json](/workflows/n8n/vacation.json) — Приём команды и кнопка заявки
- [vacation-handler.json](/workflows/n8n/vacation-handler.json) — Форма, тред и согласование


> После импорта замените Credentials и `CHAT_ID_HR` во всех узлах Pachca.


---

## AI-ассистент

Бот, использующий AI для ответов на вопросы на основе истории чата.

![Настройка AI Agent с Pachca Tool](/images/n8n/ai-agent-tool.avif)

*AI Agent с инструментами Pachca*


**Как работает:**

1. **Pachca Trigger** — событие `New Message`
2. **AI Agent** — обработка запроса с LLM
3. **Pachca** (Search > Get Many Messages) — как Tool для поиска информации
4. **Pachca** (Message > Create) — как Tool для отправки ответа

> Для использования AI Agent необходимо настроить LLM-провайдер (OpenAI, Anthropic и др.) в n8n. Подробнее — в разделе [Продвинутые функции](/guides/n8n/advanced#ai-agent).

