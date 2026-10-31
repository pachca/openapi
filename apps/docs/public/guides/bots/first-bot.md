> Расположение: Боты
> Краткое содержание: Первый бот в Пачке по шагам: создать бота и токен с нужными правами, добавить бота в чат, отправить сообщение через API на cURL, TypeScript или Python, включить исходящий вебхук и ответить сотруднику в тред из обработчика с проверкой подписи, а на своей машине получать события потоком
> Это Markdown-версия конкретной страницы. Для контекста за её пределами (правила API, полный перечень методов, авторизация) ОБЯЗАТЕЛЬНО открой [llms.txt](https://dev.pachca.com/llms.txt) перед ответом — это сэкономит токены и предотвратит неполный ответ.


# Первый бот

Здесь собран путь от создания бота до первого разговора: ваш сервис пишет в чат, сотрудник отвечает, а бот получает ответ и пишет в тред. Примеры кода написаны на TypeScript и Python, подробности каждого шага — по ссылкам.

Как это работает:

1. Сервис отправляет сообщение методом [Новое сообщение](/api/messages/create) с токеном бота
2. Сотрудник отвечает, и Пачка присылает событие на адрес вашего обработчика: это [исходящий вебхук](/guides/webhook/overview)
3. Обработчик проверяет подпись запроса и отвечает в тред тем же методом

Для приёма событий нужен адрес, доступный из интернета. Пока обработчик работает на вашей машине, события получают через туннель или потоком, подробнее в разделе [Разработка на своей машине](#razrabotka-na-svoey-mashine).

## Подготовьте бота


  ### Шаг 1. Создайте бота

В веб-версии или десктопном приложении Пачки откройте **Интеграции** > **Боты** и нажмите **Создать бота**. Задайте название, а ник можно оставить пустым: он соберётся из названия. Кнопка есть у тех, кому разрешено создавать интеграции, подробнее в разделе [Кто может создавать токены](/api/authorization#kto-mozhet-sozdavat-tokeny). Другие способы и настройки — в разделе [Создание бота](/guides/bots/setup).


  ### Шаг 2. Выпустите токен

На вкладке **API** в карточке бота нажмите **Создать токен** и выберите права из строки «Бот отвечает на сообщения и команды» в разделе [Наборы прав под типовые задачи](/guides/permissions#nabory-prav-pod-tipovye-zadachi). Коду на этой странице из набора нужны права `messages:create`, `threads:create` и `profile:read`. Значение токена показывается один раз: скопируйте его до закрытия окна. Подробнее — в разделе [Токены бота](/guides/bots/tokens).


  ### Шаг 3. Добавьте бота в беседу

Создайте беседу для проверки и добавьте в неё бота в окне **Добавление участников** на вкладке **Боты**. События о сообщениях бот получает из чатов, где состоит, подробнее в разделе [Доступы к чатам и сообщениям](/guides/bots/access#besedy-i-kanaly).


  ### Шаг 4. Узнайте идентификатор беседы

Откройте беседу в веб-приложении: идентификатор — число в адресе после `/chats/`, например `12345` в `https://app.pachca.com/chats/12345`. Другие способы — в разделе [Где взять идентификаторы](/api/requests-responses#gde-vzyat-identifikatory).


## Отправьте сообщение

Метод [Новое сообщение](/api/messages/create) принимает идентификатор чата в `entity_id` и текст в `content`. Подставьте идентификатор своей беседы вместо `12345`, а токен бота передайте в переменной окружения `PACHCA_BOT_TOKEN`.

```bash title="cURL"
curl -X POST https://api.pachca.com/api/shared/v1/messages \
  -H "Authorization: Bearer $PACHCA_BOT_TOKEN" \
  -H "Content-Type: application/json" \
  -d '{
    "message": {
      "entity_type": "discussion",
      "entity_id": 12345,
      "content": "Привет! Ответьте в треде под этим сообщением, и я отвечу"
    }
  }'
```

```typescript title="send.ts"
const API = "https://api.pachca.com/api/shared/v1"

async function sendMessage(chatId: number, content: string) {
  const response = await fetch(`${API}/messages`, {
    method: "POST",
    headers: {
      Authorization: `Bearer ${process.env.PACHCA_BOT_TOKEN}`,
      "Content-Type": "application/json",
    },
    body: JSON.stringify({ message: { entity_type: "discussion", entity_id: chatId, content } }),
  })
  if (!response.ok) throw new Error(`${response.status}: ${await response.text()}`)
  return (await response.json()).data // объект сообщения
}

sendMessage(12345, "Привет! Ответьте в треде под этим сообщением, и я отвечу").then((message) => {
  console.log("id сообщения:", message.id)
})
```

```python title="send.py"
import os

import httpx

response = httpx.post(
    "https://api.pachca.com/api/shared/v1/messages",
    headers={"Authorization": f"Bearer {os.environ['PACHCA_BOT_TOKEN']}"},
    json={
        "message": {
            "entity_type": "discussion",
            "entity_id": 12345,
            "content": "Привет! Ответьте в треде под этим сообщением, и я отвечу",
        }
    },
)
response.raise_for_status()
message = response.json()["data"]  # объект сообщения
print("id сообщения:", message["id"])
```

В ответе придёт объект сообщения в поле `data`. Сохраните его `id`: по нему вы узнаете, что сотрудник ответил именно на это сообщение, подробнее в разделе [Ответы на сообщения сервиса](/guides/bots/conversations#otvety-na-soobscheniya-servisa). Если запрос вернул ошибку, код и причина разобраны в разделах [Ошибки авторизации](/api/authorization#oshibki-avtorizatsii) и [Ошибки](/api/errors).

## Включите исходящий вебхук


  ### Шаг 1. Укажите адрес обработчика

На вкладке **Исходящий вебхук** в карточке бота нажмите **Включить**, в поле **Webhook URL** укажите адрес обработчика, доступный из интернета, например `https://bot.example.com/webhook`, и подтвердите кнопкой **Включить**. Для разработки подойдёт адрес туннеля, подробнее в разделе [Разработка на своей машине](#razrabotka-na-svoey-mashine).


  ### Шаг 2. Выберите события

Отметьте **Новые сообщения** и выберите режим **Любые сообщения**: в режиме **Начинающиеся с команд** бот получает только сообщения, которые начинаются с его команд, а ответ сотрудника обычно без команды. Включите **Игнорировать свои сообщения**, чтобы бот не получал события о собственных ответах. Подробнее — в разделе [Сообщения](/guides/webhook/events#soobscheniya).


  ### Шаг 3. Скопируйте Signing secret

Секрет появится на вкладке после включения вебхука. Обработчик проверяет им подпись каждого запроса, передайте его в переменной окружения `PACHCA_SIGNING_SECRET`.


![Вкладка «Исходящий вебхук»: Webhook URL, Signing secret, включено «Игнорировать свои сообщения», событие «Новые сообщения» в режиме «Любые сообщения» и «Нажатие кнопок»](/images/outgoing-webhook-all-messages.webp)

*Вкладка «Исходящий вебхук» после включения: этой странице нужны «Новые сообщения», а «Нажатие кнопок» пригодится для кнопок и форм*


## Напишите обработчик

Обработчик принимает событие, проверяет подпись и время отправки и сразу отвечает `200`: Пачка ждёт ответа 5 секунд, все сроки — в разделе [Сроки ответа](/guides/webhook/handler#sroki-otveta). Почему подпись считают от сырого тела запроса и как проверить IP-адрес отправителя, описано в разделе [Безопасность](/guides/webhook/handler#bezopasnost).

После ответа обработчик пишет сотруднику туда, где тот написал:

- сообщение из беседы или канала — тредом под ним: метод [Новый тред](/api/threads/add) открывает тред или возвращает уже открытый, а [Новое сообщение](/api/messages/create) с `entity_type: "thread"` пишет в него
- сообщение из треда или личных сообщений — туда же, с теми же `entity_type` и `entity_id`

Подробнее — в разделе [Куда отвечать](/guides/bots/conversations#kuda-otvechat). Свои сообщения обработчик пропускает по `id` бота из метода [Свой профиль](/api/profile/get), так что бот не отвечает сам себе, даже если **Игнорировать свои сообщения** выключено.

Пример отвечает на каждое новое сообщение, поэтому проверяйте его в отдельной беседе. Когда отвечать в рабочих чатах, описано в разделе [Когда отвечать](/guides/bots/conversations#kogda-otvechat).

### TypeScript

Пример работает на Node.js 18 или новее и принимает события на порту `3000` по пути `/webhook`.

```typescript title="bot.ts"
import crypto from "node:crypto"
import express from "express"

const API = "https://api.pachca.com/api/shared/v1"
const TOKEN = process.env.PACHCA_BOT_TOKEN ?? "" // токен бота
const SIGNING_SECRET = process.env.PACHCA_SIGNING_SECRET ?? "" // Signing secret с вкладки «Исходящий вебхук»
if (!TOKEN) throw new Error("Задайте PACHCA_BOT_TOKEN")

// Запрос к API Пачки: возвращает поле data из ответа
async function api(method: string, path: string, body?: unknown) {
  const response = await fetch(`${API}${path}`, {
    method,
    headers: { Authorization: `Bearer ${TOKEN}`, "Content-Type": "application/json" },
    body: body === undefined ? undefined : JSON.stringify(body),
  })
  if (!response.ok) throw new Error(`${method} ${path}: ${response.status} ${await response.text()}`)
  return response.status === 204 ? null : (await response.json()).data
}

type PachcaEvent = {
  type: string
  event: string
  id: number
  entity_type: "discussion" | "thread" | "user"
  entity_id: number
  user_id: number
}

let botId: number | undefined // id бота, узнаём методом «Свой профиль» при первом событии

async function handleEvent(event: PachcaEvent) {
  if (event.type !== "message" || event.event !== "new") return
  botId ??= (await api("GET", "/profile")).id
  if (event.user_id === botId) return // своё сообщение

  // Из беседы или канала отвечаем тредом под сообщением, из треда и личных сообщений — туда же
  let target = { entity_type: event.entity_type, entity_id: event.entity_id }
  if (event.entity_type === "discussion") {
    const thread = await api("POST", `/messages/${event.id}/thread`) // если тред уже есть, вернётся он
    target = { entity_type: "thread", entity_id: thread.id }
  }
  await api("POST", "/messages", { message: { ...target, content: "Получил ваше сообщение, разбираюсь" } })
}

const app = express()

// express.raw: подпись считают от сырого тела запроса
app.post("/webhook", express.raw({ type: "application/json" }), (req, res) => {
  const expected = crypto.createHmac("sha256", SIGNING_SECRET).update(req.body).digest()
  const received = Buffer.from(String(req.headers["pachca-signature"] ?? ""), "hex")
  if (!SIGNING_SECRET || received.length !== expected.length || !crypto.timingSafeEqual(received, expected)) {
    return res.status(401).end() // секрет не задан или подпись не совпала: запрос не принимаем
  }

  const event = JSON.parse(req.body.toString())
  if (Math.abs(Date.now() / 1000 - event.webhook_timestamp) > 60) {
    return res.status(401).end() // запрос старше минуты: его могли перехватить и отправить повторно
  }

  res.status(200).end() // отвечаем сразу, а сообщение отправляем после ответа
  handleEvent(event).catch(console.error)
})

app.listen(3000)
```

```bash title="Запуск"
npm install express
export PACHCA_BOT_TOKEN="токен бота" PACHCA_SIGNING_SECRET="Signing secret"
npx tsx bot.ts
```

### Python

Пример принимает события на порту `3000` по пути `/webhook`. Сообщение он отправляет в фоне через `threading.Thread`, чтобы ответить Пачке сразу.

```python title="bot.py"
import hashlib
import hmac
import json
import os
import threading
import time

import httpx
from flask import Flask, request

API = "https://api.pachca.com/api/shared/v1"
HEADERS = {"Authorization": f"Bearer {os.environ['PACHCA_BOT_TOKEN']}"}  # токен бота
SIGNING_SECRET = os.environ.get("PACHCA_SIGNING_SECRET", "")  # Signing secret с вкладки «Исходящий вебхук»


def api(method, path, body=None):
    """Запрос к API Пачки: возвращает поле data из ответа."""
    response = httpx.request(method, API + path, headers=HEADERS, json=body)
    response.raise_for_status()
    return response.json()["data"] if response.content else None


bot_id = None  # id бота, узнаём методом «Свой профиль» при первом событии


def handle_event(event):
    global bot_id
    if event["type"] != "message" or event["event"] != "new":
        return
    if bot_id is None:
        bot_id = api("GET", "/profile")["id"]
    if event["user_id"] == bot_id:
        return  # своё сообщение

    # Из беседы или канала отвечаем тредом под сообщением, из треда и личных сообщений — туда же
    target = {"entity_type": event["entity_type"], "entity_id": event["entity_id"]}
    if event["entity_type"] == "discussion":
        thread = api("POST", f"/messages/{event['id']}/thread")  # если тред уже есть, вернётся он
        target = {"entity_type": "thread", "entity_id": thread["id"]}
    api("POST", "/messages", {"message": {**target, "content": "Получил ваше сообщение, разбираюсь"}})


app = Flask(__name__)


@app.post("/webhook")
def webhook():
    raw_body = request.get_data()  # подпись считают от сырого тела запроса
    expected = hmac.new(SIGNING_SECRET.encode(), raw_body, hashlib.sha256).hexdigest()
    received = request.headers.get("Pachca-Signature", "")
    if not SIGNING_SECRET or not hmac.compare_digest(expected.encode(), received.encode()):
        return "", 401  # секрет не задан или подпись не совпала: запрос не принимаем

    event = json.loads(raw_body)
    if abs(time.time() - event["webhook_timestamp"]) > 60:
        return "", 401  # запрос старше минуты: его могли перехватить и отправить повторно

    # Отвечаем сразу, а сообщение отправляем в фоне
    threading.Thread(target=handle_event, args=(event,)).start()
    return "", 200


if __name__ == "__main__":
    app.run(port=3000)
```

```bash title="Запуск"
pip install flask httpx
export PACHCA_BOT_TOKEN="токен бота" PACHCA_SIGNING_SECRET="Signing secret"
python bot.py
```

### Проверка

Запустите обработчик и ответьте в треде под сообщением, которое бот отправил в разделе [Отправьте сообщение](#otpravte-soobschenie), или напишите в беседе: бот ответит в тред. Если ответа нет:

- **Обработчик не получает запросов** — проверьте, что адрес в **Webhook URL** заканчивается на `/webhook`, бот состоит в беседе, отмечено **Новые сообщения** и выбран режим **Любые сообщения**
- **Обработчик отвечает `401`** — **Signing secret** не задан в переменной окружения или отличается от секрета на вкладке, или часы сервера расходятся с точным временем больше чем на минуту
- **Запрос к API отвечает `403` с кодом `insufficient_scope`** — токену не хватает права из раздела [Подготовьте бота](#podgotovte-bota), его добавляют в меню токена

## Разработка на своей машине

Пачка отправляет события на публичный адрес `http` или `https`, подробнее в разделе [Общие настройки](/guides/webhook/events#obschie-nastroyki). Пока обработчик работает на вашей машине, есть два способа:

- **Туннель** — ngrok, Cloudflare Tunnel или другой туннель выдаёт порту `3000` временный публичный адрес: укажите его с путём `/webhook` в **Webhook URL**, и обработчик из примера заработает без изменений
- **Поток событий** — бот сам подключается к Пачке и получает события по открытому соединению, а входящие запросы и проверка подписи ему не нужны

Как настроить оба способа и почему для разработки удобен отдельный бот, описано в разделе [Разработка и запуск обработчика](/guides/webhook/deploy).

Для потока включите на вкладке **Исходящий вебхук** настройку **Сохранять историю событий** и добавьте токену права `webhooks:events:read` и `webhooks:events:delete`. События и режим выберите, как в разделе [Включите исходящий вебхук](#vklyuchite-ishodyaschiy-vebhuk). Эти настройки появляются на вкладке после включения вебхука, а боту без адреса их задают через API, подробнее в разделах [Поллинг](/guides/webhook/polling) и [Через API](/guides/webhook/events#cherez-api). Если адрес указан, но Пачка не может к нему подключиться, событие придёт в поток ещё раз при каждой повторной попытке доставки, подробнее в разделе [История при работающем вебхуке](/guides/webhook/polling#istoriya-pri-rabotayuschem-vebhuke).

Код ниже получает ссылку методом [Поток событий](/api/bots/get-stream), подключается к ней и передаёт каждое событие той же функции обработчика. Ссылка открывается без токена, поэтому храните её как секрет. Переменная `PACHCA_SIGNING_SECRET` потоку не нужна.

В `bot.ts` замените строку `app.listen(3000)` этим кодом и установите пакет командой `npm install eventsource`:

```typescript title="bot.ts: поток вместо сервера"
import { EventSource } from "eventsource"

api("GET", "/webhooks/events/stream").then(({ url }) => {
  const stream = new EventSource(url)
  // Событие бота приходит сообщением без имени: запись истории с id, event_type, payload и created_at
  stream.addEventListener("message", (e) => {
    const record = JSON.parse(e.data)
    handleEvent(record.payload)
      .then(() => api("DELETE", `/webhooks/events/${record.id}`)) // обработанное событие убираем из истории
      .catch(console.error)
  })
})
```

В `bot.py` замените блок `if __name__ == "__main__":` этим кодом и установите пакет командой `pip install httpx-sse`:

```python title="bot.py: поток вместо сервера"
from httpx_sse import connect_sse


def listen():
    stream = api("GET", "/webhooks/events/stream")  # ссылка на поток и срок её действия
    with httpx.Client(timeout=None) as client, connect_sse(client, "GET", stream["url"]) as source:
        for sse in source.iter_sse():
            if sse.event != "message":
                continue  # служебные сообщения подключения
            record = sse.json()  # запись истории событий: id, event_type, payload, created_at
            handle_event(record["payload"])
            api("DELETE", f"/webhooks/events/{record['id']}")  # обработанное событие убираем из истории


if __name__ == "__main__":
    listen()
```

Этот код работает, пока действует ссылка, её срок приходит в поле `expires_at`. События, которые пришли до подключения, он не забирает. Как дочитывать историю и менять ссылку без потери событий, показано в разделе [Пример подключения](/guides/webhook/polling#primer-podklyucheniya).

## Что дальше

- **Ответ на сообщение сервиса** — как связать ответ сотрудника с заявкой или уведомлением, которое отправил бот, описано в разделе [Ответы на сообщения сервиса](/guides/bots/conversations#otvety-na-soobscheniya-servisa)
- **Упоминания и команды** — бот в рабочем чате отвечает, когда к нему обращаются, подробнее в разделах [Когда отвечать](/guides/bots/conversations#kogda-otvechat) и [Команды](/guides/bots/conversations#komandy)
- **Контекст разговора** — историю треда и сообщение, к которому он открыт, бот читает методами из раздела [Контекст разговора](/guides/bots/conversations#kontekst-razgovora)
- **Повторы событий** — одно событие изредка приходит дважды, ключ для отсева описан в разделе [Идемпотентная обработка](/guides/webhook/handler#idempotentnaya-obrabotka)
- **Кнопки и формы** — бот с командой, кнопками и формой целиком собран в разделе [Интерактивный бот](/guides/bots/interactive)
- **Запуск в работу** — что проверить перед тем, как указать адрес рабочего сервера, перечислено в разделе [Чек-лист перед запуском в работу](/guides/webhook/deploy#chek-list-pered-zapuskom-v-rabotu)
- **SDK** — типизированный клиент API и типы событий есть в [SDK](/guides/sdk/overview) для TypeScript, Python и других языков


## Связанные разделы

- [Общение с ботом](/guides/bots/conversations)
- [Исходящие вебхуки: Безопасность и обработчик](/guides/webhook/handler)
- [Исходящие вебхуки: Разработка и запуск обработчика](/guides/webhook/deploy)
- [Интерактивный бот](/guides/bots/interactive)
