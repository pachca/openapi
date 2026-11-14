> Расположение: n8n
> Краткое содержание: Установка расширения Пачки для n8n из официальной витрины: верифицированная нода, установка через Nodes panel, n8n Cloud и self-hosted, настройка Credentials и первый workflow
> Это Markdown-версия конкретной страницы. Для контекста за её пределами (правила API, полный перечень методов, авторизация) ОБЯЗАТЕЛЬНО открой [llms.txt](https://dev.pachca.com/llms.txt) перед ответом — это сэкономит токены и предотвратит неполный ответ.


# Начало работы

- [Pachca](https://n8n.io/integrations/pachca/) витрина · verified
- [Pachca Trigger](https://n8n.io/integrations/pachca-trigger/) витрина · verified
- [n8n-nodes-pachca](https://www.npmjs.com/package/n8n-nodes-pachca) npm


## Где запустить n8n

> Если n8n уже работает, переходите сразу к разделу [Установка расширения](#ustanovka-rasshireniya).


n8n можно использовать в двух режимах — выбирайте по контексту команды.

### n8n Cloud

Облачная версия [n8n Cloud](https://app.n8n.cloud/register) — самый быстрый старт: не нужны сервер, обновления и публичный домен для вебхуков. Verified-ноды Пачки доступны в поиске по умолчанию. В России и Беларуси n8n Cloud [недоступен](https://blog.n8n.io/update-on-n8n-cloud-accounts-in-russia-and-belarus/), там запускайте n8n на своём сервере, как в разделе ниже.

### Self-hosted

Запустите n8n на собственном сервере или локально. Два варианта: **npx** — для быстрой локальной пробы, **Docker** — для постоянной работы и продакшена. Пачка отправляет вебхуки только на публичный адрес. Если n8n запущен на вашей машине, события доходят до него через туннель, как в разделе [Локальная разработка](/guides/n8n/testing#lokalnaya-razrabotka), или через команду CLI `pachca bots listen-events --forward-to`, как в разделе [Разработка без публичного адреса](/guides/webhook/deploy#razrabotka-bez-publichnogo-adresa).

**С помощью команды** (требуется Node.js 24 или новее):

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
  -v n8n_data:/home/node/.n8n \
  n8nio/n8n
```

Подробные инструкции — в [официальной документации n8n](https://docs.n8n.io/hosting/) и на [GitHub](https://github.com/n8n-io/n8n).

После запуска откройте `http://localhost:5678` и заполните форму **Set up owner account**: почта, имя, фамилия и пароль владельца. Затем нажмите **Next**.

![Форма Set up owner account в n8n: заполнены Email, First Name, Last Name и Password, внизу кнопка Next](/images/n8n/owner-account.avif)

*Настройка аккаунта владельца*


После этого n8n может показать короткую анкету **Customize n8n to you** и затем откроет главную страницу. Пока workflow нет, на ней заголовок **Let's build your first automation** и карточки **Build an agent** и **Build a workflow**.

![Главная страница n8n без workflow: заголовок Let's build your first automation и карточки Build an agent и Build a workflow](/images/n8n/main-dashboard.avif)

*Главная страница n8n*


## Установка расширения

Расширение Пачки публикуется как **verified community node** и устанавливается прямо из редактора n8n — без npm и Docker. Путь одинаковый для n8n Cloud и self-hosted.


  ### Шаг 1. Откройте Nodes panel

Войдите в n8n, создайте или откройте любой workflow и нажмите **+** в правом верхнем углу канваса. Справа откроется Nodes panel. В пустом workflow она называется **What triggers this workflow?**, а если триггер уже есть, **What happens next?**.


  ### Шаг 2. Найдите Pachca в поиске

Введите «Pachca» в поиск. Пока расширение не установлено, n8n показывает его в разделе **More from the community** внизу панели. Нода **Pachca** отмечена значком verified: это партнёрский статус **verified by n8n**.

Узел действий Pachca и триггер Pachca Trigger n8n объединяет в одну запись **Pachca**, поэтому под названием стоит описание триггера «Starts workflow when Pachca events occur». Из панели **What happens next?** запись открывает список действий узла (**Actions**), а из **What triggers this workflow?** открывает события триггера (**Triggers**).

![Панель What happens next? после ручного триггера: в поиске Pachca, найдена одна запись Pachca со значком verified и описанием Starts workflow when Pachca events occur](/images/n8n/nodes-search-pachca.avif)

*Поиск Pachca в Nodes panel: значок verified рядом с названием*


  ### Шаг 3. Установите ноду

Нажмите на запись. Откроется панель **Node details** с описанием, списком действий и кнопкой **Install node**. Через несколько секунд в панели появится статус **Installed**, а нода станет доступна в поиске узлов всем участникам instance.

![Node details узла Pachca в панели узлов n8n: отметка verified, статус Installed и список операций Actions (105)](/images/n8n/node-details-pachca.avif)

*Node details: verified by n8n, статус Installed и список операций*


> **Внимание:** Установить verified-ноду может только **instance owner** или **admin**. Если у вас другая роль — попросите администратора.


> На self-hosted ноду можно поставить и из настроек: **Settings** > **Community nodes** > **Install**. Введите `n8n-nodes-pachca` в поле **npm Package Name**, отметьте **I understand the risks of installing unverified code from a public source** и нажмите **Install**. Итог тот же: нода появится в Nodes panel.


### Запасной путь: установка из npm для air-gapped self-hosted

Если основной путь через редактор недоступен — закрытый контур, кастомный Docker-образ, машина без доступа к интерфейсу n8n — поставьте пакет вручную:

```bash
cd ~/.n8n/nodes
npm install n8n-nodes-pachca
```

Или скачайте архив `n8n-nodes-pachca.tgz` из [GitHub Releases](https://github.com/pachca/openapi/releases?q=n8n) в папку `~/.n8n/nodes` и установите его там командой `npm install ./n8n-nodes-pachca.tgz`. После этого перезапустите n8n.

### Если расширение не видно в поиске

- **n8n Cloud:** verified-ноды включены по умолчанию. Если в поиске их нет, instance owner мог выключить переключатель **Verified community nodes** в разделе **Instance settings** консоли n8n Cloud. Попросите его включить.
- **Self-hosted** или **старая версия n8n** — что проверить, описано в разделе [Расширение не появляется в Nodes panel](/guides/n8n/troubleshooting#rasshirenie-ne-poyavlyaetsya-v-nodes-panel).

Подробнее — в [официальных доках n8n про verified-ноды](https://docs.n8n.io/integrations/community-nodes/installation/verified-install/).

## Настройка Credentials


  ### Шаг 1. Создание Credentials

Credentials — данные для авторизации. Откройте **Overview** на боковой панели (значок домика), перейдите на вкладку **Credentials** и нажмите **Create credential**.

![Вкладка Credentials на странице Overview: кнопка Create credential и учётные данные Pachca Bot типа Pachca API](/images/n8n/credentials-list.avif)

*Вкладка Credentials*


Откроется окно **Add new credential**. Введите «Pachca» в поле поиска, выберите **Pachca API** и нажмите **Continue**.

![Окно Add new credential: в поиске Pachca, в списке вариант Pachca API](/images/n8n/credentials-search.avif)

*Выбор Pachca API в окне Add new credential*


Заполните поля Pachca API:

| Поле | Обязательное | Описание |
|------|:---:|----------|
| **Base URL** | нет | Базовый URL API. Оставьте значение по умолчанию `https://api.pachca.com/api/shared/v1`. |
| **Access Token** | да | Токен бота или персональный токен |
| **Webhook Signing Secret** | нет | Секрет, которым Pachca Trigger проверяет подпись вебхуков (HMAC-SHA256). Скопируйте поле **Signing secret** с вкладки **Исходящий вебхук** в карточке бота. Для узла Pachca не нужен. |
| **Webhook Allowed IPs** | нет | Адреса через запятую, с которых Pachca Trigger принимает вебхуки. Адреса Пачки перечислены в разделе [Безопасность и обработчик](/guides/webhook/handler#bezopasnost). Пустое поле — разрешить все. |

Под этими полями n8n добавляет своё поле **Allowed HTTP Request Domains**: оно задаёт, к каким доменам узлы HTTP Request и GraphQL могут обращаться с этими учётными данными. Оставьте значение **All**.

![Новые учётные данные Pachca API в n8n: Base URL, Access Token, Webhook Signing Secret и Webhook Allowed IPs с подсказками про Pachca Trigger, ниже поле n8n Allowed HTTP Request Domains со значением All](/images/n8n/credentials-v2.avif)

*Форма Pachca API Credentials*


  ### Шаг 2. Где получить токен

Для сценариев n8n подходит **токен бота**: сообщения уходят от имени бота, а Pachca Trigger получает события этого бота. Токен выпускается в карточке бота на вкладке **API** (**Интеграции** > **Боты** > **Управление**). По умолчанию любой сотрудник может создать бота и выпустить токен своему боту, а кому ещё открыта вкладка **API**, сказано в разделе [Токены бота](/guides/bots/tokens). Права для узлов Pachca и Pachca Trigger выберите по набору «Сценарий n8n» из раздела [Наборы прав под типовые задачи](/guides/permissions#nabory-prav-pod-tipovye-zadachi).

**Персональный токен** (**Интеграции** > **API**) нужен для операций от имени сотрудника, например с черновиками или разделом «Важное». По умолчанию его создают только администраторы. Как выбрать токен под задачу — в разделе [Какой токен выбрать](/api/authorization#kakoy-token-vybrat), кому открыт выпуск токенов — в разделе [Кто может создавать токены](/api/authorization#kto-mozhet-sozdavat-tokeny).

Набор операций зависит и от [скоупов](/api/authorization#skoupy), и от типа токена: формы, разворачивание ссылок и история событий работают только с токеном бота, а черновики и «Важное» — только с персональным.

После заполнения полей нажмите **Save** — n8n проверит подключение вызовом [Информация о токене](/api/oauth/token-info). При успехе вы увидите подтверждение, повторить проверку можно кнопкой **Retry** в нём.

![Окно учётных данных Pachca Bot после сохранения: «Connection tested successfully» с кнопкой Retry, поля Base URL, Access Token, Webhook Signing Secret, Webhook Allowed IPs и Allowed HTTP Request Domains](/images/n8n/credentials-test.avif)

*Connection tested successfully*


> Если тест не проходит — проверьте правильность токена и доступность API. Подробнее — в разделе [Устранение ошибок](/guides/n8n/troubleshooting).


## Первый workflow


  ### Шаг 1. Создание workflow

Workflow — визуальный редактор, в котором выстраиваются цепочки триггеров и действий. Создайте новый workflow, нажмите **Add first step** и выберите **Trigger manually**. На канвасе появится триггер ручного запуска **When clicking ‘Execute workflow’** (узел Manual Trigger).

Нажмите **+** на выходе триггера и в панели **What happens next?** найдите **Pachca**.

![Панель «What happens next?» после ручного триггера: в поиске Pachca и запись Pachca со значком verified](/images/n8n/workflow-add-node.avif)

*Поиск узла Pachca*


Нажмите на запись **Pachca** и выберите действие **Create a message**. На канвасе появится цепочка из триггера и узла Pachca. n8n называет узел по действию, **Create a message**, а под названием показывает операцию `create: message`.

![Канвас «Первый workflow»: триггер When clicking ‘Execute workflow’ и связанный с ним узел Pachca Create a message с подписью create: message](/images/n8n/workflow-pachca-node.avif)

*Узел Pachca на канвасе*


  ### Шаг 2. Настройка и запуск

После выбора действия n8n сразу открывает окно узла **Create a message**. Позже его можно открыть двойным кликом по узлу. Настройте:

- **Credential:** выберите созданные учётные данные Pachca API
- **Resource:** Message
- **Operation:** Create
- **Entity Type:** Discussion (беседа или канал)
- **Entity ID:** чат, куда отправить сообщение
- **Content:** текст сообщения

Чат в поле **Entity ID** проще всего выбрать в режиме **From list**: начните вводить название, и n8n покажет подходящие чаты, доступные токену. В режиме **By ID** укажите число из ссылки на чат в веб-приложении Пачки. Как найти идентификаторы сотрудника, треда или сообщения — в разделе [Где взять идентификаторы](/api/requests-responses#gde-vzyat-identifikatory).

![Окно узла Create a message: Credential Pachca Bot, Resource Message, Operation Create, Entity Type Discussion, Entity ID в режиме By ID и Content «Привет из n8n!»](/images/n8n/node-message-create.avif)

*Настройка Message → Create*


> **Внимание:** Перед отправкой сообщения [добавьте бота в чат](/guides/bots/access).


Закройте окно узла и нажмите **Execute** внизу канваса. При успехе узлы подсветятся зелёным и покажут количество обработанных элементов.

![Триггер When clicking ‘Execute workflow’ и узел Create a message после запуска: оба подсвечены зелёным, на связях 1 item](/images/n8n/workflow-execute-success.avif)

*Workflow выполнен*


Откройте узел **Create a message**: в панели **Output** будет ответ API с данными созданного сообщения. Переключатель **Schema**, **Table** и **JSON** меняет вид ответа.

![Окно узла Create a message после запуска: в Output 1 item, ответ API в виде JSON с id, chat_id, content «Привет из n8n!» и url созданного сообщения](/images/n8n/workflow-output-data.avif)

*Ответ API в панели Output*


Больше примеров — в разделе [Примеры workflow](/guides/n8n/workflows).




## Связанные разделы

- [Ресурсы и операции](/guides/n8n/resources)
- [Триггер](/guides/n8n/trigger)
- [Устранение ошибок](/guides/n8n/troubleshooting)
