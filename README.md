# Пачка API

[![CI](https://github.com/pachca/openapi/actions/workflows/check.yml/badge.svg)](https://github.com/pachca/openapi/actions/workflows/check.yml)
[![npm](https://img.shields.io/npm/v/@pachca/sdk)](https://www.npmjs.com/package/@pachca/sdk)
[![npm](https://img.shields.io/npm/v/@pachca/cli)](https://www.npmjs.com/package/@pachca/cli)
[![npm](https://img.shields.io/npm/v/@pachca/generator)](https://www.npmjs.com/package/@pachca/generator)
[![npm](https://img.shields.io/npm/v/@pachca/mcp-manifest)](https://www.npmjs.com/package/@pachca/mcp-manifest)
[![npm](https://img.shields.io/npm/v/n8n-nodes-pachca)](https://www.npmjs.com/package/n8n-nodes-pachca)
[![PyPI](https://img.shields.io/pypi/v/pachca-sdk)](https://pypi.org/project/pachca-sdk/)
[![License: MIT](https://img.shields.io/badge/License-MIT-yellow.svg)](LICENSE)

> English version: [README.en.md](README.en.md)

Всё для работы с API [Пачки](https://pachca.com), корпоративного мессенджера: документация, MCP-сервер и плагин для AI-агентов, CLI, SDK на шести языках и нода для n8n. API описан на TypeSpec, и из этого описания собирается остальное: OpenAPI, страницы методов, CLI, SDK, нода n8n, набор инструментов MCP-сервера и файлы для агентов. Скиллы и команды плагина пишутся руками, а сборка сверяет их с тем же описанием.

| Что | Кому | В репозитории |
|-----|------|---------------|
| [MCP-сервер](#mcp-сервер) | Сотруднику в программе с AI-агентом: инструмент на каждый метод API | набор инструментов: исходники в `packages/spec`, пакет `packages/mcp-manifest`; сам сервер работает в бэкенде Пачки |
| [Плагин «Пачка»](#плагин-скиллы-и-команды) | Claude Code, приложению Claude, Codex, VS Code с GitHub Copilot и Cursor: MCP-сервер, восемь скиллов и три команды | `plugins/pachca` |
| [CLI](#cli) | Терминалу, скриптам, CI и агентам с терминалом | `packages/cli` |
| [SDK](#sdk) и [генератор](#генератор) | Своему коду на TypeScript, Python, Go, Kotlin, Swift и C# | `sdk/`, `packages/generator` |
| [n8n](#n8n) | Автоматизациям без кода | `integrations/n8n` |
| [Документация](https://dev.pachca.com) и [файлы для агентов](#ai-интеграции) | Разработчикам и агентам: гайды, методы, `llms.txt`, Markdown каждой страницы | `apps/docs` |
| [OpenAPI](https://dev.pachca.com/openapi.yaml) | Любым инструментам, которые читают OpenAPI | `packages/spec` |

**Документация**: https://dev.pachca.com · **OpenAPI**: https://dev.pachca.com/openapi.yaml · **Авторизация**: https://dev.pachca.com/api/authorization · **Changelog**: https://dev.pachca.com/updates · **Postman/Bruno**: https://dev.pachca.com/pachca.postman_collection.json

## MCP-сервер

`https://mcp.pachca.com/mcp` — инструмент на каждый метод API. Какие инструменты видит агент, зависит от роли сотрудника, тарифа и типа токена. Claude Code, Claude, VS Code и GitHub Copilot, Codex и приложение ChatGPT на компьютере входят через браузер, остальные программы передают токен в заголовке. Сервер опубликован в официальном реестре MCP под именем `com.pachca/mcp`, описание для реестра — [`server.json`](server.json). В Claude Code, приложении Claude, Codex, VS Code с GitHub Copilot и Cursor сервер вместе со скиллами и командами ставит [плагин «Пачка»](#плагин-скиллы-и-команды).

```bash
claude mcp add --transport http pachca https://mcp.pachca.com/mcp
```

**Документация**: [dev.pachca.com/guides/mcp](https://dev.pachca.com/guides/mcp/overview) · **Подключение программ**: [dev.pachca.com/guides/mcp/connect](https://dev.pachca.com/guides/mcp/connect) · **Манифест инструментов**: [`@pachca/mcp-manifest`](packages/mcp-manifest)

## CLI

```bash
# Zero-install (npx)
npx @pachca/cli messages create --entity-id=123 --content="Привет!" --token $PACHCA_TOKEN

# For regular use
npm install -g @pachca/cli
pachca auth login
pachca messages create --entity-id=123 --content="Привет!"

# Встроенный справочник по API прямо в терминале (для агентов)
pachca api ls                          # список всех эндпоинтов
pachca api POST /messages --describe   # параметры, тело, пример
pachca api POST /messages -F 'message[entity_id]=123' -f 'message[content]=Привет'  # прямой запрос
```

Все методы API доступны как команды. Типизированные флаги, валидация, 4 формата вывода (table, JSON, YAML, CSV), курсорная пагинация, несколько профилей авторизации, неинтерактивный режим для CI и AI-агентов. Команда `pachca api` — прямые запросы к любому методу и встроенный справочник по API (`ls`, `--describe`, `--spec`, `--docs`) из той же OpenAPI-спеки: агенту не нужно открывать сайт документации.

**Документация**: https://dev.pachca.com/guides/cli

## Плагин, скиллы и команды

Плагин «Пачка» ставит MCP-сервер, скиллы и команды. Скиллы — знание о том, как правильно делать задачи в Пачке: куда писать и что подтверждать, как искать и пересказывать, какой токен выбрать, почему не хватает прав. Агент берёт скилл сам, когда задача ему подходит. Справочник по аргументам агент берёт из описаний инструментов MCP-сервера, `pachca <команда> --help` и страниц методов, поэтому скиллы его не повторяют. Скиллы работают с любым способом подключения: MCP, CLI или API. Команду запускаете вы, а в чате приложения Claude она может сработать и по подходящей просьбе.

```bash
# Claude Code
claude plugin marketplace add pachca/openapi --sparse .claude-plugin plugins
claude plugin install pachca@pachca

# Codex
codex plugin marketplace add pachca/openapi --sparse .agents/plugins --sparse plugins/pachca
codex plugin add pachca@pachca

# GitHub Copilot CLI и VS Code
copilot plugin marketplace add pachca/openapi
copilot plugin install pachca@pachca

# Cursor CLI: затем в сессии агента выполните /plugin и установите pachca
agent plugin marketplace add https://github.com/pachca/openapi

# Только скиллы, для OpenCode, Devin, Cline, Kilo Code, Qwen Code и других агентов (Node.js 22.20+)
npx skills add https://dev.pachca.com -g -a opencode -y
```

В Cursor сервер плагина подключается персональным токеном из переменной `PACHCA_TOKEN`. В агент, где уже стоит плагин, скиллы через `npx skills` не ставьте: у него окажется по две копии каждого скилла. Cursor, приложение Claude, вход в Пачку и скиллы без Node.js — на странице [Плагин и скиллы](https://dev.pachca.com/guides/mcp/plugin).

| Скилл | Когда пригодится |
|-------|------------------|
| `pachca` | Вход в Пачку и переход к нужному скиллу: подключение через MCP, CLI или API, выбор токена, нет права или инструмента |
| `pachca-messaging` | Написать, ответить в треде, упомянуть, черновик, отложенное, файл |
| `pachca-search` | Найти обсуждение, чат или сотрудника, пересказать тред, дайджест, напоминания по итогам |
| `pachca-admin` | Сотрудники, теги, участники чатов, доступ к API, журнал аудита, экспорт, DLP |
| `pachca-bots` | Бот или интеграция: вебхуки, события, токены, кнопки, формы, разворачивание ссылок |
| `pachca-ai-agent` | AI-агент, который живёт в Пачке и отвечает в тредах |
| `pachca-oauth` | Приложение от имени каждого сотрудника |
| `pachca-api` | Скрипты, SDK и CI: пагинация, лимиты, ошибки, файлы |

| Команда | Что делает |
|---------|------------|
| `summarize-thread` | Пересказывает тред: о чём он, что решили, что осталось открытым и кому что поручили. Можно передать несколько тредов, попросить только новое за период и задать вопрос, на который агент ответит в конце. Тред о проблеме разбирает простыми словами, а замечания из треда разбирает по пунктам со статусом по коду |
| `watch-thread` | Следит за тредом через CLI и отвечает в нём, пока открыта сессия. Без треда открывает его под сообщением или создаёт самостоятельный тред с коллегой |
| `request-review` | Просит ревью MR или PR в чате ревью в формате прошлых запросов и с упоминанием ревьюеров, а со словом «напомни» напоминает о ваших MR, которые ждут ревью |

В Claude Code команды вызываются как `/pachca:summarize-thread`, `/pachca:watch-thread` и `/pachca:request-review`, в остальных программах — по таблице в разделе [Команды плагина](https://dev.pachca.com/guides/mcp/plugin#komandy-plagina) страницы «Плагин и скиллы». Что делает каждая команда по шагам — на странице [Команды плагина](https://dev.pachca.com/guides/mcp/commands).

Скиллы и команды пишутся руками в `plugins/pachca/skills/<name>/`. Сборка публикует на dev.pachca.com восемь скиллов-знаний (`/.well-known/agent-skills/index.json`, `/skill.md`) и проверяет ссылки, имена инструментов MCP и команд CLI. Команды плагина на сайт не попадают. В скиллах-знаниях только инструкции. Команда `watch-thread` запускает в фоне скрипт `scripts/watch.mjs` на Node.js, который следит за тредом через CLI, поэтому ей нужен `@pachca/cli` с входом `pachca auth login`. Прогоны плагина через `claude plugin eval` лежат в `plugins/pachca/evals`, как их запускать — в [CONTRIBUTING.md](CONTRIBUTING.md#agent-skills-and-the-plugin).

## n8n

Community node для [n8n](https://n8n.io/) — 19 ресурсов, больше 100 операций, Pachca Trigger с авторегистрацией вебхука.

```bash
# В n8n: Settings > Community Nodes > n8n-nodes-pachca
npm install n8n-nodes-pachca
```

Автоматически генерируется из OpenAPI-спецификации, полная обратная совместимость с v1.

**Документация**: [dev.pachca.com/guides/n8n](https://dev.pachca.com/guides/n8n/overview) · **Готовые workflow**: [dev.pachca.com/guides/n8n/workflows](https://dev.pachca.com/guides/n8n/workflows) · **[README](integrations/n8n/README.md)**

## SDK

| Язык | Пакет | Реестр |
|------|-------|--------|
| [TypeScript](sdk/typescript/README.md) | `@pachca/sdk` | npm |
| [Python](sdk/python/generated/README.md) | `pachca-sdk` | PyPI |
| [Go](sdk/go/README.md) | `github.com/pachca/openapi/sdk/go/generated` | Go modules |
| [Kotlin](sdk/kotlin/README.md) | `com.github.pachca:openapi` | JitPack |
| [Swift](sdk/swift/README.md) | `PachcaSDK` | SPM |
| [C#](sdk/csharp/generated/README.md) | `Pachca.Sdk` | NuGet |

Все SDK следуют единому паттерну: `PachcaClient(token)` → `client.service.method(request)`.

**Конвенции:**
- **Вход**: path-параметры передаются аргументами метода. Тело из одного обязательного поля, например роль участника чата, тоже разворачивается в аргумент. Остальные тела передаются одним объектом-запросом.
- **Выход**: если ответ API содержит единственное поле `data`, SDK возвращает его содержимое напрямую. Если рядом с `data` есть `meta` (списки и метод `Новый чат`), SDK возвращает ответ целиком: `data` и `meta`.
- Сервисы называются по тегам OpenAPI, методы — по operationId без префикса до `_` (`UserOperations_listUsers` → `listUsers`), а имена методов и полей пишутся в стиле языка: `listUsers` и `createdAt` в TypeScript, `list_users` и `created_at` в Python, `ListUsers` и `CreatedAt` в Go.

**Пример (TypeScript):**

```typescript
import { PachcaClient } from "@pachca/sdk";

const pachca = new PachcaClient("YOUR_TOKEN");
const users = await pachca.users.listUsers();
await pachca.reactions.addReaction(messageId, { code: "👍" }); // тело из нескольких полей → объект-запрос
```

SDK генерируются из `openapi.yaml`. При пуше в `main` CI коммитит перегенерированный код (`chore: regenerate SDK`), а когда в `apps/docs/data/releases.json` появилась новая версия `sdk`, ставит теги и публикует её в npm, PyPI, NuGet и JitPack. Swift и Go выходят через Git-теги. Как выбрать версию — в [docs/releases.md](docs/releases.md).

### Генератор

Вместо готового SDK можно сгенерировать типизированный клиент прямо в своём проекте:

```bash
npx @pachca/generator --output ./generated --lang typescript
npx @pachca/generator --output ./generated --lang typescript,python,go,kotlin,swift,csharp
```

| Параметр | Описание |
|----------|----------|
| `--spec <path\|url>` | Путь или URL к OpenAPI 3.0 YAML (по умолчанию: `https://dev.pachca.com/openapi.yaml`) |
| `--output <dir>` | Директория для сгенерированного кода |
| `--lang <langs>` | Языки через запятую: `typescript`, `python`, `go`, `kotlin`, `swift`, `csharp` |
| `--examples` | Генерировать `examples.json` с примерами вызовов |

**Документация**: https://dev.pachca.com/guides/sdk/overview

## Тестирование

| Инструмент | Как использовать |
|-----------|-----------------|
| [Scalar](https://client.scalar.com/?url=https://dev.pachca.com/openapi.yaml) | Онлайн-клиент прямо в браузере — без установки |
| [Postman Collection](https://dev.pachca.com/pachca.postman_collection.json) | Скачайте и импортируйте в Postman |
| Bruno | Скачайте тот же файл и импортируйте: «+» слева вверху → Import Collection |

## AI-интеграции

| Файл | Содержимое |
|------|------------|
| [`/llms.txt`](https://dev.pachca.com/llms.txt) | Краткий индекс: основные правила, способы работы, все endpoint'ы со ссылками + карта строк |
| [`/api/llms.txt`](https://dev.pachca.com/api/llms.txt), [`/guides/llms.txt`](https://dev.pachca.com/guides/llms.txt), [`/updates/llms.txt`](https://dev.pachca.com/updates/llms.txt) | Индексы разделов: методы, руководства, обновления |
| [`/llms-full.txt`](https://dev.pachca.com/llms-full.txt) | Полная документация: гайды + endpoint'ы с параметрами |
| [`/llms-en.txt`](https://dev.pachca.com/llms-en.txt) | Правила API, руководства и справочник методов на английском |
| [`/skill.md`](https://dev.pachca.com/skill.md) | Скилл-вход для AI-агентов: подключение и ссылки |
| `/api/{section}/{action}.md`, `/guides/{slug}.md` | Отдельный .md для каждого endpoint'а и гайда |
| `<любая страница>.md` | Markdown-версия любой страницы (или заголовок `Accept: text/markdown`) |
| `/.well-known/agent-skills/index.json` | Индекс скиллов (Agent Skills Discovery 0.2.0) с архивами `.tar.gz` рядом. ZIP для загрузки — `/skills/<скилл>.zip` |
| `/.well-known/api-catalog` | Каталог API (RFC 9727): описания, документация и метаданные одним JSON |

Через CLI справочник по API доступен и без сайта, без входа и без токена: `pachca api ls`, `pachca api <МЕТОД> <путь> --describe`.

Все файлы доступны с `Access-Control-Allow-Origin: *` и `Cache-Control: public, max-age=300, s-maxage=3600, stale-while-revalidate=86400`. `.md`-версии страниц, `llms-full.txt`, `llms-en.txt` и файлы скиллов помечены `X-Robots-Tag: noindex`, а `/llms.txt` индексируется, чтобы агенты находили его через поиск.

## Разработка

```bash
bun install

bun turbo dev            # Разработка с hot reload (localhost:3000)
bun turbo build          # Production сборка
bun turbo check          # lint, typecheck, knip, формат, тесты, сверки спеки и доки с кодом
bun turbo generate       # TypeSpec → openapi.yaml + SDK
```

Перед PR прогоните шаги `check.yml`: `bun turbo check`, `bun run check:changelog`, `bun run check:docs-format`, `bun run check:markdown` и после коммита `CI=1 bun run check:generated` (без `CI=1` или `--force` сверка сгенерированных файлов локально пропускается). После правки спеки `bun run sdk:build` повторяет сборку SDK из `sdk.yml`, а `bun run check:mcp-manifest` проверяет пакет MCP-манифеста по схеме. Порядок работы и правила веток — в [CONTRIBUTING.md](CONTRIBUTING.md). AI-агенту, который работает в этом репозитории, — в [AGENTS.md](AGENTS.md) (`CLAUDE.md` ссылается на него). AGENTS.md генерирует сборка, руками его не правят.

## CI/CD

| Workflow | Триггер | Что делает |
|----------|---------|------------|
| `check.yml` | PR в `main` | Сверка changelog с кодом → `bun turbo check` → Prettier и markdownlint для доков → сгенерированные файлы совпадают с источниками |
| `sdk.yml` | Push и PR в `main` или вручную | Генерация и сборка SDK, тесты по языкам. На push: коммит, теги и публикация новой версии SDK и `@pachca/cli` |
| `generator.yml` | Push и PR в `main` по путям генератора | Snapshot-тесты + npm publish `@pachca/generator` |
| `mcp-manifest.yml` | Push и PR в `main` по путям манифеста или вручную | Сборка MCP-манифеста → проверка по схеме → npm publish `@pachca/mcp-manifest` |
| `n8n.yml` | Push и PR в `main` по путям ноды или вручную | Генерация n8n node → тест → npm publish → GitHub Release |
| `deploy.yml` | Push в `main` или вручную | Docker build → GitLab registry → SSH deploy |
| `gitlab.yml` | Push в `main` | Зеркало в GitLab |

Пакет публикуется, только когда у него новая версия и запись в changelog: проверку `check-release` и правила версий описывает [docs/releases.md](docs/releases.md). Плагин в реестры не публикуется, программы берут его из этого репозитория. Его версию руками не меняют: сборка доков ставит её на патч выше, чем в `main`. Изменённому плагину нужна запись с product `plugin` и этой версией в `apps/docs/data/releases.json`, а новой версии `@pachca/mcp-manifest` — запись с product `mcp`, иначе `check-changelog-sync` падает. `server.json` выкладывают в реестр MCP вручную утилитой `mcp-publisher` после публикации манифеста с той же версией.

## Контакты

- [GitHub Issues](https://github.com/pachca/openapi/issues)
- support@pachca.com · team@pachca.com

---

<details>
<summary>Для мейнтейнеров: архитектура и внутреннее устройство</summary>

## Процесс разработки

Канонические доки (читать перед соответствующей задачей; AGENTS.md ссылается на них):

- [CONTRIBUTING.md](CONTRIBUTING.md) — раскладка, пайплайн генерации, build/check, workflow веток и PR
- [docs/api-audit.md](docs/api-audit.md) — аудит API и синхронизация с бэкендом (запускается на «проверь API»), bump версий и changelog'ов
- [docs/updates-format.md](docs/updates-format.md) — правила записей `content/updates/<дата>.md`, `releases.json` и `changelog.json` (нарушение ломает страницу обновлений)
- [docs/docs-conventions.md](docs/docs-conventions.md) — конвенции MDX/TypeSpec, регистрация компонентов в трёх местах, заголовки
- [docs/releases.md](docs/releases.md) — публикация пакетов, версии и проверки `check-changelog-sync` и `check-release`

## Структура монорепозитория

```
├── apps/
│   └── docs/              # Next.js 16 сайт документации (@pachca/docs)
├── packages/
│   ├── spec/              # TypeSpec спецификация, английский оверлей, examples.ts, сборка MCP-манифеста (@pachca/spec)
│   ├── generator/         # SDK код-генератор для 6 языков (@pachca/generator)
│   ├── openapi-parser/    # Парсер OpenAPI-спеки (@pachca/openapi-parser)
│   ├── mcp-manifest/      # MCP-манифест и его схема для npm (@pachca/mcp-manifest)
│   └── cli/               # CLI для работы с API (@pachca/cli)
├── sdk/                   # SDK для 6 языков (генерируются @pachca/generator)
│   ├── typescript/        # npm
│   ├── python/            # PyPI
│   ├── go/                # Go modules
│   ├── kotlin/            # JitPack
│   ├── swift/             # SPM
│   └── csharp/            # NuGet
├── integrations/
│   └── n8n/               # n8n community node (генерируется из OpenAPI)
├── plugins/pachca/        # Плагин «Пачка»: скиллы и команды (пишутся руками), настройки MCP, манифест для каждой программы
│   ├── skills/            # 8 скиллов-знаний и 3 команды
│   └── evals/             # Прогоны плагина через claude plugin eval: routing, knowledge, actions
├── .claude-plugin/        # Маркетплейс для Claude Code, приложения Claude и GitHub Copilot
├── .cursor-plugin/        # Маркетплейс для Cursor
├── .agents/plugins/       # Маркетплейс для Codex
├── docs/                  # Канонические процесс-доки (api-audit, updates-format, docs-conventions, releases)
├── scripts/               # Проверки CI (changelog, сгенерированные файлы, выпуск пакетов, MCP-манифест) и служебные скрипты: сборка SDK, первая публикация в npm, снапшоты генератора
├── server.json            # Описание MCP-сервера для официального реестра MCP (com.pachca/mcp)
├── CONTRIBUTING.md        # Раскладка, пайплайн генерации, build/check, workflow
├── AGENTS.md              # Гайд для AI-агентов по работе с репозиторием (CLAUDE.md → симлинк)
├── .github/workflows/     # CI/CD (check, sdk, generator, mcp-manifest, n8n, deploy, gitlab)
├── Package.swift          # Корневой Swift Package: указывает на sdk/swift/generated, SwiftPM ставит SDK из корня репозитория
├── jitpack.yml            # JitPack конфиг для Kotlin (JDK 17)
├── Dockerfile             # Multi-stage Docker-сборка docs
├── context7.json          # закрепляет библиотеку pachca/openapi в Context7
├── turbo.json             # Turborepo пайплайн
└── package.json           # Корневой (workspaces: apps/*, apps/*/*, packages/*, sdk/*, integrations/*)
```

## Пайплайн данных

```
typespec.tsp (packages/spec)
    │
    │ tsp compile
    ▼
openapi.yaml ─────────────┬─────────────────┬──────────────────────┐
    │                     │                 │                      │
    │ overlay:apply       ▼                 ▼                      ▼
    ▼                packages/cli      sdk/* (6 языков)     integrations/n8n
openapi.en.yaml           │                 │                      │
    │                     │ generate-cli    │ CI: generate         │ generate-n8n
    │                     ▼                 │ + publish            ▼
    │              npm (@pachca/cli)        ▼                   npm (n8n-nodes-pachca)
    │                                npm, PyPI, NuGet,
    │                                JitPack, SPM, Go modules
    │
    │ generate-mcp
    ├──────────────► mcp-manifest.json ──► npm (@pachca/mcp-manifest) ──► mcp.pachca.com
    │
    ▼
apps/docs ◄──────── plugins/pachca (скиллы и команды пишутся руками)
    │
    │ generate-llms, next build
    ▼
  Сайт + llms.txt + llms-full.txt + llms-en.txt
  + skill.md + per-endpoint и per-guide .md
  + скиллы на сайте (.well-known/{skills,agent-skills}/, /skills/*.zip)
  + AGENTS.md, версия плагина в его манифестах
  + pachca.postman_collection.json
  + примеры запросов: cURL и CLI из lib/code-generators, SDK из examples.json каждого SDK
  + OG-изображения + sitemap + RSS
```

Сервер `mcp.pachca.com` живёт в бэкенде Пачки и исполняет собственную копию манифеста из пакета `@pachca/mcp-manifest`. Новую версию он сам не подхватывает: после публикации пакета её передают команде бэкенда, порядок описан в [docs/releases.md](docs/releases.md). Описания инструментов пишутся в `packages/spec/mcp-core.ts` и `mcp-tools.ts`, а как модель выбирает инструменты по ним, проверяют прогоны по сценариям `packages/spec/mcp-scenarios.ts` (`eval:build`, `eval:run`, `eval:score` в `packages/spec`).

## Turborepo пайплайн

| Задача | Зависит от | Кешируется |
|--------|------------|------------|
| `setup` | — | нет |
| `generate` | `setup`, `^generate` | да (inputs: typespec.tsp, tspconfig.yaml, openapi.yaml, исходники генератора → outputs: openapi.yaml, generated/, src/generated/) |
| `overlay:apply` | `@pachca/spec#generate` | да (→ openapi.en.yaml) |
| `overlay:validate` | `@pachca/spec#generate`, `overlay:apply` | да |
| `generate-mcp` | `@pachca/spec#generate`, `overlay:apply`, `overlay:validate` | да (→ mcp-manifest.json) |
| `@pachca/mcp-manifest#build` | `@pachca/spec#generate-mcp` | да (копия манифеста и схемы в пакет) |
| `generate-llms` | `@pachca/spec#generate`, `overlay:apply`, `generate-mcp` (у docs ещё `@pachca/cli#build`) | да (→ llms.txt, llms-full.txt, llms-en.txt, skill.md, *.md, скиллы в `.well-known/`, `/skills/*.zip`, Postman-коллекция). AGENTS.md и версию плагина скрипт тоже пишет, но их нет в outputs: если версия не обновилась, нужен `--force` |
| `generate-cli` | `@pachca/spec#generate` | да (→ CLI commands, data/*.json) |
| `generate-n8n` | `^build`, `@pachca/spec#generate`, `overlay:apply` | да (→ n8n nodes, credentials) |
| `enum:check` | `@pachca/spec#generate`, `overlay:apply` | да |
| `test` | `^build`, `generate-cli`, `generate-n8n` (у CLI ещё `build`) | да |
| `build` | `^build`, `generate`, `overlay:apply`, `generate-mcp`, `generate-llms`, `generate-cli`, `generate-n8n` | да (→ .next/, dist/) |
| `dev` | `@pachca/spec#generate`, `generate-llms` | нет (persistent) |
| `check` | `lint`, `typecheck`, `knip`, `format:check`, `test`, `overlay:validate`, `enum:check` и сверки `check-models`, `check-commands`, `check-n8n-resources`, `check-sdk-install`, `check-examples`, `check-anchors`, `check-urls` | нет |
| `check-urls` | `@pachca/spec#generate` | да |
| `start` | `build` | нет (persistent) |

## Архитектура docs (apps/docs)

Next.js 16 (App Router, Turbopack) + MDX + FlexSearch (+ русские синонимы/стемминг) + Shiki + Mermaid + GSAP.

Всё динамическое — навигация, маршруты, поиск, примеры кода генерируются из OpenAPI.

### Что генерируется автоматически

| Действие | Результат |
|----------|-----------|
| Добавляете endpoint в TypeSpec | Страница + навигация + поиск + llms.txt + .md-файл |
| Удаляете endpoint | Всё исчезает |
| Добавляете тег | Новая секция в навигации |
| Меняете порядок тегов | Меняется порядок секций |
| Меняете `servers[0].url` | Обновляются все примеры кода |
| Добавляете гайд (.mdx) и его путь в `lib/tabs-config.ts` | Навигация + поиск + llms.txt + .md-файл |
| Добавляете обновление | Точка у вкладки «Обновления» (запись не старше 7 дней) + RSS feed |

### Маршрутизация

| URL | Источник |
|-----|----------|
| `/` | `content/home.mdx` |
| `/guides/{slug}` | `content/guides/{slug}.mdx` |
| `/guides/{category}/{slug}` | `content/guides/{category}/{slug}.mdx` |
| `/api/{slug}` | `content/api/{slug}.mdx` (авторизация, пагинация и др.) |
| `/api/{section}/{action}` | OpenAPI endpoint (динамически из тегов и путей) |
| `/api/{section}/{action}.md` | Статический markdown для endpoint'а |
| `/updates` | `content/updates.mdx` + записи `content/updates/<дата>.md` и выпуски пакетов `data/releases.json` |
| `/updates/{date}` | Обновление за конкретную дату |
| `/updates/season/{slug}` | Обновления за сезон |
| `/guides/{slug}.md` | Статический markdown для гайда |
| `/.md` | Rewrite → `/index.md` |
| `/internal/og` | Генерация OG-изображений |
| `/internal/search` | Поиск по сайту |
| `/feed.json` | JSON-лента обновлений |
| `/.well-known/api-catalog` | Каталог API (RFC 9727) |
| `/.well-known/security.txt` | Контакты для сообщений об уязвимостях |
| `/workflows/n8n/*.json` | Готовые workflow n8n для импорта |
| `/feed.xml` | RSS-лента обновлений |
| `/sitemap.xml` | Карта сайта |
| `/openapi.yaml` | OpenAPI спецификация |
| `/pachca.postman_collection.json` | Postman/Bruno коллекция |

### URL маппинг

| Паттерн | URL | Пример |
|---------|-----|--------|
| `GET /items` | `/api/{section}/list` | `/api/messages/list` |
| `POST /items` | `/api/{section}/create` | `/api/messages/create` |
| `GET /items/{id}` | `/api/{section}/get` | `/api/users/get` |
| `PUT /items/{id}` | `/api/{section}/update` | `/api/chats/update` |
| `DELETE /items/{id}` | `/api/{section}/delete` | `/api/messages/delete` |
| Sub-resources | `/api/{section}/list-{sub}` | `/api/group-tags/list-users` |
| Специальные | По действию | `/api/messages/pin`, `/api/messages/unpin` |

Секция определяется из OpenAPI-тега через `tagToUrlSegment()`. Особые адреса закреплены в `OPERATION_OVERRIDES` в `lib/openapi/mapper.ts`. Скрипт `check-url-conflicts.ts` (задача `check-urls`, входит в `turbo check`) считает адреса той же функцией `generateUrlFromOperation` и падает, если два метода попали на один адрес.

### Поиск

FlexSearch с `tokenize: 'forward'`. Русский язык: синонимы (`участники` → `members, users`), стемминг (`участников` → `участник`), стоп-слова, action patterns (`отправить` → `create/post`).

### Ссылки на API методы в тексте

```md
[Список сотрудников](GET /users)
[Новое сообщение](POST /messages)
```

Ссылки резолвятся в реальные URL и рендерятся с method-badge.

### Требования к методам (x-requirements)

Ограничения эндпоинтов описываются через `@extension("x-requirements", ...)` в TypeSpec.
Попадают в OpenAPI YAML как `x-requirements` и рендерятся в UI как бейджи и в per-endpoint `.md`-файлах, а из `scope` и `roles` собираются права инструментов в MCP-манифесте.

Поля:
- `scope` — требуемый скоуп токена (например `"messages:read"`). `null` — метод отвечает на любой действующий токен и скоупа не требует. Метод без `scope`, без `scope: null` и без `auth: false` валит сборку MCP-манифеста, как и скоуп, которого нет в `x-scope-roles`
- `roles` — роли метода, если их меньше, чем у скоупа (подробно в [docs/docs-conventions.md](docs/docs-conventions.md))
- `plan` — требуемый тариф (например `"corporation"`)
- `auth` — `false` если авторизация не нужна

### MDX компоненты

Новый компонент регистрируется в трёх местах: `components/mdx/mdx-components.tsx`, `components/api/markdown-content.tsx` и обработчик в `lib/mdx-expander.ts`, который превращает тег в Markdown для `.md`-версий и `llms-full.txt`. Без обработчика тег попадёт в них как есть. Сборку тогда остановит `scripts/generate-llms.ts`, если тег есть в его списке `LEAK_TAGS`, поэтому новый тег добавьте и туда. Подробности — в [docs/docs-conventions.md](docs/docs-conventions.md).

```mdx
<SchemaBlock name="MessageWebhookPayload" />
<ApiCodeExample operationId="SecurityOperations_getAuditEvents" />
<Info>Информация</Info>
<Warning>Предупреждение</Warning>
<Danger>Опасно</Danger>
<Steps><Step title="Шаг 1">Описание</Step></Steps>
<CardGroup><Card title="…" href="…" /></CardGroup>
<Limit title="Название" limit="~4" period="1 сек" entity="chat_id" />
<Prompts><Prompt ask="«Перескажи тред»">Что сделает агент</Prompt></Prompts>
<CliCommands />
<McpTools />
<PluginCommands />
<Mermaid chart={`graph TD; A-->B;`} />
```

Просьбы к агенту и что он сделает показываются компонентом `<Prompts>`, а не таблицей.

### Как добавить новый гайд

Создайте `content/guides/{slug}.mdx` (или `content/guides/{category}/{slug}.mdx`, `content/api/{slug}.mdx`) с frontmatter:

```mdx
---
title: Название гайда
description: Краткое описание для SEO
---
```

Добавьте путь в `lib/tabs-config.ts` (страницу `content/api/` — в `API_GUIDE_PAGES` там же) → гайд появится в навигации, поиске, llms.txt и получит `.md`-файл.

### Обновление API (changelog)

Создайте файл `content/updates/<ГГГГ-ММ-ДД>.md` (один файл на дату) с frontmatter и markdown-телом:

```md
---
date: "2025-12-01"
title: "Название обновления"
---

- [Новый метод](POST /messages)
```

Пока записи не больше 7 дней, у вкладки «Обновления» в шапке горит точка, а её дата на ленте обновлений выделена цветом. Попадает в RSS feed. Полные правила — [docs/updates-format.md](docs/updates-format.md).

### Кастомная схема для гайда

Создайте `lib/schemas/guides/{Name}.json` → используйте `<SchemaBlock name="Name" />`. Индексируется для поиска и попадает в `llms-full.txt`.

### Настройки

- `lib/display-config.ts` — `showSchemaExamples` (по умолчанию `false`)
- `redirects.ts` — редиректы: по умолчанию permanent (308), с `permanent: false` временные (307)

### Безопасность (next.config.ts)

HSTS (2 года, preload), X-Frame-Options: DENY, nosniff, Referrer-Policy: strict-origin-when-cross-origin, Permissions-Policy и Content-Security-Policy (`default-src 'self'`: внешние скрипты, стили, шрифты и запросы заблокированы, картинки разрешены с любого https). CORS разрешён для `llms.txt`, `llms-full.txt`, `llms-en.txt`, `/{api,guides,updates}/llms.txt`, `*.md` (в том числе `skill.md`), `/.well-known/skills/*`, `/.well-known/agent-skills/*`, `/skills/*.zip`, `openapi.yaml`, `pachca.postman_collection.json`.

</details>
