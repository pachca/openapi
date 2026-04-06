
# Настройка

## Установка


  ### Шаг 1. Установка n8n

Два способа установки:

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


  ### Шаг 2. Установка расширения Пачки

Расширение доступно на [npm](https://www.npmjs.com/package/n8n-nodes-pachca) и [GitHub](https://github.com/pachca/openapi/tree/main/integrations/n8n).

    Три способа установки:

    1. Зайти в **Settings** > **Community nodes** и добавить `n8n-nodes-pachca` (рекомендуется)
    2. Выполнить команду `npm i n8n-nodes-pachca` в директории n8n
    3. Следовать README-инструкции на [GitHub](https://github.com/pachca/openapi/tree/main/integrations/n8n)


  ### Шаг 3. Создание Credentials

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
    | **Bot ID** | нет | ID бота — нужен для авторегистрации вебхука в [Pachca Trigger](/guides/n8n/trigger). Автоопределяется из токена бота |
    | **Signing Secret** | нет | Секрет для верификации входящих webhook-запросов (HMAC-SHA256) |
    | **Webhook Allowed IPs** | нет | Список IP-адресов через запятую, с которых разрешены входящие вебхуки. Пачка отправляет с `37.200.70.177`. Пустое поле — разрешить все |

    ![Форма Credentials для Пачки в n8n](/images/n8n/credentials-v2.avif)

*Форма Pachca API Credentials*


  ### Шаг 4. Где получить токен

В Пачке доступны два типа токенов:

    - **Персональный токен** — доступен в разделе **Автоматизации** > **Интеграции** > **API**
    - **Токен бота** — доступен в настройках бота на вкладке **API**

    Доступные операции зависят от [скоупов](/api/authorization#skoupy) токена, а не от его типа. Подробнее — в разделе [Авторизация](/api/authorization).

    После заполнения полей нажмите **Test** — n8n проверит подключение вызовом [Информация о токене](GET /oauth/token/info). При успехе вы увидите подтверждение.

    ![Успешная проверка Credentials](/images/n8n/credentials-test.avif)

*Connection tested successfully*


    > Если тест не проходит — проверьте правильность токена и доступность API. Подробнее — в разделе [Устранение ошибок](/guides/n8n/troubleshooting).


  ### Шаг 5. Создание workflow

Workflow — визуальный редактор, в котором выстраиваются цепочки триггеров и действий. Создайте новый workflow и добавьте триггер **Manual Trigger** для ручного запуска.

    Нажмите **+** на выходе триггера и найдите **Pachca** в списке узлов.

    ![Поиск Pachca в списке узлов n8n](/images/n8n/workflow-add-node.avif)

*Поиск узла Pachca*


    После добавления узла на канвасе появится цепочка: Manual Trigger → Pachca.

    ![Узел Pachca на канвасе workflow](/images/n8n/workflow-pachca-node.avif)

*Pachca на канвасе*


  ### Шаг 6. Настройка и запуск

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


