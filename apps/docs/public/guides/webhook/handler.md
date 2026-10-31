> Расположение: Исходящие вебхуки
> Краткое содержание: Безопасность исходящих вебхуков Пачки: подпись HMAC-SHA256 и её сравнение за постоянное время, проверка timestamp, IP-адрес отправителя, сроки ответа на события, кнопки и формы, примеры обработчика на TypeScript и Python, идемпотентная обработка и доставка
> Это Markdown-версия конкретной страницы. Для контекста за её пределами (правила API, полный перечень методов, авторизация) ОБЯЗАТЕЛЬНО открой [llms.txt](https://dev.pachca.com/llms.txt) перед ответом — это сэкономит токены и предотвратит неполный ответ.


# Безопасность и обработчик

## Безопасность

Каждый исходящий вебхук подписан: Пачка вычисляет подпись `HMAC` по алгоритму `SHA256` из тела запроса и передаёт её в заголовке `Pachca-Signature`. В теле вебхука также есть поле `webhook_timestamp` — метка времени отправки в формате UNIX.

```http title="Пример исходящего вебхука (новое сообщение)"
POST https://yourweb.site/read HTTP/1.1
host: yourweb.site
content-Type: application/json
pachca-signature: a805d3470c263f4628cafc4ed66235d8fe2229891d1fcf4e400331adff5d8e5a
user-agent: Faraday v2.12.2
content-length: 445

{
    "event": "new",
    "type": "message",
    "webhook_timestamp": 1744618734,
    "chat_id": 918264,
    "content": "Клиент просит поправить шапку, подробности в документе",
    "user_id": 134412,
    "id": 56431,
    "created_at": "2025-04-14T08:18:54.000Z",
    "changed_at": "2025-04-14T08:18:54.000Z",
    "parent_message_id": null,
    "entity_type": "discussion",
    "entity_id": 918264,
    "thread": null,
    "url": "https://app.pachca.com/chats/918264?message=56431"
}
```


  ### Шаг 1. Проверьте подпись

Вычислите подпись сами, используя секрет вебхука `Signing secret` с вкладки «Исходящий вебхук» в карточке бота. Через API он приходит в поле `webhook.secret_token` метода [Информация о боте](/api/bots/get). Считайте хеш от сырого (raw) тела запроса: после разбора JSON содержимое может измениться. Сравнивайте подписи функцией, которая работает за постоянное время, например `crypto.timingSafeEqual` в Node.js или `hmac.compare_digest` в Python: обычное сравнение строк по времени ответа подсказывает, сколько символов подписи совпало.

```javascript title="Вычисление и сравнение подписи"
// WEBHOOK_SECRET — значение поля Signing secret на вкладке «Исходящий вебхук» в карточке бота
const expected = crypto.createHmac("sha256", WEBHOOK_SECRET).update(rawBody).digest()
const received = Buffer.from(request.headers["pachca-signature"] ?? "", "hex")

// timingSafeEqual требует буферы одной длины
if (received.length !== expected.length || !crypto.timingSafeEqual(received, expected)) {
    throw new Error("Invalid signature")
}
```


  ### Шаг 2. Проверьте время отправки

Сравните `webhook_timestamp` с временем получения запроса и отклоняйте запросы, которые старше одной минуты. Так перехваченный запрос не получится отправить повторно позже (replay attack). Пачка ставит метку заново при каждой попытке доставки, так что её собственные повторы в окно укладываются, и ширину окна достаточно выбрать по допустимому расхождению часов вашего сервера.


  ### Шаг 3. Проверьте IP-адрес отправителя

Кроме подписи стоит проверять, с какого адреса пришёл запрос. Пачка отправляет вебхуки с адресов `37.200.70.177`, `185.209.115.174` и `135.106.159.61` — разрешите все три. Актуальный список — в справке Пачки, в статье [Порты и адреса для корректной работы Пачки](https://pachca.com/help-center/administration/porty-i-adresa-dlya-korrektnoy-raboty-pachki).


## Сроки ответа

Пачка ждёт ответа вашего сервера ограниченное время, а некоторые действия бот должен успеть сделать сам. Все сроки собраны в одной таблице.

| Что | Срок | Подробности |
| --- | --- | --- |
| Ответ на событие | 5 секунд | Срок действует для всех событий, кроме нажатия кнопки и отправки формы. Что будет при ошибке или опоздании, описано в разделе [Доставка и повторы](#dostavka-i-povtory). |
| Ответ на нажатие кнопки | 30 секунд | Срок `trigger_id` от этого не меняется: форму по нажатию открывают в первые три секунды |
| Ответ на отправку формы | 3 секунды | Если сервер не ответил вовремя или к нему не удалось подключиться, сотрудник видит ошибку отправки и отправляет форму снова, значения полей при этом сохраняются. Какими кодами закрыть форму или показать ошибки под полями, описано в разделе [Закрытие и отображение ошибок](/guides/forms/handling#zakrytie-i-otobrazhenie-oshibok). |
| Открытие формы по `trigger_id` | 3 секунды | Отсчёт идёт от отправки вебхука о нажатии кнопки, а у бота без адреса вебхука — от записи нажатия в историю событий. Позже метод [Открытие представления](/api/views/open) отвечает `410` с кодом `trigger_expired`. |
| Ответ методом [Ответ на отправку формы](/api/views/submit-response) | 5 секунд | Метод нужен боту без адреса вебхука, отсчёт идёт от отправки формы. Позже метод отвечает `410` с кодом `submit_expired`, а сотрудник видит ошибку отправки. |

Бот без адреса вебхука забирает нажатия и формы из истории событий. Чтобы уложиться в эти сроки, получайте их [потоком событий](/guides/webhook/polling#sobytiya-v-realnom-vremeni): опрос истории с паузами в них легко не укладывается.

### Доставка и повторы

Повторно событие отправляется, только если к серверу не удалось подключиться: Пачка пробует ещё до трёх раз с паузами. Если сервер ответил ошибкой или не уложился в срок, повтора не будет, какой бы код он ни вернул. Отправку формы Пачка не повторяет и при ошибке подключения: сотрудник сразу видит ошибку отправки.

По перенаправлениям Пачка не переходит: ответ `3xx` считается ответом сервера, поэтому в **Webhook URL** указывайте конечный адрес. Исключение — отправка формы, для неё Пачка проходит одно перенаправление.

- Отвечайте `200 OK` сразу, а тяжёлую обработку выносите в фоновую очередь
- Чтобы не терять события, пока сервер недоступен, включите историю событий — подробнее в разделе [Поллинг](/guides/webhook/polling#istoriya-pri-rabotayuschem-vebhuke)
- Перед запуском в работу пройдите чек-лист из раздела [Разработка и запуск обработчика](/guides/webhook/deploy)

## Реализация webhook handler

Полный пример обработки вебхуков на TypeScript (Express.js) и Python (Flask) с проверкой подписи, защитой от replay-атак и обработкой всех типов событий. Обработчики ниже только записывают события в лог. Как из обработчика ответить в чат, показано в разделе [Первый бот](/guides/bots/first-bot), а как по нажатию кнопки открыть форму и ответить в тред — в разделе [Интерактивный бот](/guides/bots/interactive). Типы тел событий для TypeScript есть в SDK: как их подключить, описано в разделе [Тело вебхука](/guides/sdk/typescript#telo-vebhuka).

### TypeScript (Express.js)

```typescript
import express from "express"
import crypto from "crypto"

const SIGNING_SECRET = "your_signing_secret" // Карточка бота → Исходящий вебхук → Signing secret
const app = express()

// Важно: используем express.raw для получения сырого тела запроса (для корректной проверки HMAC)
app.post("/webhook", express.raw({ type: "application/json" }), (req, res) => {
  // 1. Проверка подписи HMAC-SHA256 сравнением за постоянное время
  const expected = crypto.createHmac("sha256", SIGNING_SECRET).update(req.body).digest()
  const received = Buffer.from(String(req.headers["pachca-signature"] ?? ""), "hex")
  if (received.length !== expected.length || !crypto.timingSafeEqual(received, expected)) {
    return res.status(401).send("Invalid signature")
  }

  // 2. Защита от replay-атак (±60 секунд)
  const event = JSON.parse(req.body.toString())
  if (Math.abs(Date.now() / 1000 - event.webhook_timestamp) > 60) {
    return res.status(401).send("Expired event")
  }

  // 3. Обработка события по типу
  switch (event.type) {
    case "message":
      if (event.event === "new") {
        console.log(`Новое сообщение от ${event.user_id}: ${event.content}`)
      } else if (event.event === "update") {
        console.log(`Сообщение ${event.id} отредактировано`)
      } else if (event.event === "delete") {
        console.log(`Сообщение ${event.id} удалено`)
      }
      break
    case "reaction":
      console.log(`${event.event === "new" ? "Добавлена" : "Удалена"} реакция ${event.code}`)
      break
    case "button":
      console.log(`Нажата кнопка: ${event.data}`)
      // trigger_id действует 3 секунды — используйте его для открытия формы
      break
    case "view":
      if (event.event === "submit") {
        console.log(`Форма заполнена:`, event.data)
      }
      break
  }

  res.status(200).send("OK")
})
app.listen(3000)
```

### Python (Flask)

```python
import hmac, hashlib, json, time
from flask import Flask, request, abort

SIGNING_SECRET = "your_signing_secret"  # Карточка бота → Исходящий вебхук → Signing secret
app = Flask(__name__)

@app.route("/webhook", methods=["POST"])
def webhook():
    raw_body = request.get_data()

    # 1. Проверка подписи HMAC-SHA256 сравнением за постоянное время
    expected = hmac.new(SIGNING_SECRET.encode(), raw_body, hashlib.sha256).hexdigest()
    received = request.headers.get("Pachca-Signature", "")
    if not hmac.compare_digest(expected.encode(), received.encode()):
        abort(401)

    # 2. Защита от replay-атак (±60 секунд)
    event = json.loads(raw_body)
    if abs(time.time() - event["webhook_timestamp"]) > 60:
        abort(401)

    # 3. Обработка события
    if event["type"] == "message" and event["event"] == "new":
        print(f"Новое сообщение от {event['user_id']}: {event['content']}")
    elif event["type"] == "button":
        print(f"Нажата кнопка: {event['data']}")
    elif event["type"] == "view" and event["event"] == "submit":
        print(f"Форма заполнена: {event['data']}")

    return "OK", 200
```

### Идемпотентная обработка

Одно и то же событие изредка может прийти дважды, поэтому обработчик должен быть идемпотентным. Ключ события собирайте по его типу: у событий об участниках, формах и видеозвонках нет ни `id`, ни `message_id`, а правки одного сообщения, реакции на него и нажатия его кнопок приходят с одним и тем же `id` или `message_id`. Поле `webhook_timestamp` в ключ не включайте: оно меняется при каждой попытке доставки.

Событие `update` приходит и без правки сообщения, причины перечислены в разделе [Сообщения](/guides/webhook/events#soobscheniya). Ключ ниже отсекает повторы такого события, но не первое из них. Если вы обрабатываете именно правки, сравнивайте `changed_at` с последним известным значением: у неотредактированного сообщения он совпадает с `created_at`.

```typescript
// Дедупликация по полям, которые отличают одно событие от другого
// В рабочем обработчике храните ключи в базе или Redis: Set теряется при перезапуске
const processed = new Set<string>()

function getEventKey(e: any): string {
  const base = `${e.type}:${e.event}`
  switch (e.type) {
    case "message":
      if (e.event === "link_shared") return `${base}:${e.message_id}:${e.links.map((l: any) => l.url).join(",")}`
      if (e.event === "update") return `${base}:${e.id}:${e.changed_at}`
      return `${base}:${e.id}`
    case "reaction":
      return `${base}:${e.message_id}:${e.user_id}:${e.code}:${e.created_at}`
    case "button":
      return `${base}:${e.trigger_id}` // новый при каждом нажатии
    case "view":
      return `${base}:${e.submit_id}` // новый при каждой попытке отправки формы
    case "chat_member":
      return `${base}:${e.chat_id}:${e.thread_id}:${e.user_ids.join(",")}:${e.created_at}`
    case "company_member":
      return `${base}:${e.user_ids.join(",")}:${e.created_at}`
    case "video_call":
      return `${base}:${e.video_room_id}:${e.recording_id ?? ""}`
    default:
      return `${base}:${e.id ?? e.message_id}`
  }
}

app.post("/webhook", express.raw({ type: "application/json" }), (req, res) => {
  // ... проверка подписи ...
  const event = JSON.parse(req.body.toString())
  const key = getEventKey(event)
  if (processed.has(key)) {
    return res.status(200).send("Already processed")
  }
  processed.add(key)
  processEvent(event) // Ваша логика обработки
  res.status(200).send("OK")
})
```


## Связанные разделы

- [Настройка и типы событий](/guides/webhook/events)
- [Поллинг](/guides/webhook/polling)
- [Формы: Обработка форм](/guides/forms/handling)
