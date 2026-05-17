# Аудит и документирование API

## Что это

Процесс проверки синхронизации между **бэкендом Пачки** (отдельный
Rails-репозиторий, клонируется локально — путь зависит от машины) и
TypeSpec-документацией этого репозитория (`packages/spec/typespec.tsp`).
Запускается периодически.

Триггер у мейнтейнера — фраза агенту **«Проверь API»** / **«Запусти аудит
API»**; шаги ниже одинаково выполняет и человек, и агент.

> Канонический процесс. Раньше жил вне репозитория и был доступен только
> одному человеку — теперь он здесь, чтобы все работали одинаково.

**Чекпоинт синхронизации с бэкендом** (последний проверенный коммит
`origin/master` бэкенда) ведётся в конце этого документа — в секции
[«Backend sync checkpoint»](#backend-sync-checkpoint). Обновляется в репо
по завершении каждого аудита.

---

## Процесс аудита

Шаги аудита:

### 0. Проверка последних изменений бэкенда

Перед полным аудитом — проверить, что изменилось в бэкенде за последние 3 дня:

1. Перейти в локальный клон бэкенд-репозитория Пачки
2. Взять последний проверенный коммит из секции «Backend sync checkpoint» в конце этого файла
3. **Сравнивать ТОЛЬКО с `origin/master`**, не с HEAD/--all:
   ```bash
   git fetch origin master
   git log <last_commit>..origin/master --oneline
   ```
   **НЕ использовать** `git log --all` или `git log <last_commit>..HEAD` — `--all` показывает коммиты со stage и фича-веток, которых на проде нет. Документация = master, иначе ставите в spec несуществующее поведение.
4. Если новых коммитов нет — пропустить, перейти к шагу 1
5. Если есть — просмотреть изменения в файлах API через `git diff <last_commit>..origin/master -- <пути>`:
   - `app/controllers/api/shared/v1/`
   - `app/serializers/shared/` и `app/serializers/outgoing_webhooks/`
   - `app/interactors/`
   - `config/routes.rb`
6. **Перед записью каждой находки в spec** — двойная проверка, что коммит реально в master:
   ```bash
   git merge-base --is-ancestor <sha> origin/master && echo "✓" || echo "✗ NOT in master"
   ```
7. Зафиксировать найденные расхождения и учесть их в дальнейших шагах аудита
8. **По возможности — валидировать API-запросом против прода** после внесения правок (особенно для новых полей в ответах). Можно попросить у пользователя read-only токен.
9. **По завершении аудита** — обновить секцию [«Backend sync checkpoint»](#backend-sync-checkpoint) в конце этого файла: записать хеш последнего проверенного коммита `origin/master` и текущую дату, закоммитить вместе с правками аудита

### 1. Проверка эндпоинтов

Сверить `config/routes.rb` (namespace `api/shared/v1`) с интерфейсами в `typespec.tsp`:
- Новые эндпоинты в бэкенде → задокументировать в TypeSpec
- Удалённые эндпоинты → убрать из TypeSpec
- Обновить **Таблицу покрытия API** ниже

### 2. Проверка параметров запросов

Для каждого эндпоинта сверить strong params контроллера (`app/controllers/api/shared/v1/`) с Request-моделями в `typespec.tsp`:
- Новые параметры в контроллере → добавить в TypeSpec
- Удалённые параметры → убрать из TypeSpec
- Проверить обязательность (`?` vs required)
- Обновить **Таблицу параметров запросов** ниже

### 3. Проверка полей ответов

Для каждого эндпоинта сверить сериализатор (`app/serializers/shared/`) с response-моделями в `typespec.tsp`:
- Новые поля в сериализаторе → добавить в модель
- Удалённые поля → убрать из модели
- **Nullable**: для каждого поля свериться с DB-схемой (`db/structure.sql`) И с валидациями модели:
  - Колонка `DEFAULT NULL` + нет presence-валидации → `type | null` в TypeSpec
  - Сериализатор-метод явно может вернуть `nil` (например, `HideSecretUserSerializer` — `email`/`phone_number` для чужих профилей у ботов без прав) → `type | null`
  - Тесты в `spec/requests/api/shared/v1/` — если фикстура содержит `field: nil` для штатного сценария → точно nullable
  - Не доверять только Ruby-схеме: даже у `NOT NULL` колонки `before_validation`-каллбэк может присвоить значение, и тогда поле не nullable в API

### 3a. Проверка payload исходящих вебхуков

Сверить сериализаторы исходящих вебхуков (`app/serializers/outgoing_webhooks/`) с моделями `*WebhookPayload` в `typespec.tsp`:

| Сериализатор бэкенда | Модель в TypeSpec |
|---|---|
| `OutgoingWebhooks::MessageSerializer` (или собирается inline в `OutgoingWebhooks::Trigger`) | `MessageWebhookPayload` |
| `OutgoingWebhooks::ReactionSerializer` | `ReactionWebhookPayload` |
| `Views::ButtonClickHandler` (payload собирается inline) | `ButtonWebhookPayload` |
| `Views::SubmitHandler` (payload собирается inline) | `ViewSubmitWebhookPayload` |
| `OutgoingWebhooks::ChatMember*` | `ChatMemberWebhookPayload` |
| `OutgoingWebhooks::CompanyMember*` | `CompanyMemberWebhookPayload` |
| `OutgoingWebhooks::LinkShared*` | `LinkSharedWebhookPayload` |

Проверять:
- Новые поля в payload → добавить в TypeSpec и в `WebhookPayloadUnion`
- Удалённые → убрать
- При добавлении поля учесть TTL хранилищ (например, `Views::ViewStore` хранит view 30 дней — поле может вернуться `null` для старых сохранённых view)

Источник истины: коммиты вида `BAK-XXXX webhook ...`, `chat_id в вебхуке`, `outgoing webhooks` — всегда сверять с `app/serializers/outgoing_webhooks/` и `app/interactors/views/` (для button/view payload).

### 4. Проверка ошибок API

Для каждого эндпоинта сверить обработку ошибок в контроллере и interactor'ах с описанием ошибок в `typespec.tsp`.

**Важно:** при каждом аудите активно искать новые `code`-значения в бэкенде. Источники кодов:
- **Interactor'ы** (`app/interactors/`) — кастомные ERRORS-хеши и `add_error` вызовы
- **Mutations gem** — автоматические коды `required`, `in`, `min_length`, `max_length` из деклараций `required do...end`
- **Контроллеры** (`app/controllers/api/shared/v1/`) — `serialize_errors({code: ...})` вызовы
- **Модели** (`app/models/`) — валидации ActiveRecord (`errors.add`)
- **Policies** (`app/policies/`) — кастомные `error_code` для Pundit
- **api_controller.rb** — глобальные обработчики (RecordNotFound, ParameterMissing, Pundit, Mutations)

Если найден новый `code` в бэкенде, которого нет в TypeSpec — **сразу добавить в enum `ValidationErrorCode`** и обновить таблицы.

Конкретные проверки:
- **HTTP-коды ошибок:** Какие статус-коды (400, 401, 402, 403, 404, 409, 410, 422) возвращает бэкенд → все ли объявлены в TypeSpec для данного эндпоинта
- **Модели ошибок:** Правильный ли тип используется (ApiError для бизнес-ошибок, OAuthError для 401)
- **Коды валидации (ValidationErrorCode):** Какие значения `code` бэкенд возвращает в `errors[].code` → все ли есть в enum `ValidationErrorCode`
- **Коды валидации по эндпоинтам:** Для каждого эндпоинта собрать конкретные `code`-значения, которые он может вернуть (из контроллера, interactor'а, модели) → обновить таблицу
- Обновить **Таблицу ошибок по эндпоинтам**, **Таблицу кодов валидации** и **Таблицу `errors[].code` по эндпоинтам** ниже

### 4a. Проверка версий пакетов и changelog'ов

Если в результате аудита появляются изменения в OpenAPI-спецификации, влияющие на пользователей публикуемых пакетов — нужно поднять версии и записи в changelog'ах. Иначе изменения уйдут в публикацию без указания в release notes, и пользователи не узнают о них.

#### Когда какой пакет требует bump'а

| Пакет | Файлы версии и changelog | Когда обновлять |
|---|---|---|
| **n8n** | `integrations/n8n/package.json` (`version`), `integrations/n8n/CHANGELOG.md` (вручную), `apps/docs/data/releases.json` (product: `n8n`) | Любые изменения в моделях ответа (User, Message, Chat и т.д.), новые/изменённые webhook payloads (Trigger выводит их пользователю), новые/изменённые эндпоинты, изменения в form blocks, изменения в `n8n-node` build-скриптах |
| **CLI** | `packages/cli/src/data/changelog.json` (источник, генерирует CHANGELOG.md), `packages/cli/package.json` (фактически 0.0.0 — версия публикации берётся из changelog.json), `apps/docs/data/releases.json` (product: `cli`) | Изменения моделей ответа (новые поля в `users`/`chats`/`messages` и т.д. видны в JSON-выводе), новые/удалённые/переименованные команды, изменения параметров команд, исправления багов |
| **SDK** (Go, Python, TS, Kotlin, Swift, C#) | `sdk/<lang>/package.json`, `apps/docs/data/releases.json` (product: `sdk` — единая запись на все языки) | Любые изменения OpenAPI-спецификации (модели запросов/ответов, эндпоинты, enum'ы, ошибки) — SDK генерируются из OpenAPI |
| **Generator** | `packages/generator/package.json`, `apps/docs/data/releases.json` (product: `generator`) | Изменения шаблонов генерации, новые языки, исправления генератора |
| **Docs (updates.mdx)** | `apps/docs/content/updates.mdx` | Любые user-facing изменения API: новые методы, новые поля моделей, изменения nullable-типов, изменения вебхуков |

#### Перед bump'ом — ОБЯЗАТЕЛЬНО проверить, что реально опубликовано

`changelog.json`/`releases.json`/`CHANGELOG.md` могут содержать ещё **не выпущенную** версию: отдельный `chore(release)`-коммит готовит запись заранее, а CI публикует позже. Прежде чем поднимать версию — проверить публикацию для **каждого** пакета отдельно (статусы независимы):

```bash
npm view @pachca/cli version          # CLI
npm view n8n-nodes-pachca version     # n8n
git tag --list 'v*' --sort=-v:refname | head -1   # SDK (CI публикует по тегам)
git tag --list 'n8n-v*' --sort=-v:refname | head -1
```

Если **верхняя запись в changelog новее опубликованного** (npm/тег latest < changelog top) — релиз ещё не вышел. Тогда новое изменение **вкладывается в эту pending-запись** (дату при необходимости сдвинуть на дату изменения), новую версию **НЕ создавать** — иначе плодится «версия-призрак», которой не будет в npm, и ломается CalVer-нумерация CLI (CI считает `patch_count` через `npm view`). Если опубликовано — новая версия корректна.

То же правило для `updates.mdx`: если блок `<!-- update:YYYY-MM-DD -->` за прошлую дату относится к ещё не выпущенному релизу — слить всё в один блок с датой релиза под одним `##` (см. [updates-format §1, §10](./updates-format.md)), не плодить второй датированный блок.

> Инцидент 2026-05-16 (BAK-2819): создана CLI `2026.5.3` при `npm latest = 2026.5.1` и невыпущенной `2026.5.2` → свёрнуто в pending `2026.5.2`; блок updates за 2026-05-15 слит в 2026-05-16. SDK `v1.0.16` и n8n `2.0.7` в тот же аудит были выпущены — для них новые `1.0.17`/`2.0.8` корректны.

#### Чеклист для каждого изменения API

- [ ] Изменения внесены в `typespec.tsp` и скомпилированы
- [ ] Запись в `apps/docs/content/updates.mdx` (под существующим `<!-- update:YYYY-MM-DD -->` если такая дата уже есть в начале файла, иначе создать новый блок поверх предыдущих)
- [ ] Если затронуты модели ответа → bump n8n + CLI + SDK
- [ ] Если затронуты только webhook payloads → bump n8n
- [ ] Если затронут процесс генерации → bump generator
- [ ] Соответствующие записи в `apps/docs/data/releases.json` (по продукту) — **CI не обновляет этот файл**, добавлять вручную
- [ ] Соответствующие записи в `*/CHANGELOG.md` или `*/changelog.json` пакета
- [ ] Версия в `package.json` пакета поднята согласно semver:
  - `+` (новый функционал, обратно совместим) → minor
  - `~` (изменение существующего поведения, обратно совместим) → minor
  - `-` (фикс) → patch
  - Breaking change → major

#### Файлы с захардкоженными версиями (всегда проверять при bump'е!)

Эти файлы **не** регенерируются автоматически и часто забываются:

| Файл | Что обновлять | Триггер |
|---|---|---|
| `integrations/n8n/README.md` | URL `releases/download/n8n-vX.X.X/...` (wget install) | Каждый bump n8n |
| `integrations/n8n/docs/DEVELOPMENT.md` | Текст «current: X.X.X» | Каждый bump n8n |
| `apps/docs/content/guides/cli.mdx` | Пример вывода `pachca doctor` (строка `# ✔ CLI v2026.X.X`) | Каждый bump CLI (исторически часто пропускают) |
| `apps/docs/data/releases.json` | Новая запись `{product, version, date, changes}` | Каждая публикация любого пакета (CI это **НЕ** делает) |

#### Файлы, регенерируемые автоматически

Эти файлы перегенерируются при `npx turbo build` — править руками не нужно:

- `apps/docs/public/updates.md` — из `content/updates.mdx`
- `apps/docs/public/llms-full.txt`, `llms-en.txt` — из `content/`
- `apps/docs/public/guides/*.md` — из `content/guides/*.mdx`
- `apps/docs/public/skills/*` — копии скиллов
- `packages/cli/CHANGELOG.md` — из `src/data/changelog.json` (через `patch-manifest.js`)
- `apps/docs/sitemap.xml`, `feed.xml` — динамические роуты

После bump'а пакета прогнать `npx turbo build` и **проверить diff** этих файлов: если там «зависшая» старая версия — значит регенерация не сработала, нужно дебажить.

#### Кто бампит версию пакета: CI или мы

| Пакет | Источник версии | Что от нас требуется |
|---|---|---|
| **n8n** | CI auto-increment patch (`integrations/n8n/package.json` major.minor + `npm view`) | Поднять major/minor в `package.json`, если переход на новый ряд. CHANGELOG.md и releases.json — вручную |
| **CLI** | CI CalVer (`YYYY.M.patch_count` через `npm view @pachca/cli`) | Прописать **точную ожидаемую** версию в `packages/cli/src/data/changelog.json` (CI пропустит автогенерацию для этой версии: «manual entries take priority»). Releases.json — вручную |
| **SDK** | CI auto-increment по тегам `v{spec_major.minor}.{patch+1}` (источник major.minor — `version: "X.Y"` в `typespec.tsp`) | Releases.json — вручную, **per-language SDK package.json не трогать** (placeholder `0.0.0`, заменяется CI). Sentinel: тег `v{X.Y.Z}` в гите |
| **Generator** | CI auto-increment patch | Releases.json — вручную если шаблоны менялись |

#### Известные пробелы прошлых аудитов (не повторять)

- SDK `v1.0.14` (28.04.2026, коммит `adc5b17`) опубликован без записи в `releases.json` — добавлено задним числом 04.05.2026
- `integrations/n8n/README.md` install URL отстаёт от версии — забывали при каждом bump'е (`f41dfa8` 09.04, и снова при 2.0.6)
- Дубликаты `<!-- update:YYYY-MM-DD -->` с одинаковой датой — все секции под одну дату должны идти под одним маркером
- Dev-only фиксы (`prebuild`-скрипты для локальных E2E, чистка артефактов разработки, фиксы CI/линтеров без эффекта на пользователя) **не попадают ни в один changelog** — ни в `apps/docs/data/releases.json`, ни в `integrations/<pkg>/CHANGELOG.md`, ни в `packages/cli/src/data/changelog.json`. Changelog — история того, что заметит пользователь пакета; dev-thing там просто шум, история живёт в git. Кейс: `prebuild` для E2E попал и в `releases.json`, и в n8n 2.0.6 CHANGELOG.md — из `releases.json` убрали, из CHANGELOG.md оставили только потому, что версия уже опубликована и отдельный релиз ради чистки changelog'а не делаем; правило применяется к **будущим** записям. Контрольный вопрос перед добавлением: «Заметит ли это пользователь, который скачал пакет из npm?» — если нет, не пишем нигде.

#### Формат версий

| Пакет | Схема | Пример |
|---|---|---|
| n8n | semver | `2.0.6` |
| CLI | calver `YYYY.M.PATCH` | `2026.5.0` |
| SDK | semver (общий для всех языков) | `1.0.14` |
| Generator | semver | `1.1.3` |

### 5. Проверка типов аудит-событий

Сверить список `event_key` в бэкенде с документацией в `apps/docs/content/guides/audit-events.mdx`:

1. Найти все вызовы `audit_event(key: '...')` и `perform_audit_event(key: '...')` в бэкенде — искать **во всех директориях**, не только `app/`: `app/services/`, `app/interactors/`, `app/controllers/`, `app/models/`, `lib/`, `config/`
2. Сравнить с разделом «Реализованные типы событий» в `audit-events.mdx`
3. Новые event_key в бэкенде → добавить в MDX (решить, документировать или игнорировать)
4. Удалённые event_key → убрать из MDX
5. Обновить **Таблицу типов аудит-событий** ниже

**Важно:** event_key — свободные строки (нет enum), разбросаны по всему бэкенду (не только shared/v1). Проверять все вызовы `audit_event`.

### 6. Внесение изменений

Если найдены расхождения:
1. Внести правки в `typespec.tsp` (см. **Справочник TypeSpec** ниже)
2. Обновить примеры в `@opExample` если затронуты
3. Если найдены новые `code` в ошибках бэкенда — добавить в enum `ValidationErrorCode`
4. Если найдены новые HTTP-коды ошибок — добавить в union ответа операции
5. **Если изменились скоупы токенов** (новые скоупы, изменение набора bot-скоупов) — обновить `apps/docs/content/guides/authorization.mdx`: секции «Скоупы персональных токенов», «Скоупы токенов ботов» и Warning-блок с перечнем недоступных ботам скоупов
6. **Проверить страницу «Модели»** (`apps/docs/content/api/models.mdx`) — страница содержит справочник всех моделей API. Таблицы свойств моделей (`<ModelSchema>`) генерируются из OpenAPI автоматически, но остальное прописано вручную:
   - **Список моделей в `<CardGroup>`** — если появилась новая модель или удалена старая, обновить список карточек (title, href, methods)
   - **Списки методов под каждой моделью** — если добавлен/удалён/переименован метод, обновить соответствующий список ссылок `[Название](METHOD /path)`
   - **Атрибут `methods` в `<Card>`** — если у модели изменился набор HTTP-методов (например, добавился DELETE), обновить атрибут
   - **Info-блок в начале** — если появился новый метод, не возвращающий модель данных, добавить его в список исключений
7. Добавить запись в `apps/docs/content/guides/updates.mdx` (см. **Формат записи обновления** ниже)
8. Запустить `cd packages/spec && bun run generate`
9. Запустить `bun turbo check`
10. Обновить таблицы в этом документе
11. **Проверить скиллы** — если затронуты API-методы, перейти к шагу ниже

### 6a. Проверка скиллов и workflow

После внесения изменений в TypeSpec/docs — проверить, нужно ли обновить скиллы.

> **ОБЯЗАТЕЛЬНО оценить необходимость нового сценария.** Если изменение
> вводит **неочевидный / многошаговый / ограниченный** флоу — обязательные
> связки параметров, предусловия, порядок вызовов, специфичные ошибки —
> недостаточно того, что метод попал в `endpoints.md`. Нужно явно решить:
> добавить ли workflow в `packages/spec/workflows.ts`, чтобы пользователи
> и агенты делали это правильно. Контрольный вопрос: «сможет ли агент
> выполнить это с первого раза только по описанию метода, или ему нужен
> пошаговый сценарий с предусловиями и обработкой ошибок?» Если второе —
> workflow обязателен. Кейс 2026-05-16 (BAK-2819): роль `guest` требует
> ровно один активный чат с правами токена и возвращает `400` по
> `chat_ids` — это ровно такой сценарий; в первый проход аудита workflow
> не завели, добавили постфактум по замечанию.

#### Архитектура генерации скиллов

```
typespec.tsp → openapi.yaml → generate.ts + config.ts + workflows.ts → SKILL.md + endpoints.md
```

**Автогенерируемые файлы (НИКОГДА не редактировать вручную):**
- `skills/*/SKILL.md` — генерируется из config + workflows + OpenAPI
- `skills/*/references/endpoints.md` — генерируется из OpenAPI (параметры, схемы, примеры curl)
- `skills/pachca-bots/references/webhook-events.md` — генерируется из generate.ts (хардкод)
- `apps/docs/public/.well-known/skills/*` — копии вышеуказанных файлов

**Файлы-источники (редактировать для изменения скиллов):**

| Файл | Что содержит | Когда редактировать |
|---|---|---|
| `apps/docs/scripts/skills/config.ts` | Определения скиллов: теги, триггеры, описания, ошибки | Новый скилл, новый тег OpenAPI, изменение описания, новые специфичные ошибки |
| `packages/spec/workflows.ts` | Пошаговые сценарии (title, steps, notes, curl) | Новый/изменённый workflow, новый параметр влияющий на шаги |
| `apps/docs/scripts/skills/generate.ts` | Логика генерации, хардкод вебхук-событий | Новый тип скилла, изменение формата вывода |
| `packages/spec/typespec.tsp` | Эндпоинты, параметры, схемы, описания | Любые изменения API (отражаются в endpoints.md автоматически) |

**Команда регенерации:** `npx turbo build` (компилирует TypeSpec И генерирует скиллы)

#### Привязка эндпоинтов к скиллам

Привязка работает через OpenAPI-теги (`@tag` в TypeSpec) → `config.ts: SKILL_TAG_MAP[].tags` + исключения в `COMMON_ENDPOINT_MAP`.

| Скилл | Теги в config.ts | Доп. маппинг (COMMON_ENDPOINT_MAP) | Эндпоинты |
|---|---|---|---|
| `pachca-profile` | `Profile` | `/custom_properties` → pachca-profile | GET /profile, GET/PUT/DELETE /profile/status, GET /custom_properties |
| `pachca-users` | `Users`, `Group tags` | — | CRUD /users, GET/PUT/DELETE /users/{id}/status, CRUD /group_tags, GET /group_tags/{id}/users |
| `pachca-chats` | `Chats`, `Members` | `/chats/exports` → pachca-chats | CRUD /chats, archive/unarchive, CRUD members, tags, leave, exports |
| `pachca-messages` | `Messages`, `Thread`, `Reactions`, `Read member` | `/uploads`, `/direct_url` → pachca-messages | CRUD /messages, pin, reactions, read_members, threads, uploads |
| `pachca-bots` | `Bots`, `Link Previews` | — | PUT /bots/{id}, POST /messages/{id}/link_previews, GET/DELETE /webhooks/events |
| `pachca-forms` | `Views` | — | POST /views/open |
| `pachca-tasks` | `Tasks` | — | CRUD /tasks |
| `pachca-search` | `Search` | — | GET /search/users, GET /search/chats, GET /search/messages |
| `pachca-security` | `Security` | — | GET /audit-events |

#### Что обновлять при разных типах изменений бэкенда

| Тип изменения в бэкенде | Что обновить | Файл |
|---|---|---|
| **Новый эндпоинт в существующем ресурсе** | 1) Добавить в TypeSpec (→ попадёт в endpoints.md автоматически). 2) Если нужен новый workflow — добавить в workflows.ts. 3) Если тег эндпоинта не совпадает с существующим — добавить в COMMON_ENDPOINT_MAP | `typespec.tsp`, `workflows.ts`, `config.ts` |
| **Новый ресурс (совсем новый API)** | 1) Добавить в TypeSpec с `@tag("NewTag")`. 2) Решить: новый скилл или расширить существующий. 3) Добавить скилл в SKILL_TAG_MAP (config.ts): name, tags, description, triggers, negativeTriggers. 4) Добавить workflows в workflows.ts. 5) Обновить CLAUDE.md — таблицу скиллов | `typespec.tsp`, `config.ts`, `workflows.ts`, `CLAUDE.md` |
| **Удалённый эндпоинт** | 1) Убрать из TypeSpec. 2) Удалить workflow, если он полностью завязан на этот эндпоинт. 3) Обновить шаги в других workflow, если они ссылались на этот эндпоинт | `typespec.tsp`, `workflows.ts` |
| **Новый параметр запроса** | 1) Добавить в TypeSpec (→ endpoints.md обновится). 2) Если параметр важный для сценариев — обновить steps/notes в workflows.ts (например, новый фильтр) | `typespec.tsp`, `workflows.ts` |
| **Удалённый параметр** | 1) Убрать из TypeSpec. 2) Убрать из шагов/notes в workflows.ts, если упоминается | `typespec.tsp`, `workflows.ts` |
| **Новое поле в ответе** | 1) Добавить в TypeSpec (→ endpoints.md обновится). 2) Если поле полезно для workflow — обновить notes | `typespec.tsp`, `workflows.ts` |
| **Новый код ошибки (специфичный для скилла)** | 1) Добавить в enum ValidationErrorCode (TypeSpec). 2) Если ошибка важна для пользователя — добавить в config.ts → `errors[]` соответствующего скилла (отображается в секции «Ограничения и gotchas» SKILL.md) | `typespec.tsp`, `config.ts` |
| **Изменение скоупа/тарифа** | 1) Обновить в TypeSpec. 2) Если скилл стал botOnly или перестал — обновить `botOnly` в config.ts | `typespec.tsp`, `config.ts` |
| **Новый тип вебхук-события** | 1) Обновить хардкод в generate.ts (функция `generateWebhookEventsMd`). 2) Если нужен новый workflow — добавить в workflows.ts для pachca-bots | `generate.ts`, `workflows.ts` |
| **Изменение описания/триггеров скилла** | Обновить в config.ts: `description`, `triggers`, `negativeTriggers`, `nearestAlternatives` | `config.ts` |

