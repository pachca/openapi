# Пачка API Documentation

Turborepo монорепозиторий: документация API, SDK для 5 языков, AI-интеграции.

**Сайт**: https://dev.pachca.com

## Структура

```
├── apps/docs/         # Next.js 16 сайт (@pachca/docs)
├── packages/spec/     # TypeSpec → openapi.yaml (@pachca/spec)
├── sdk/               # SDK (TypeScript, Python, Go, Kotlin, Swift)
│   ├── typescript/    # npm: @pachca/sdk
│   ├── python/        # PyPI: pachca
│   ├── go/            # Go modules: github.com/pachca/go-sdk
│   ├── kotlin/        # JitPack: com.pachca:sdk
│   └── swift/         # SPM: PachcaSDK
├── .github/workflows/ # CI: check, sdk, deploy, gitlab mirror
├── Package.swift      # Корневой Swift Package (для SPM)
├── jitpack.yml        # JitPack конфиг (Kotlin)
├── Dockerfile         # Docker-сборка и деплой docs
└── turbo.json         # Turborepo пайплайн
```

## Установка и команды

```bash
bun install

bun turbo dev          # Разработка (localhost:3000)
bun turbo build        # Production сборка
bun turbo check        # Все проверки (lint + typecheck + knip + format)
bun turbo generate     # TypeSpec → openapi.yaml + SDK
```

## Пайплайн

```
typespec.tsp
    │
    │ tsp compile
    ▼
openapi.yaml ──────────────────┐
    │                          │
    ▼                          ▼
apps/docs                   sdk/* (5 языков)
    │                          │
    │ next build               │ CI: generate + publish
    ▼                          ▼
  Сайт документации          npm, PyPI, JitPack,
  + llms.txt                 SPM, Go modules
  + llms-full.txt
  + skill.md
  + /openapi.yaml
  + RSS feed
  + sitemap.xml
  + OG-изображения
  + per-endpoint .md
```

## CI/CD

| Workflow | Триггер | Что делает |
|----------|---------|------------|
| `check.yml` | PR в `main` | lint + typecheck + knip + format |
| `sdk.yml` | Push в `main` | Генерация SDK → коммит → теги → публикация |
| `deploy.yml` | Push в `main` | Docker build → GitLab registry → SSH deploy |
| `gitlab.yml` | Push в `main` | Зеркало в GitLab |

## AI-интеграции

- `/llms.txt` — краткий индекс API для LLM
- `/llms-full.txt` — полная документация одним файлом
- `/skill.md` — skill-дескриптор для AI-агентов
- `/{section}/{action}.md` — отдельные .md-файлы для каждого endpoint'а и гайда
- [Context7](https://context7.com/pachca/openapi) — AI-native document discovery
