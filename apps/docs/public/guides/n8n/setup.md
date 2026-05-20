> Это Markdown-версия страницы. Используй её содержимое для ответов по этой теме.
> Для общего обзора API — [llms.txt](https://dev.pachca.com/llms.txt).


# Начало работы


## Где запустить n8n

> Если n8n уже работает, переходите сразу к разделу [Установка расширения](#ustanovka-rasshireniya).


n8n можно использовать в двух режимах — выбирайте по контексту команды.

### n8n Cloud (рекомендуется)

Облачная версия [n8n Cloud](https://app.n8n.cloud/register) — самый быстрый старт: не нужны сервер, обновления и публичный домен для вебхуков. Verified-ноды Пачки доступны в поиске по умолчанию.

### Self-hosted

Запустите n8n на собственном сервере или локально. Два варианта: **npx** — для быстрой локальной пробы, **Docker** — для постоянной работы и продакшена.

**С помощью команды** (требуется Node.js 22+):

```bash
npx n8n
```

**С помощью Docker:**

```bash
docker volume create n8n_data

docker run -it --rm \
  --name n8n \
  -p 5678:5678 \
  -e GENERIC_TIMEZONE="Europe/Moscow" \
  -e TZ="Europe/Moscow" \
  -e N8N_ENFORCE_SETTINGS_FILE_PERMISSIONS=true \
  -e N8N_RUNNERS_ENABLED=true \
  -v n8n_data:/home/node/.n8n \
  docker.n8n.io/n8nio/n8n
```

Подробные инструкции — в [официальной документации n8n](https://docs.n8n.io/hosting/) и на [GitHub](https://github.com/n8n-io/n8n).

После запуска откройте `http://localhost:5678` и настройте аккаунт владельца (Owner Account), указав почту, имя и пароль.

![Настройка аккаунта владельца n8n](/images/n8n/owner-account.avif)

*Настройка Owner Account*


После входа вы увидите главный экран n8n с пустым списком workflow.

![Главная страница n8n после авторизации](/images/n8n/main-dashboard.avif)

*Главная страница n8n*


## Установка расширения

Расширение Пачки публикуется как **verified community node** и устанавливается прямо из редактора n8n — без npm и Docker. Путь одинаковый для n8n Cloud и self-hosted.


  ### Шаг 1. Откройте Nodes panel

Войдите в n8n, создайте или откройте любой workflow и нажмите **+** в правом верхнем углу — справа откроется Nodes panel.


  ### Шаг 2. Найдите Pachca в поиске

Введите «Pachca» в поиск. В результатах появится нода **Pachca** с галочкой **verified by n8n** — это партнёрский статус. Нода **Pachca Trigger** найдётся таким же поиском, если открыть Nodes panel в начале workflow (выбор триггера).

![Поиск Pachca в Nodes panel внутри n8n с пометкой verified by n8n](/images/n8n/nodes-search-pachca.avif)

*Поиск Pachca в Nodes panel — verified-бейдж рядом с названием*


  ### Шаг 3. Установите ноду

Нажмите на ноду — откроется страница **Node details** с описанием, списком operations и кнопкой **Install**. Через несколько секунд нода появится в обычном поиске узлов и будет доступна всем участникам instance.

![Node details для Pachca: verified by n8n, статус Installed, список из 67 actions](/images/n8n/node-details-pachca.avif)

*Node details: verified by n8n, статус Installed, 67 actions*


> **Внимание:** Установить verified-ноду может только **instance owner** или **admin**. Если у вас другая роль — попросите администратора.


> Альтернативный путь — **Settings → Community Nodes**: введите `n8n-nodes-pachca` и нажмите **Install**. Подходит, если хочется зайти из настроек, а не из редактора. Итог тот же — нода доступна в Nodes panel.


### Запасной путь: установка из npm для air-gapped self-hosted

Если основной путь через редактор недоступен — закрытый контур, кастомный Docker-образ, машина без доступа к интерфейсу n8n — поставьте пакет вручную:

```bash
cd ~/.n8n/nodes
npm install n8n-nodes-pachca
```

Или скачайте архив `.tgz` из [GitHub Releases](https://github.com/pachca/openapi/releases?q=n8n) и распакуйте в `~/.n8n/nodes/`. После этого перезапустите n8n.

### Если расширение не видно в поиске

- **n8n Cloud:** verified-ноды включены по умолчанию. Если в поиске их нет, instance owner мог отключить их в Cloud Admin Panel — попросите включить.
- **Self-hosted:** убедитесь, что переменная `N8N_COMMUNITY_PACKAGES_ENABLED=true` (это значение по умолчанию для актуальных версий n8n).
- **Старая версия n8n** (< 1.0): community-ноды не поддерживаются — обновите n8n.

Подробнее — в [официальных доках n8n про verified-ноды](https://docs.n8n.io/integrations/community-nodes/installation/verified-install/).

## Настройка Credentials


  ### Шаг 1. Создание Credentials

Credentials — данные для авторизации. Перейдите в **Credentials** и нажмите **Add Credential**.

![Список Credentials в n8n](/images/n8n/credentials-list.avif)

*Список Credentials*


Найдите **Pachca API** в списке и заполните поля:

![Поиск Pachca API в списке Credentials](/images/n8n/credentials-search.avif)

*Поиск Pachca API в списке Credentials*


| Поле | Обязательное | Описание |
|------|:---:|----------|
| **Base URL** | нет | Базовый URL API. По умолчанию `https://api.pachca.com/api/shared/v1`. Менять только для on-premise |
| **Access Token** | да | Токен доступа к API |
| **Signing Secret** | нет | Секрет для верификации входящих webhook-запросов (HMAC-SHA256) |
| **Webhook Allowed IPs** | нет | Список IP-адресов через запятую, с которых разрешены входящие вебхуки. Пачка отправляет с `37.200.70.177`. Пустое поле — разрешить все |

![Форма Credentials для Пачки в n8n](/images/n8n/credentials-v2.avif)

*Форма Pachca API Credentials*


  ### Шаг 2. Где получить токен

В Пачке доступны два типа токенов:

- **Персональный токен** — доступен в разделе **Автоматизации** > **Интеграции** > **API**
- **Токен бота** — доступен в настройках бота на вкладке **API**

Доступные операции зависят от [скоупов](/api/authorization#skoupy) токена, а не от его типа. Подробнее — в разделе [Авторизация](/api/authorization).

После заполнения полей нажмите **Test** — n8n проверит подключение вызовом [Информация о токене](GET /oauth/token/info). При успехе вы увидите подтверждение.

![Успешная проверка Credentials](/images/n8n/credentials-test.avif)

*Connection tested successfully*


> Если тест не проходит — проверьте правильность токена и доступность API. Подробнее — в разделе [Устранение ошибок](/guides/n8n/troubleshooting).


## Первый workflow


  ### Шаг 1. Создание workflow

Workflow — визуальный редактор, в котором выстраиваются цепочки триггеров и действий. Создайте новый workflow и добавьте триггер **Manual Trigger** для ручного запуска.

Нажмите **+** на выходе триггера и найдите **Pachca** в списке узлов.

![Поиск Pachca в списке узлов n8n](/images/n8n/workflow-add-node.avif)

*Поиск узла Pachca*


После добавления узла на канвасе появится цепочка: Manual Trigger → Pachca.

![Узел Pachca на канвасе workflow](/images/n8n/workflow-pachca-node.avif)

*Pachca на канвасе*


  ### Шаг 2. Настройка и запуск

Дважды кликните на узел **Pachca** и настройте:

- **Credential:** выберите созданный Pachca API
- **Resource:** Message
- **Operation:** Create
- **Entity ID:** ID чата (число)
- **Content:** текст сообщения

![Настройка отправки сообщения в узле Pachca](/images/n8n/node-message-create.avif)

*Настройка Message → Create*


> **Внимание:** Перед отправкой сообщения [добавьте бота в чат](/guides/bots#dostupy-bota-k-chatam-i-soobscheniyam).


Закройте панель настроек и нажмите **Execute Workflow**. При успехе узлы подсветятся зелёным и покажут количество обработанных элементов.

![Успешное выполнение workflow](/images/n8n/workflow-execute-success.avif)

*Workflow выполнен*


Откройте узел Pachca, чтобы увидеть ответ API с данными созданного сообщения.

![Данные ответа API после выполнения](/images/n8n/workflow-output-data.avif)

*Ответ API в панели Output*


Больше примеров — в разделе [Примеры workflow](/guides/n8n/workflows).