#### Секции SKILL.md и откуда они берутся

Понимание структуры SKILL.md помогает определить, какой файл редактировать:

| Секция в SKILL.md | Источник данных | Файл-источник |
|---|---|---|
| Frontmatter (name, description) | `config.ts` → SKILL_TAG_MAP | `config.ts` |
| Заголовок (Base URL, авторизация, botOnly) | `config.ts` → `botOnly` + хардкод | `config.ts` |
| «Когда НЕ использовать» | `config.ts` → `negativeTriggers`, `nearestAlternatives` | `config.ts` |
| «Пошаговые сценарии» | `workflows.ts` → WORKFLOWS[skillName] | `workflows.ts` |
| «Ограничения и gotchas» | OpenAPI-схемы (enum, maxLength, maximum) + `config.ts` → `errors[]` | `typespec.tsp`, `config.ts` |
| Таблица эндпоинтов | OpenAPI-эндпоинты (метод, путь, скоуп, тариф) | `typespec.tsp` |
| Ссылка на references/endpoints.md | Автогенерация | — |

| Секция в references/endpoints.md | Источник данных | Файл-источник |
|---|---|---|
| Описание эндпоинта | `@doc()` в TypeSpec | `typespec.tsp` |
| Параметры (query, path) | Параметры операции в TypeSpec | `typespec.tsp` |
| Тело запроса (schema) | Request-модель в TypeSpec (рекурсивно до глубины 3) | `typespec.tsp` |
| Пример curl | Автогенерация из `@opExample` | `typespec.tsp` |
| Ответ (schema) | Response-модель в TypeSpec (рекурсивно до глубины 3) | `typespec.tsp` |

