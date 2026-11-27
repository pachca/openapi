# @pachca/app-tests

Приватный пакет: тесты сборки `@pachca/app-sdk/build` на настоящих приложениях, установленных так же, как у автора приложения
(`@pachca/app-sdk`, `@pachca/app-react`, React, TanStack Router, Vite). Отдельно от `@pachca/app-sdk`, потому что
`@pachca/app-react` сам зависит от SDK.

- `apps/tasks`: приложение со всеми видами функций, фронтом и файлами. Сборка, артефакт и проверки `check` на испорченных копиях.
- `apps/reference`: эталонная сборка, её артефакт лежит в `@pachca/app-sdk/contract/build.json`, его же принимает платформа.
- Шаблон `@pachca/app-sdk/template` проходит `check` и собирается.

Испорченные копии и шаблон собираются в `.tmp/`. После намеренного изменения сборки эталон обновляет `UPDATE_CONTRACT=1 bun run test`.
