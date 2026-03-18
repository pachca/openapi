# @pachca/generator

Генератор SDK из OpenAPI-спецификации для TypeScript, Python, Go, Kotlin и Swift.

## Установка

```bash
npm install -g @pachca/generator
```

## Использование

```bash
npx @pachca/generator --spec openapi.yaml --output ./sdk --lang typescript,python,go,kotlin,swift
```

### Параметры

| Флаг | Описание |
|------|----------|
| `--spec` | Путь к OpenAPI 3.0 YAML спецификации |
| `--output` | Директория для сгенерированных файлов |
| `--lang` | Целевые языки через запятую: `typescript`, `python`, `go`, `kotlin`, `swift` |

### Программный API

```typescript
import { generate } from '@pachca/generator';

generate('openapi.yaml', './output', ['typescript', 'python']);
```

## Архитектура

```
OpenAPI YAML → @pachca/openapi-parser → IR (transform.ts) → Генераторы языков → Исходные файлы
```

1. **Парсер** (`@pachca/openapi-parser`) — читает OpenAPI YAML, разрешает `$ref`, извлекает эндпоинты и схемы
2. **Трансформер** (`transform.ts`) — преобразует спецификацию в языконезависимое промежуточное представление (IR)
3. **Генераторы** (`lang/*.ts`) — создают идиоматичный код для каждого языка из IR

## Расширения OpenAPI

| Расширение | Уровень | Описание |
|------------|---------|----------|
| `x-error: true` | Schema | Помечает схему как тип ошибки (выбрасывается/возвращается при не-2xx) |
| `x-external-url: "paramName"` | Operation | Генерирует параметр `paramName` для динамических URL (например, загрузка в S3) |
| `x-requirements` | Operation | `auth: false` пропускает заголовок Authorization; `scope`/`plan` для метаданных |
| `x-paginated: true` | Operation | Генерирует хелпер `*All` для автоматической пагинации по всем страницам |
| `x-enum-descriptions` | Schema | Сопоставляет значения enum с человекочитаемыми описаниями |
| `x-param-names` | Parameter | Переопределяет имя параметра в SDK |

## Генерируемые возможности

- **Типобезопасные клиенты** с методами для каждой операции
- **Хелперы курсорной пагинации** (`listChatsAll`, `list_chats_all` и т.д.) для эндпоинтов с `x-paginated`
- **Повторные запросы с `Retry-After`** при 429 Too Many Requests (до 3 попыток с экспоненциальной задержкой)
- **Типы enum** с описаниями
- **Union/дискриминированные типы** (oneOf/anyOf)
- **Разворачивание тела запроса** для обёрток с одним полем
- **Поддержка multipart-загрузки**
- **Аннотации `@deprecated`** из спецификации
- **Конвертация snake/camel case** для идиоматичных имён полей

## Структура вывода

| Язык | Файлы |
|------|-------|
| TypeScript | `types.ts`, `client.ts`, `utils.ts` |
| Python | `models.py`, `client.py`, `utils.py`, `__init__.py` |
| Go | `types.go`, `client.go`, `utils.go` |
| Kotlin | `Models.kt`, `Client.kt` |
| Swift | `Models.swift`, `Client.swift`, `Utils.swift` |

## Тестирование

```bash
bun test
```

Snapshot-тесты сравнивают сгенерированный код с зафиксированными образцами в `tests/*/snapshots/`.

Для обновления snapshot'ов после изменения генераторов:

```bash
bun -e "import { generate } from './src/index.ts'; generate('tests/crud/fixture.yaml', 'tests/crud/snapshots', ['typescript', 'python', 'go', 'kotlin', 'swift']);"
```