#### Чеклист обновления скиллов

- [ ] Определить затронутые скиллы по таблице привязки выше
- [ ] **Оценить необходимость нового сценария** (см. callout в начале §6a): изменение вводит неочевидный/многошаговый/ограниченный флоу (обязательные связки параметров, предусловия, порядок вызовов, специфичные ошибки)? Если да — workflow **обязателен**, не ограничиваться `endpoints.md`
- [ ] Если новый эндпоинт с новым тегом — добавить тег в `config.ts` → `SKILL_TAG_MAP[].tags` или в `COMMON_ENDPOINT_MAP`
- [ ] Если нужен новый workflow — добавить в `packages/spec/workflows.ts` → `WORKFLOWS[skillName]`
- [ ] Если изменились шаги существующего workflow — обновить `steps[]` и `notes` в `workflows.ts`
- [ ] Если появилась специфичная ошибка — добавить в `config.ts` → `errors[]` соответствующего скилла
- [ ] Запустить `npx turbo build` для регенерации
- [ ] Источник истины: `packages/spec/openapi.yaml` (генерируется из `typespec.tsp`)

#### Валидация workflows против спецификации

**ОБЯЗАТЕЛЬНО** при каждом аудите — проверить все `workflows.ts` на соответствие `openapi.yaml`/`typespec.tsp`. Нельзя придумывать параметры, методы или значения enum'ов.

