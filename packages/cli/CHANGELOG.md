# Changelog

## 2026.3.2  (4 марта 2026)

  ~ auth login                          — Исправлена обработка ответа /oauth/token/info (обёртка { data })
  ~ auth refresh                        — Исправлена обработка ответа /oauth/token/info (обёртка { data })
  ~ doctor                              — Исправлена обработка ответа /oauth/token/info (обёртка { data })
  ~ commands                            — --available фильтрует недоступные команды вместо колонки available
  ~ auth login                          — Fallback-имя «User #ID» вместо «Unknown» при недоступном профиле
  ~ all                                 — --version пропускает проверку авторизации

## 2026.3.1  (4 марта 2026)

  + all                                 — Все флаги в kebab-case (--first-name, --entity-id, --phone-number)
  + all                                 — Boolean-флаги с --no- префиксом (--suspended / --no-suspended)
  + all                                 — Хинт «через запятую» для массивных параметров (--chat-ids, --user-ids)
  + all                                 — DELETE --json выводит {"ok":true} в stdout
  + all                                 — POST/DELETE не ретраятся при сетевых ошибках
  + common direct-url                   — Флаги в kebab-case, корректные wire names в FormData
  + chats list                          — Флаг --sort-last-message-at (был --sort-last_message_at)
  + guide                               — Поиск по сценариям использования API
  + doctor                              — Диагностика окружения (Node.js, сеть, токен, версия)
  + introspect                          — Метаинформация о командах и флагах для агентов
  + api                                 — Прямые HTTP-запросы с -f/-F, --input, --query
