> Это Markdown-версия конкретной страницы. Для контекста за её пределами (правила API, полный перечень методов, авторизация) ОБЯЗАТЕЛЬНО открой [llms.txt](https://dev.pachca.com/llms.txt) перед ответом — это сэкономит токены и предотвратит неполный ответ.


# Пагинация

API Пачки использует **cursor-based** пагинацию для всех методов, возвращающих списки. Это обеспечивает стабильную работу при добавлении и удалении записей.

## Две группы методов с пагинацией

В API существует две группы методов, **возвращающих разную структуру `meta`** — алгоритмы обхода и условия конца данных у них отличаются. Перед интеграцией убедитесь, что вы знаете, к какой группе относится используемый метод.

- [Списочные методы](#spisochnye-metody) — возвращают `meta.paginate` с четырьмя полями: `next_page`, `prev_page`, `has_next`, `has_prev`.
- [Методы поиска](#metody-poiska) — возвращают `meta` с полем `total` и `paginate.next_page` (только курсор «вперёд», без `prev_page`/`has_next`/`has_prev`). К этой группе по поведению также относится [Список сотрудников](GET /users) с заданным параметром `query` — `meta` возвращается в упрощённом формате.

## Параметры запроса

| Параметр | Тип | Описание |
|----------|-----|----------|
| `limit` | integer | Количество записей на странице. Допустимые значения зависят от метода: большинство списочных методов — 1–50, [Список прочитавших сообщение](GET /messages/{id}/read_member_ids) — до 300, [Поиск чатов](GET /search/chats) — до 100, [Поиск сотрудников](GET /search/users) и [Поиск сообщений](GET /search/messages) — до 200 |
| `cursor` | string | Курсор для получения страницы (значение `meta.paginate.next_page` или `meta.paginate.prev_page` из предыдущего ответа) |

## Списочные методы

Списочные методы возвращают объект `meta.paginate` с четырьмя полями:

#### PaginationMeta

- `paginate: object` (required) — Вспомогательная информация
  - `next_page: string` (required) — Курсор пагинации следующей страницы. Пример: `"eyJxZCO2MiwiZGlyIjomSNYjIn3"`
  - `prev_page: string` — Курсор пагинации предыдущей страницы. Используется для polling новых записей «сверху» списка.. Пример: `"eyJxZCO2MiwiZGlyIjoiYXNjIn0"`
  - `has_next: boolean` — Есть ли ещё данные на следующей странице. На последней странице — `false`.. Пример: `true`
  - `has_prev: boolean` — Есть ли ещё данные на предыдущей странице. На первом запросе без курсора — `false`.. Пример: `false`


```json title="Пример ответа списочного метода"
{
  "data": [{ "id": 1, "...": "..." }, { "id": 2, "...": "..." }],
  "meta": {
    "paginate": {
      "next_page": "eyJpZCI6MTAsIl9rZCI6Im4ifQ",
      "prev_page": "eyJpZCI6MSwgIl9rZCI6InAifQ",
      "has_next": true,
      "has_prev": false
    }
  }
}
```

| Поле | Тип | Описание |
|------|-----|----------|
| `next_page` | string | Курсор на следующую страницу (вперёд по сортировке). Используйте для обхода всех записей. |
| `prev_page` | string | Курсор на предыдущую страницу (назад по сортировке). Используйте для polling новых записей «сверху» списка. |
| `has_next` | boolean | Есть ли ещё данные на следующей странице. На последней странице — `false`. |
| `has_prev` | boolean | Есть ли ещё данные на предыдущей странице. На первом запросе без курсора — `false`. |

К этой группе относятся: [Список сотрудников](GET /users) (без `query`), [Список чатов](GET /chats), [Список участников чата](GET /chats/{id}/members), [Список сообщений чата](GET /messages), [Список реакций](GET /messages/{id}/reactions), [Список прочитавших сообщение](GET /messages/{id}/read_member_ids), [Список тегов сотрудников](GET /group_tags), [Список сотрудников тега](GET /group_tags/{id}/users), [Список напоминаний](GET /tasks), [Журнал аудита событий](GET /audit_events), [История событий](GET /webhooks/events).

> В списочных методах поля `next_page`, `prev_page`, `has_next`, `has_prev` **всегда присутствуют** в ответе — даже когда `data` пустой. Курсоры никогда не бывают `null`. Признак конца данных — `has_next: false` (вперёд) или `has_prev: false` (назад), а не пустой `data`. Количество записей в `data` может быть меньше `limit` и на промежуточных страницах — не полагайтесь на длину массива. Курсор — непрозрачный токен: не парсите, не конструируйте вручную и не сохраняйте между сессиями. Всегда явно указывайте `limit` — не полагайтесь на значение по умолчанию.


### Сценарии и состояния `meta.paginate`

Поведение полей `meta.paginate` для типичных сценариев пагинации (на примере [Списка чатов](GET /chats) с DESC-сортировкой):

| Сценарий | Запрос | `data` | `next_page` | `prev_page` | `has_next` | `has_prev` |
|----------|--------|--------|-------------|-------------|-----------|-----------|
| Первый запрос, есть данные | `cursor=null, limit=50` | 50 записей | курсор от `records.last` | курсор от `records.first` | `true` | `false` |
| Первый запрос, БД пуста | `cursor=null, limit=50` | 0 записей | пустой курсор (для polling) | пустой курсор (для polling) | `false` | `false` |
| Идём вперёд по страницам | `cursor=<next_page>` | 50 записей | новый forward-курсор | от `records.first` | `true` | `true` |
| Дошли до последней страницы | `cursor=<next_page>` | менее 50 записей | от `records.last` | от `records.first` | `false` | `true` |
| Polling старого хвоста (новых нет) | `cursor=<next_page последней страницы>` | 0 записей | тот же `next_page` (для следующего polling) | валидный backward-курсор | `false` | `true` |
| Polling новых через `prev_page` (новых нет) | `cursor=<prev_page>` | 0 записей | валидный forward-курсор | тот же `prev_page` (для следующего polling) | `true` | `false` |
| Polling новых через `prev_page` (пришло меньше `limit`) | `cursor=<prev_page>` | 3 записи | новый forward-курсор | от `records.first` | `false` | `false` |
| Polling новых через `prev_page` (пришло ≥ `limit`) | `cursor=<prev_page>` | 50 записей | новый forward-курсор | от `records.first` | `false` | `true` (продолжайте polling) |

Курсоры `next_page` и `prev_page` остаются валидными даже на пустом ответе — можно безопасно повторять запрос с тем же курсором, не теряя точку отсчёта.

## Методы поиска

Методы поиска используют отдельный формат `meta` — без `prev_page` и без флагов `has_next`/`has_prev`. Вместо них возвращается `total` — общее количество найденных результатов:

#### SearchPaginationMeta

- `total: integer, int32` (required) — Общее количество найденных результатов. Пример: `42`
- `paginate: object` (required) — Вспомогательная информация
  - `next_page: string` (required) — Курсор пагинации следующей страницы. Пример: `"eyJxZCO2MiwiZGlyIjomSNYjIn3"`


```json title="Пример ответа метода поиска"
{
  "data": [{ "id": 1, "...": "..." }, { "id": 2, "...": "..." }],
  "meta": {
    "total": 42,
    "paginate": {
      "next_page": "eyJpZCI6MTAsIl9rZCI6Im4ifQ"
    }
  }
}
```

| Поле | Тип | Описание |
|------|-----|----------|
| `total` | integer | Общее количество найденных результатов по запросу. |
| `paginate.next_page` | string | Курсор на следующую страницу. Доступен только курсор «вперёд», без `prev_page`. |

К этой группе относятся:

- [Поиск сотрудников](GET /search/users)
- [Поиск чатов](GET /search/chats)
- [Поиск сообщений](GET /search/messages)
- [Список сотрудников](GET /users) **с заданным параметром `query`** — возвращает упрощённый `meta` без `prev_page`/`has_next`/`has_prev`. Если вызывать `/users` без `query`, ответ соответствует группе «Списочные методы» с полным `meta.paginate`.

> В методах поиска **нет полей `prev_page`, `has_next`, `has_prev`** — поэтому polling новых результатов через `prev_page` здесь не работает. Конец данных определяйте по совпадению числа уже полученных записей с `total` или по пустому `data` в очередном ответе. Курсор `next_page` — непрозрачный токен, всегда указывайте `limit` явно.


## Обход всех записей

Передайте `next_page` в параметр `cursor` следующего запроса. Условие остановки зависит от группы метода: для списочных — `has_next: false`, для методов поиска — равенство числа полученных записей значению `total`.

### Для списочных методов

```javascript title="Обход всех чатов"
const TOKEN = 'ваш_токен';
const BASE = 'https://api.pachca.com/api/shared/v1';
const headers = { Authorization: `Bearer ${TOKEN}` };

const allChats = [];
let cursor;
let hasNext = true;

while (hasNext) {
  const url = new URL(`${BASE}/chats`);
  url.searchParams.set('limit', '50');
  if (cursor) url.searchParams.set('cursor', cursor);

  const res = await fetch(url, { headers });
  const json = await res.json();
  allChats.push(...json.data);

  cursor = json.meta.paginate.next_page;
  hasNext = json.meta.paginate.has_next;
}

console.log(`Всего чатов: ${allChats.length}`);
```

### Для методов поиска

```javascript title="Обход всех результатов поиска сообщений"
const TOKEN = 'ваш_токен';
const BASE = 'https://api.pachca.com/api/shared/v1';
const headers = { Authorization: `Bearer ${TOKEN}` };

const allMessages = [];
let cursor;
let total = Infinity;

while (allMessages.length < total) {
  const url = new URL(`${BASE}/search/messages`);
  url.searchParams.set('query', 'отчёт');
  url.searchParams.set('limit', '200');
  if (cursor) url.searchParams.set('cursor', cursor);

  const res = await fetch(url, { headers });
  const json = await res.json();
  allMessages.push(...json.data);

  if (json.data.length === 0) break;
  total = json.meta.total;
  cursor = json.meta.paginate.next_page;
}

console.log(`Всего найдено: ${allMessages.length} из ${total}`);
```

## Polling новых данных

Курсор `prev_page` доступен **только в списочных методах** и позволяет получать записи, появившиеся «перед» первой страницей, без полного рефетча. Это полезно для отслеживания новых сообщений в чате, новых чатов и других обновлений. В методах поиска `prev_page` отсутствует — там polling новых результатов через курсор не предусмотрен.

### Алгоритм

1. Выполните первый запрос без курсора и сохраните `prev_page` из ответа.
2. Периодически делайте запрос с `cursor=prev_page`.
3. Если `data` не пуст — появились новые записи. Обновите `prev_page` из ответа.
4. Если `has_prev` равен `true` — новых записей больше, чем `limit`. Продолжайте запрашивать по `prev_page`, пока `has_prev` не станет `false`.

Пока новых записей нет, ответ возвращает пустой `data` и тот же `prev_page` — можно безопасно повторять запрос с тем же курсором, не теряя точку отсчёта.

```javascript title="Polling новых чатов"
const TOKEN = 'ваш_токен';
const BASE = 'https://api.pachca.com/api/shared/v1';
const headers = { Authorization: `Bearer ${TOKEN}` };

// Первый запрос — загрузка начального списка
const initial = await fetch(`${BASE}/chats?limit=50`, { headers });
const initialJson = await initial.json();
let prevCursor = initialJson.meta.paginate.prev_page;
const chats = new Map(initialJson.data.map(c => [c.id, c]));

// Polling — проверка новых данных каждые 5 секунд
setInterval(async () => {
  let hasPrev = true;

  while (hasPrev) {
    const url = new URL(`${BASE}/chats`);
    url.searchParams.set('limit', '50');
    url.searchParams.set('cursor', prevCursor);

    const res = await fetch(url, { headers });
    const json = await res.json();

    // Дедупликация по id и обновление позиции в сортировке
    for (const chat of json.data) {
      chats.set(chat.id, chat);
    }

    prevCursor = json.meta.paginate.prev_page;
    hasPrev = json.meta.paginate.has_prev;
  }
}, 5000);
```

> **Внимание:** **Порядок batch'ей при polling.** Бэкенд возвращает записи, **ближайшие к anchor**, а не верх списка. Если за время между запросами появилось 8 новых чатов с id `c1 < c2 < ... < c8` при сортировке DESC, первый запрос с `prev_page` вернёт ближайшие к anchor: `[c5, c4, c3, c2, c1]` (5 записей в порядке сортировки), а следующий запрос по обновлённому `prev_page` — оставшиеся `[c8, c7, c6]`. Внутри batch'а порядок корректный, но **между batch'ами клиенту нужно мерджить с учётом сортировки**.


> **Внимание:** **Дедупликация по `id`.** Если у записи на границе курсора обновится поле сортировки (например, `last_message_at` у первого чата из исходной выдачи), при polling по `prev_page` она вернётся как «новая» — у неё теперь больший `last_message_at`, чем зафиксированный в anchor курсора. Это **не баг**, а корректное поведение: бэкенд сообщает «эта запись изменила позицию», UI должен обновить превью/таймстамп и перерасставить элемент в списке. Всегда дедуплицируйте polling-результаты по `id` при мердже с уже отрендеренным списком.