Что проверять в `steps[]`, `notes` и `curl` каждого workflow:

- [ ] **Названия query-параметров** совпадают с реальными в спецификации (пример ошибки: `created_at[from]` вместо `start_time`)
- [ ] **Значения enum'ов** совпадают с реальными (пример ошибки: `user_signed_in` вместо `user_login`)
- [ ] **Curl-примеры** используют правильные параметры и пути
- [ ] **Имена полей в body** совпадают с request-моделями в TypeSpec
- [ ] **Лимиты и дефолты** (`limit` до 50/100/200/300) совпадают с `@maxValue` в спецификации
- [ ] **HTTP-методы** в шагах (`GET`, `POST`, `PUT`, `DELETE`) совпадают с реальными
- [ ] **Пути эндпоинтов** корректны (например, `/audit_events`, не `/audit-events`)

Как проверять:
1. Открыть `workflows.ts` и для каждого скилла пройтись по всем `steps[]`, `notes` и `curl`
2. Каждый упомянутый параметр, значение или путь — сверить с определением в `typespec.tsp` (или `openapi.yaml`)
3. Исправления вносить **только в `workflows.ts`** — SKILL.md генерируется автоматически

#### Референсы с рынка

При создании новых workflow можно и нужно смотреть на аналоги у Linear, Vercel, Slack, Notion, GitHub и других продуктов. Но только как источник **идей для workflow** — какие задачи агент может решать. Реализовывать только то, что реально поддерживает Пачка API. Если похожий workflow у конкурента требует параметров, которых нет в нашем API — не добавлять.

