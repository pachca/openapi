# @pachca/app-sdk

SDK приложений Пачки: типы `window.pachca` и `ctx`, язык `v` для схемы и аргументов, строители функций (`query`, `mutation`, `action`, `job`, `webhook`, `pachcaEvent`), ссылки на функции, `AppError` и `PachcaError`. Сам клиент и контекст функций подставляет платформа, в пакете только типы и код, который попадает в сборку приложения.

- `@pachca/app-sdk`: типы клиента (`window.pachca`) и `PROTOCOL`.
- `@pachca/app-sdk/server`: схема, функции, контекст.
- `@pachca/app-sdk/api`: ссылки на функции.
- `@pachca/app-sdk/pachca`: модели и методы API Пачки для `ctx.pachca`.
- `@pachca/app-sdk/build`: сборка приложения (`check`, `build`, `artifact`, `sources`) и заготовка из `template/` (`scaffold`). Проверяет типы, скоупы, хосты и импорты, которых нет в рантайме функций (workerd без модулей Node); в `manifest.json` сборки кладёт `protocol` и `sdk` (версию пакета).
- `@pachca/app-sdk/ops.json`: таблица методов API Пачки для платформы.
- `@pachca/app-sdk/contract/*.json`: фикстуры контракта с платформой (`contract/README.md`).

`src/generated` строится из `packages/spec/openapi.yaml` (`bun run generate`) и коммитится.

`template/` это заготовка нового приложения (заметки, задание, вебхук, событие Пачки, `AGENTS.md` для агента). Сборку на настоящих приложениях и шаблон проверяет `packages/app-tests`.