#### Обновить таблицу

Обновить **Таблицу скиллов и workflow** в конце этого документа

### 6b. Формат записи обновления

**Жёсткие правила (нельзя нарушать — ломает рендер страницы):**

1. **Один `## Заголовок` на блок `<!-- update:YYYY-MM-DD -->`**. Парсер `apps/docs/lib/updates-parser.ts` берёт **первый** `##` как title (рендерится отдельно с датой), а все последующие `##` остаются в теле и рендерятся как сырой `h2` — выглядит уродливо и ломает иерархию. Если в одну дату попадает несколько логически разных изменений — объединяй под одним общим заголовком, разделяй параграфами и списками. Пример хорошего общего заголовка: `## Поле inviter_id, nullable-уточнения и chat_id в вебхуках`.

2. **Один блок `<!-- update:YYYY-MM-DD -->` на дату**. Если на странице уже есть запись с сегодняшней датой — добавлять параграфы под существующий маркер, а не плодить второй маркер с той же датой.

3. **Якоря на страницу моделей — транслит, а не кириллица**. Заголовки `## Сотрудник` / `## Реакция на сообщение` в `apps/docs/content/api/models.mdx` рендерятся с id, полученным через `apps/docs/lib/utils/transliterate.ts` → `toSlug()`:
   - `Сотрудник` → `sotrudnik`
   - `Реакция на сообщение` → `reaktsiya-na-soobschenie`
   - `Тег` → `teg`
   - `Напоминание` → `napominanie`

   Правильный URL: `/api/models#sotrudnik`. Кириллица в anchor (`#сотрудник`) **не работает** — браузер не находит цель.

   Источник истины — атрибуты `href` в `<Card>` блоках в `models.mdx`: они содержат уже готовые правильные slug'и, можно копировать оттуда.

#### Формат

Файл: `apps/docs/content/guides/updates.mdx`

Два типа записей — **новый метод** и **обновлённый метод** — имеют разный порядок:

**Новый метод** — сначала список методов, потом пояснение:

```mdx
<!-- update:YYYY-MM-DD -->

## Заголовок

Был добавлен новый метод:

- [Название метода](METHOD /path)

С помощью этого метода вы можете ...
```

**Обновлённый метод** — сначала что изменилось, потом список методов:

```mdx
<!-- update:YYYY-MM-DD -->

## Заголовок

{Описание что изменилось, какие поля добавлены, что нового.}

Был обновлен следующий метод:

- [Название метода](METHOD /path)
```

**Правила:**

1. **Дата** — комментарий `<!-- update:YYYY-MM-DD -->` перед каждой записью
2. **Заголовок** — краткое название фичи (не повторять «Добавлен метод...»)
3. **Новые методы**: `Был добавлен новый метод:` / `Были добавлены новые методы:` → список → пояснение после
4. **Обновлённые методы**: описание изменений → `Был обновлен следующий метод:` / `Были обновлены следующие методы:` → список
5. **Формат ссылки на метод:** `[Название метода](METHOD /path)`, где METHOD = GET/POST/PUT/DELETE
6. **Не-API обновления** (документация, инструменты) — допускается свободный формат без ссылок на методы

**Антипаттерн (дублирующийся бейдж метода):**

Никогда не использовать код-блок с HTTP-методом в качестве текста ссылки. Компонент рендерит цветной бейдж `GET`/`POST`/... сам — а если в `[]` ещё и `\`GET /messages/{id}\``, получим «GET GET /messages/{id}» (бейдж + дублирующий код).

- Правильно: `[Информация о сообщении](GET /messages/{id})` → один бейдж `GET` + название
- Неправильно: `[\`GET /messages/{id}\`](GET /messages/{id})` → двойной `GET GET`

**Поведенческие нюансы полей — в гайд, а не в `updates.mdx`:**

`updates.mdx` — короткая сводка «что изменилось». Подробное описание поведения, edge-case'ов и переходных оговорок (например, «для старых записей придёт `null`, пока не истечёт TTL») кладём в соответствующий гайд (`apps/docs/content/guides/*.mdx`) — обычно в `<Info>`/`<Warning>` блоке рядом со схемой/секцией. В `updates.mdx` оставляем одно предложение про сам факт изменения + ссылку с якорем в гайд:

```mdx
... добавлено поле `chat_id` ... Подробнее о поведении `chat_id` для `view_submit` — в разделе [Заполнение формы](/guides/webhook#zapolnenie-formy).
```

Якорь строится через `toSlug` (см. правило #3 выше): «Заполнение формы» → `zapolnenie-formy`.

**В `<Info>`/`<Warning>` гайдов — без конкретных дат:**

Постоянная документация не должна содержать «до 4 мая 2026», «после релиза 2.0.6». Через полгода такая оговорка станет непонятной. Использовать обобщённые формулировки: «до выкатки этого изменения», «для форм, открытых до изменения». Конкретная дата уже привязана к блоку `<!-- update:YYYY-MM-DD -->` в `updates.mdx` и к версии в `releases.json` — там и оставляем.

### 7. Отчёт

Вывести краткий отчёт:
- Что нового найдено
- Что задокументировано
- Что игнорируется
- Текущее покрытие

---

## Область аудита — что проверять, что нет

### Проверять (только публичный API shared/v1)

| Что | Путь в бэкенде |
|---|---|
| Контроллеры | `app/controllers/api/shared/v1/` — **ТОЛЬКО** этот namespace |
| Сериализаторы | `app/serializers/shared/` — только shared-сериализаторы |
| Роуты | `config/routes.rb` → namespace `api/shared/v1` |
| Interactors | Только вызываемые из shared/v1 контроллеров (проверять по вызовам) |
| Модели | Только валидации, затрагивающие поля shared/v1 API |
| Базовый контроллер | `app/controllers/api/shared/v1/api_controller.rb` — глобальные обработчики ошибок |
| Error codes | Только коды, реально попадающие в ответы shared/v1 эндпоинтов |

### НЕ проверять (игнорировать)

| Что | Причина |
|---|---|
| `app/controllers/api/v3/` | Внутренний API, не документируется |
| `app/controllers/api/v2/` | Старая версия, не документируется |
| `app/serializers/` (без `shared/`) | Внутренние сериализаторы для v3 |
| Interactors для v3 | Например `views/submit_handler`, `views/button_click_handler` — не вызываются из shared/v1 |
| Push-уведомления (`Notifier.notify_user`) | Error codes в push-уведомлениях — НЕ API-ответы |
| Коды ошибок из v3 | `admin`, `already_logged_in`, `disabled`, `expired`, `failed`, `invalid_json`, `kms_error`, `no_auth`, `not_allowed`, `out_of_range`, `parameter_missing`, `recording_*`, `stale_session`, `too_many`, `too_many_emails`, `usage_number_exceeded`, `validation_failed`, `video_room_not_found`, `view_not_found` |

---

## Игнорируемые элементы

Эти элементы намеренно не документируются — не помечать как расхождения:

| Элемент | Причина |
|---|---|
| GET /files/{id} | Не публичный эндпоинт — нигде не возвращаются ID файлов, пользователи не смогут воспользоваться |
| GET /agent_search/messages | Бета-эндпоинт, за флагом `beta_version_available?`. Скоуп `agent_search:messages` |
| POST /oauth/device_authorization, GET/POST /oauth/device, POST /oauth/token (grant_type=device_code) | OAuth Device Authorization Grant (RFC 8628), внедрён в BAK-2791. Доступен только клиенту `pachca_desktop` (см. `Oauth::DeviceFlowClient.allowed?`). Возвращает не OAuth access_token, а Pachca-сессионный JWT через `LoginManager`. SSO-flow для нашего же десктоп-приложения, не для сторонних интеграций — не документируем |
| POST /messages — `uuid` | Подставляется автоматически (SecureRandom.uuid) |
| POST /messages — `created_at` | Внутренний параметр, не для публичного API (создание сообщений в прошлое) |
| POST /messages — `files[].blurhash`, `files[].thumbhash`, `files[].thumb_key` | Внутренние параметры файлов |
| PUT /messages — `files[].id` | Не документируется |
| POST /messages — 409 Conflict | DuplicatesDetector (Redis, TTL 60s) — из shared API маловероятен, т.к. uuid каждый раз новый |
| Message — `display_avatar_url`/`display_name` conditional | Сериализатор включает только для ботов (`if: :from_bot`). Текущая документация: `string \| null` (всегда). Решено: бэкенд поправит, чтобы поля были всегда |
| UserStatus.away_message — `markup` | Поле `markup` (массив rich text разметки) в не-shared сериализаторе. Shared сериализатор не включает markup |
| SearchController — `search[query]` | Альтернативный вложенный параметр (legacy), не документируем |

---

## Справочник TypeSpec

### Архитектура

Бэкенд → TypeSpec (`packages/spec/typespec.tsp`) → OpenAPI YAML → Next.js docs (автоматически).

Всё описание API находится в одном файле: `packages/spec/typespec.tsp`. После внесения изменений компилятор генерирует `openapi.yaml`, а docs-сайт автоматически подхватывает новые страницы, навигацию и поиск.

### Где что искать в бэкенде

| Что искать | Где в бэкенде |
|---|---|
| HTTP-метод, путь, параметры | `config/routes.rb` и контроллер (`app/controllers/api/shared/v1/`) |
| Strong params (что принимает) | Метод `*_params` в контроллере |
| Обязательность полей | Валидации в модели (`app/models/`) и interactor'е (`app/interactors/`) |
| Поля ответа | Сериализатор (`app/serializers/shared/`) |
| Пагинация (page/per или limit/cursor) | Контроллер — смотреть какой gem используется |
| Коды ошибок (ValidationErrorCode) | Контроллер, interactor, модель — `add_error`, `errors.add`, `raise` |
| Структура ошибок (ApiError/OAuthError) | `app/controllers/concerns/` — базовые обработчики ошибок |
| Примеры запросов/ответов | Тесты (`spec/requests/api/shared/v1/`) |

**Важно:** не доверяй только названиям параметров — проверяй обязательность по валидациям модели и interactor'а.

### Шаблоны-аналоги в TypeSpec

| Тип операции | Пример-шаблон в typespec.tsp |
|---|---|
| CRUD (list, get, create, update, delete) | `UserOperations`, `GroupTagOperations` |
| Список с page/per пагинацией | `listChatMessages`, `listReadMembers` |
| Список с cursor пагинацией | `listUsers`, `listChats` |
| Удаление (204 No Content) | `deleteUser`, `deleteTag` |
| Вложенные ресурсы (/{id}/sub) | `ChatMemberOperations` |

### Модели ответов (response)

Добавлять в секцию моделей (~строки 400-800):

```typespec
@doc("Описание сущности")
model EntityName {
  @doc("Описание поля")
  @example(123)
  id: int32;

  @doc("Nullable поле")
  @example(utcDateTime.fromISO("2020-01-01T00:00:00.000Z"))
  some_date: utcDateTime | null;

  @doc("Enum поле")
  @example("value1")
  @extension("x-enum-descriptions", #{
    value1: "Описание значения 1",
    value2: "Описание значения 2"
  })
  status: "value1" | "value2";
}
```

**Правила:**
- Nullable поля: `type | null`
- Enum-описания через `@extension("x-enum-descriptions", ...)`
- Каждое поле — `@doc()` + `@example()`
- Склонения описаний enum должны согласовываться с сущностью (напоминание → «Выполнено», задача → «Выполнена»)

### Модели запросов (request)

Добавлять рядом с другими Request-моделями (~строки 1000-1400):

```typespec
@doc("Запрос на создание/обновление сущности")
model EntityCreateRequest {
  @doc("Объект параметров")
  entity: {
    @doc("Обязательное поле")
    field1: string;

    @doc("Опциональное поле")
    field2?: int32;

    @doc("Поле с дефолтом")
    field3?: int32 = 1;
  };
}
```

**Важно:**
- Обязательные поля — без `?`
- Опциональные — с `?`
- Дефолтные значения — `= value`

### Enum'ы

Добавлять в секцию enum'ов (~строки 30-380):

```typespec
@doc("Описание enum")
@extension("x-enum-descriptions", #{
  value1: "Описание 1",
  value2: "Описание 2",
})
enum EnumName {
  @doc("Описание 1")
  value1: "value1",

  @doc("Описание 2")
  value2: "value2",
}
```

### Операции (endpoints)

Добавлять внутри соответствующего `interface` или создать новый:

```typespec
@route("/entities")
@tag("TagName")
interface EntityOperations {
  @doc("""
Заголовок

Описание метода. Поддерживается markdown.

#admin_access_token_required
""")
  @get
  @route("/{id}")
  @opExample(#{
    parameters: #{
      id: 123
    },
    returnType: #{
      _: 200,
      body: #{
        data: #{ /* пример объекта */ }
      }
    }
  })
  operationName(
    @doc("Описание параметра")
    @path id: int32
  ): {
    @statusCode _: 200;
    @body body: DataResponse<Entity>;
  } | {
    @statusCode _: 401;
    @body body: OAuthError;
  } | {
    @statusCode _: 404;
    @body body: ApiError;
  };
}
```

### Шаблоны типовых операций

**Список с page/per:**
```typespec
  listEntities(
    @doc("Количество возвращаемых сущностей за один запрос")
    @query @minValue(1) @maxValue(50)
    per?: int32 = 50,
    @doc("Страница выборки")
    @query page?: int32 = 1
  ): {
    @statusCode _: 200;
    @body body: DataResponse<Entity[]>;
  } | { ... };
```

**Список с cursor:**
```typespec
  listEntities(
    @doc("Количество возвращаемых сущностей за один запрос")
    @query @minValue(1) @maxValue(50)
    limit?: int32 = 50,
    @doc("Курсор для пагинации (из meta.paginate.next_page)")
    @query cursor?: string
  ): {
    @statusCode _: 200;
    @body body: PaginatedDataResponse<Entity[]>;
  } | { ... };
```

**Удаление:**
```typespec
  @delete
  deleteEntity(@doc("Идентификатор") @path id: int32): {
    @statusCode _: 204;
    @body body: EmptyResponse;
  } | {
    @statusCode _: 401;
    @body body: OAuthError;
  } | {
    @statusCode _: 404;
    @body body: ApiError;
  };
```

### Стандартные коды ошибок

| Код | Когда использовать | Тип |
|---|---|---|
| 400 | Невалидный запрос | `ApiError` |
| 401 | Не авторизован (токен отсутствует/невалидный) | `OAuthError` |
| 402 | Требуется оплата | `ApiError` |
| 403 | Недостаточно прав OAuth-скоупа | `OAuthError` |
| 403 | Нет доступа (бизнес-логика, Pundit) | `ApiError` |
| 404 | Не найдено | `ApiError` |
| 409 | Конфликт | `ApiError` |
| 410 | Ресурс удалён | `ApiError` |
| 422 | Ошибка валидации | `ApiError` |

**Важно про 403:** Любой эндпоинт может вернуть 403 в формате `OAuthError` (`{"error": "insufficient_scope", "error_description": "..."}`) если у токена бота нет нужного скоупа. Дополнительно некоторые эндпоинты (экспорт) могут вернуть 403 в формате `ApiError` (бизнес-логика запрета). В TypeSpec используется `ApiError | OAuthError` для таких случаев.

### Обёртки ответов

- Одиночный объект: `DataResponse<Entity>`
- Массив (page/per): `DataResponse<Entity[]>`
- Массив (cursor): `PaginatedDataResponse<Entity[]>`
- Пустой ответ (204): `EmptyResponse`

### Запись в «Последние обновления»

Файл: `apps/docs/content/guides/updates.mdx`

Новая запись добавляется **в начало** файла (после заголовка), перед предыдущими обновлениями. Формат:

```mdx
<!-- update:ГГГГ-ММ-ДД -->

## Заголовок обновления

Описание изменений.

- [Название метода](HTTP_МЕТОД /путь)
- [Название метода](HTTP_МЕТОД /путь/{id})
```

**Правила:**
- Дата в комментарии `<!-- update:ГГГГ-ММ-ДД -->` — дата публикации изменения
- Ссылки на методы в формате `[Текст](МЕТОД /путь)` — автоматически становятся кликабельными ссылками на страницы документации
- Обновления с датой < 7 дней назад получают badge «Новое» на сайте (порог — `isNewUpdate()` в `apps/docs/lib/updates-parser.ts`)
- Допустимые HTTP-методы в ссылках: `GET`, `POST`, `PUT`, `DELETE`

### Спец-теги для описаний

В `@doc()` можно использовать хештеги, которые превращаются в callout-блоки:

- `#admin_access_token_required` — нужен токен администратора
- `#owner_access_token_required` — нужен токен владельца
- `#bot_access_token_required` — нужен токен бота
- `#corporation_price_only` — только для корпоративного тарифа
- `#access_token_not_required` — токен не требуется

### Компиляция и проверка

```bash
# Компиляция TypeSpec в openapi.yaml
cd packages/spec && bun run generate

# Все проверки (lint, typecheck, knip, prettier)
bun turbo check

# Если prettier ругается:
cd apps/docs && bunx prettier --write <файлы из вывода ошибки>
```

### Чеклист при добавлении нового эндпоинта

- [ ] Изучены контроллер, модель, сериализатор, interactor и тесты в бэкенде
- [ ] Проверена обязательность каждого поля (валидации модели + interactor)
- [ ] Проверена nullable полей в ответе (сериализатор)
- [ ] Определён тип пагинации (page/per или limit/cursor)
- [ ] Добавлена/обновлена response-модель (если нужно)
- [ ] Добавлена request-модель (для POST/PUT)
- [ ] Проверены все HTTP-коды ошибок бэкенда (400, 401, 403, 404, 409, 410, 422) — все объявлены в TypeSpec
- [ ] Проверены значения `code` в ошибках бэкенда — все есть в enum `ValidationErrorCode`
- [ ] Добавлены операции в interface с `@doc`, `@opExample` и кодами ошибок
- [ ] Примеры в `@opExample` содержат все обязательные поля модели
- [ ] Добавлена запись в `updates.mdx` с датой и ссылками на новые/обновлённые методы
- [ ] `bun run generate` проходит без ошибок
- [ ] `bun turbo check` проходит без ошибок (lint, typecheck, knip, prettier)
- [ ] Новые страницы отображаются на docs-сайте

---

## Таблицы покрытия (намеренно не хранятся здесь)

Полные сравнительные таблицы «бэкенд → TypeSpec» (покрытие эндпоинтов,
параметров запросов, кодов ошибок по каждому методу) — это **снимок на
момент времени**, а не часть процесса. Они быстро устаревают и не
версионируются осмысленно в git. Актуальное состояние покрытия получается
прогоном самого аудита по шагам выше против текущего `origin/master`
бэкенда и `packages/spec/typespec.tsp`. Этот документ — durable процесс;
снимок покрытия живёт в отчёте конкретного аудита, не здесь.

---

## Backend sync checkpoint

Последний коммит `origin/master` бэкенд-репозитория, против которого был
сверен этот spec. Шаг 0 берёт diff от этого коммита; шаг 9 обновляет
значения ниже и коммитит их вместе с правками аудита (так чекпоинт общий
для всех, а не у одного человека локально).

> **Верифицировано.** Аудит 2026-05-16 подтвердил, что прежний чекпоинт
> `9bd5a3c2b` реально в `origin/master` бэкенда
> (`git merge-base --is-ancestor 9bd5a3c2b origin/master` → ✓), и сдвинул
> базу на текущий `origin/master`. Diff `9bd5a3c2b..origin/master` по
> shared/v1 разобран: BAK-2003 (unfurl skip) и BAK-2759 (курсорная
> пагинация) уже были в spec (аудит 2026-05-06); BAK-2791 (Device
> Authorization Grant) и BAK-2672 (`video_room_links`, namespace
> `api/v3`) — вне области (не документируются); «cap per @ 50» в shared
> chats index — no-op, spec уже декларирует `@maxValue(50)`;
> **BAK-2819** (роль `guest` + `chat_ids` в `POST /users`) внесён в spec.

- **Last checked:** 2026-05-16
- **Last commit:** `a48925bc19a3fe96301db9da769ed0ba9e67f074` (`origin/master` HEAD, 2026-05-15 «Merge branch 'feature/fix-get-myself-chat'»)

Следующий аудит: `git fetch origin master && git log <last_commit>..origin/master --oneline -- app/controllers/api/shared/v1/ app/serializers/shared/ app/serializers/outgoing_webhooks/ config/routes.rb`
