/**
 * Scenarios for a judged run: a request as a person would type it, and the tools
 * that count as a correct first call.
 *
 * Written in Russian on purpose. The prose that routes them is English, and
 * whether English descriptions carry a Russian request to the right tool is
 * exactly the thing worth measuring rather than assuming — the people who will
 * type these do not write in English.
 *
 * More than one accepted tool is not laxity. When a request names a chat or a
 * person instead of an id, resolving it first is correct behaviour, not a miss;
 * scoring it as one taught us more about the scenario set than about the prose.
 *
 * Ids and names are mixed on purpose, because both are how ids actually reach an
 * agent. A person talking names things — "напиши в «Релизы»" — and the resolving
 * call is then the whole measurement: the failure is inventing a number or
 * asking the person for one. An id in the prompt stands for the other two
 * routes, a pasted link and a previous result, and those scenarios are what
 * measures the acting tool itself. A set built only on ids would never test the
 * first half of almost every real request.
 */

/**
 * What the arguments of the call have to look like. Naming the right tool is
 * only half of a call: an argument outside its enum, or a required one left
 * out, fails validation just as surely as the wrong tool, and a run that grades
 * only the tool name reports it as a success. Assertions are checked against
 * the manifest at build time, so a scenario cannot demand an argument the tool
 * does not take or a value its enum does not allow.
 */
export interface ArgExpectation {
  /** Argument must be passed with exactly this value. */
  must?: Record<string, string | number | boolean>;
  /** Argument must be passed, any value. */
  present?: string[];
  /** Argument must not be passed — usually because its value would be invented. */
  absent?: string[];
}

export interface ToolScenario {
  id: string;
  /** The request as a person would type it. */
  prompt: string;
  /**
   * Tool names without the prefix, any of which is a correct first call, plus
   * two answers that are not tools.
   *
   * "none" — there is no tool for this on this surface, and saying so is the
   * whole answer. Some requests ask for capabilities deliberately not exposed
   * here, and reaching for the nearest half-fitting tool is the failure.
   *
   * "ask" — the tool exists, but the request does not carry what it needs, and
   * the honest first move is a question rather than a call with a guessed
   * value. The two are different failures and must not be conflated: "none" is
   * about the surface, "ask" is about the request.
   */
  accept: string[];
  /** What the arguments of that call have to look like. */
  args?: ArgExpectation;
  /**
   * The call changes something other people will see, so a human has to say yes
   * before it goes through. Declared per scenario rather than derived from the
   * tool, because the same tool is automatic in a direct message and needs a
   * yes in a shared chat.
   */
  confirmFirst?: boolean;
  /** Why this scenario exists, when it is not obvious. */
  note?: string;
}

export const TOOL_SCENARIOS: ToolScenario[] = [
  // ── Бывший край ядра: с 11.09 у всего этого есть инструмент ──────────────
  {
    id: "edge-pin",
    prompt: "закрепи сообщение 194270 в чате, чтобы не потерялось",
    accept: ["update_message"],
    args: { must: { message_id: 194270, pinned: true } },
    note: "Закрепление вернулось веткой update_message 11.09. Проверяем, найдёт ли модель pinned внутри правки, а не будет искать отдельный инструмент.",
  },
  {
    id: "edge-delete-message",
    prompt: "удали сообщение 194275, я его зря отправил",
    accept: ["delete"],
    args: { must: { message_id: 194275 } },
    confirmFirst: true,
    note: "Удаление живёт в одном инструменте delete с пометкой разрушающего. Верно — удалить после подтверждения, а не заменить текст пустым.",
  },
  {
    id: "edge-kick",
    prompt: "убери Петю из чата 198",
    accept: ["list_users", "update_chat_members"],
    note: "Исключение — ветка remove_user_ids в update_chat_members. Первым шагом допустимо найти Петю.",
  },
  {
    id: "edge-rename",
    prompt: "переименуй канал 198 в «Релизы 2027»",
    accept: ["update_chat"],
    args: { must: { chat_id: 198, name: "Релизы 2027" } },
    confirmFirst: true,
  },
  {
    id: "edge-others-status",
    prompt: "поставь Пете статус «в отпуске» до понедельника",
    accept: ["list_users", "save_user"],
    note: "Свой статус — update_my_profile, чужой — save_user у администратора. Пара «своё и чужое» — самая близкая из возможных.",
  },
  {
    id: "edge-read-file",
    prompt: "прочитай, что во вложении к сообщению 194275",
    accept: ["read_message"],
    note: "Инструмента чтения файла нет намеренно: агент отдаёт ссылку человеку. Верный первый шаг — открыть сообщение и увидеть вложение, а не искать несуществующее чтение файла.",
  },

  // ── Переформулировки: то же намерение чужими словами ─────────────────────
  {
    id: "rephrase-send",
    prompt: "скинь в «Релизы» сообщение, что всё готово",
    accept: ["list_chats"],
    note: "Чат назван словом, а отправка принимает идентификатор. Верный первый шаг — найти чат, а не подставить число наугад и не переспросить идентификатор у человека.",
  },
  {
    id: "rephrase-read",
    prompt: "подними переписку в «Релизах» за последнее время",
    accept: ["list_chats"],
  },
  {
    id: "rephrase-members",
    prompt: "глянь, кто вообще сидит в «Релизах»",
    accept: ["list_chats"],
  },
  {
    id: "rephrase-search",
    prompt: "не могу вспомнить, в каком чате мы утверждали макеты — поищи",
    accept: ["search_messages"],
    note: "Разговорное «поищи» без имени инструмента. Раньше в запросе стояло «это» без опоры на предыдущую реплику — в изолированном прогоне такой запрос честно нечитаем, и модель поменьше отвечала, что искать нечего.",
  },
  {
    id: "indirect-announce",
    prompt: "команда до сих пор не в курсе, что релиз выехал, а надо бы — в «Релизы»",
    accept: ["list_chats"],
    note: "Намёк вместо просьбы и название вместо идентификатора: два шага до отправки, и первый из них — поиск чата.",
  },
  {
    id: "indirect-catchup",
    prompt: "меня не было неделю, что я пропустил",
    accept: ["list_chats", "list_threads"],
  },
  {
    id: "indirect-task",
    prompt: "мне надо не забыть дописать отчёт до пятницы",
    accept: ["create_task"],
    args: { must: { kind: "reminder" }, present: ["content", "due_at"] },
    note: "Здесь провалились все три модели первого прогона: текст задачи уехал в kind, хотя это перечисление из пяти значений. Напоминание — это kind reminder, а текст живёт в content.",
  },
  {
    id: "indirect-status",
    prompt: "я до трёх на встрече, пусть люди видят",
    accept: ["update_my_profile"],
  },

  // ── Близкие пары: решает одно слово ──────────────────────────────────────
  {
    id: "pair-chat-content",
    prompt: "что пишут в чате 198",
    accept: ["read_chat"],
    note: "Против соседнего сценария: там спрашивают, что это за чат, а тут — что в нём.",
  },
  {
    id: "pair-chat-card",
    prompt: "что это вообще за чат 198",
    accept: ["read_chat"],
    args: { must: { chat_id: 198 } },
  },
  {
    id: "pair-thread-existing",
    prompt: "давай обсудим сообщение 194270 отдельно — успеем ли к пятнице?",
    accept: ["reply_in_thread"],
  },
  {
    id: "pair-thread-new",
    prompt: "давай обсудим переезд офиса отдельно, ни к чему не привязывая",
    accept: ["create_chat"],
    args: { must: { thread: true } },
  },
  {
    id: "pair-my-chats",
    prompt: "покажи мои чаты",
    accept: ["list_chats"],
  },
  {
    id: "pair-find-chat",
    prompt: "есть ли у нас чат про переезд офиса",
    accept: ["list_chats"],
    args: { present: ["query"] },
  },

  // ── Инструмента нет: верный ответ — сказать об этом ──────────────────────
  {
    id: "none-create-bot",
    prompt: "заведи бота, который будет постить к нам оповещения из GitLab",
    accept: ["save_bot"],
    args: { present: ["name"], absent: ["bot_id"] },
    confirmFirst: true,
    note: "Полный ответ говорит и то, что для самих оповещений код не нужен: у бота есть входящий вебхук, и GitLab шлёт прямо в него.",
  },
  {
    id: "none-export",
    prompt: "выгрузи всю переписку пространства архивом",
    accept: ["export_messages", "ask"],
    confirmFirst: true,
    note: "Просят «всю», а одна выгрузка берёт 45 дней: переспросить период так же верно, как заказать первую выгрузку.",
  },
  {
    id: "none-audit",
    prompt: "покажи журнал безопасности за вчера",
    accept: ["read_audit_log"],
    args: { present: ["start_time"] },
  },
  {
    id: "workspace-tags",
    prompt: "какие теги вообще есть у нас в пространстве?",
    accept: ["read_workspace"],
    args: { must: { section: "group_tags" } },
    note: "Справочник пространства за одним инструментом с разделами: проверяем, выбирает ли модель раздел, а не ищет инструмент по слову «теги».",
  },
  {
    id: "none-archive",
    prompt: "заархивируй канал 198, он больше не нужен",
    accept: ["update_chat"],
    args: { must: { chat_id: 198, archived: true } },
    confirmFirst: true,
    note: "Архивация в хвосте: инструмента нет, и агент должен сказать это, а не искать замену.",
  },
  {
    id: "none-form",
    prompt: "открой человеку форму, чтобы он заполнил заявку",
    accept: ["none", "help"],
    note: "Формы открывает только бот по нажатию его кнопки, у токена человека такого инструмента нет. Верно — сказать, что нужен бот, а не выдумать форму.",
  },
  {
    id: "none-tags",
    prompt: "создай тег «дизайнеры» и добавь туда людей",
    accept: ["save_group_tag", "list_users"],
    note: "Второй шаг живёт на другой сущности: состав тега правится у сотрудника полем list_tags в save_user.",
  },

  {
    id: "read-known-chat",
    prompt: "покажи последние сообщения в чате 198",
    accept: ["read_chat"],
  },
  {
    id: "digest-channel",
    prompt: "перескажи, что было в канале #релизы за сегодня",
    accept: ["list_chats"],
    note: "имя без идентификатора — первым шагом поиск",
  },
  {
    id: "where-discussed",
    prompt: "где у нас обсуждали переход на новый тариф?",
    accept: ["search_messages"],
  },
  {
    id: "find-channel",
    prompt: "найди канал про дизайн",
    accept: ["list_chats"],
  },
  {
    id: "find-person",
    prompt: "найди Петю из разработки",
    accept: ["list_users"],
    args: { present: ["query"] },
  },
  {
    id: "my-chats-week",
    prompt: "в каких чатах что-то происходило на этой неделе?",
    accept: ["list_chats"],
  },
  {
    id: "open-discussions",
    prompt: "какие обсуждения шевелились за последние три дня",
    accept: ["list_threads"],
  },
  {
    id: "retell-thread",
    prompt: "перескажи вот это обсуждение и выпиши решения, тред 265142",
    accept: ["read_chat"],
    args: { must: { thread_id: 265142 } },
  },
  {
    id: "who-agreed",
    prompt: "кто поставил реакцию на сообщение 194270?",
    accept: ["read_message"],
    args: { must: { message_id: 194270 }, present: ["include"] },
  },
  {
    id: "who-in-chat",
    prompt: "кто состоит в канале 198?",
    accept: ["list_users"],
    args: { must: { chat_id: 198 } },
  },
  {
    id: "what-is-chat",
    prompt: "мне прислали https://app.pachca.com/chats/144483 — что это за чат?",
    accept: ["read_chat"],
    args: { must: { chat_id: 144483 } },
  },
  {
    id: "who-is-user",
    prompt: "кто такой пользователь 3560, покажи его карточку",
    accept: ["read_user"],
  },
  {
    id: "read-one-message",
    prompt: "покажи сообщение 194275 целиком",
    accept: ["read_message"],
  },
  {
    id: "my-tasks",
    prompt: "покажи мои незакрытые задачи",
    accept: ["list_tasks"],
    args: { must: { status: "undone" } },
    note: "Две модели из трёх прислали status: open — слово из английского здравого смысла, а не из перечисления.",
  },
  {
    id: "send-to-channel",
    prompt: "напиши в «Релизы», что релиз выехал",
    accept: ["list_chats"],
  },
  {
    id: "dm-person",
    prompt: "напиши Пете Смирнову в личку, что я задержусь",
    accept: ["list_users"],
    note: "Человека называют по имени. Личный чат заводится по идентификатору получателя, так что сотрудника сначала находят поиском.",
  },
  {
    id: "reply-thread",
    prompt: "ответь в треде на сообщение 194270, что посмотрю завтра",
    accept: ["reply_in_thread"],
  },
  {
    id: "chain-reply",
    prompt: "ответь в самом канале 198 на сообщение 194270, что посмотрю завтра, не уводя в тред",
    accept: ["send_message"],
    args: { must: { chat_id: 198, parent_message_id: 194270 }, present: ["content"] },
    confirmFirst: true,
    note: "Оба числа разные и оба обязательны: без parent_message_id это просто новое сообщение, а не ответ цепочкой.",
  },
  {
    id: "send-report",
    prompt: "положи отчёт файлом report.md в чат 198, текст такой: «Сентябрь закрыт, выручка выросла на 12%»",
    accept: ["send_message"],
    args: { must: { chat_id: 198, file_name: "report.md" }, present: ["file_content"], absent: ["user_id"] },
    confirmFirst: true,
  },
  {
    id: "start-discussion",
    prompt: "заведи отдельное обсуждение по теме переезда, без привязки к сообщению",
    accept: ["create_chat"],
    args: { must: { thread: true } },
  },
  {
    id: "react",
    prompt: "поставь плюс на сообщение 194270",
    accept: ["react_to_message"],
    args: { must: { message_id: 194270, code: "👍" } },
    confirmFirst: true,
    note: "«Плюс» — это эмодзи, а не знак. Малая модель прислала code: «+», что не реакция.",
  },
  {
    id: "unreact",
    prompt: "убери мою реакцию 👍 с сообщения 194270",
    accept: ["react_to_message"],
    args: { must: { message_id: 194270, code: "👍", remove: true } },
  },
  {
    id: "fix-typo",
    prompt: "замени текст сообщения 194275 на «отчёт за сентябрь готов»",
    accept: ["update_message"],
  },
  {
    id: "new-channel",
    prompt: "создай канал по проекту Платипус, участников добавлю потом",
    accept: ["create_chat"],
    args: { must: { channel: true }, present: ["name"], absent: ["member_ids"] },
    confirmFirst: true,
    note: "Канал и открытость — независимые оси. Просили канал, про доступ не сказали ни слова, так что public выставлять неоткуда.",
  },
  {
    id: "invite",
    prompt: "добавь пользователя 3560 в чат 198",
    accept: ["update_chat_members"],
    args: { must: { chat_id: 198 }, present: ["add_user_ids"] },
    confirmFirst: true,
    note: "Меняет состав чата: подтверждение обязательно при любом раскладе.",
  },
  {
    id: "new-task",
    prompt: "поставь мне задачу дописать отчёт к пятнице",
    accept: ["create_task"],
    args: { must: { kind: "reminder" }, present: ["content", "due_at"], absent: ["performer_ids"] },
    note: "Задача себе: исполнителя передавать не нужно, по умолчанию это вызывающий.",
  },
  {
    id: "close-task",
    prompt: "отметь задачу 3456 выполненной",
    accept: ["update_task"],
    args: { must: { task_id: 3456, status: "done" }, absent: ["content"] },
  },
  {
    id: "set-status",
    prompt: "поставь мне статус «на встрече» до 15:00",
    accept: ["update_my_profile"],
    confirmFirst: false,
    note: "Обратный случай к объявлению в канал: свой статус касается только вызывающего, и спрашивать разрешения не о чем. Пара нужна, чтобы подтверждение не превратилось в рефлекс на любую запись.",
  },
  // ── Кто я: свой идентификатор агенту взять неоткуда, кроме карточки ────
  {
    id: "self-id",
    prompt: "какой у меня id в Пачке?",
    accept: ["read_user"],
    args: { absent: ["user_id"] },
    note: "Без идентификатора карточка отвечает вызывающим. Подставить чужой номер или спросить человека — промах: ответ лежит в одном вызове.",
  },

  // ── Разговорные слова: в прозе их нет, а люди пишут именно так ─────────
  {
    id: "word-branch",
    prompt: "глянь, о чём договорились в ветке под сообщением 194270",
    accept: ["read_message", "read_chat"],
    note: "«Ветка» — это тред. В описаниях слова нет. Верно открыть сообщение и взять тред из него; сразу читать тред можно только зная его номер.",
  },
  {
    id: "word-group",
    prompt: "создай группу для команды логистики",
    accept: ["create_chat", "ask"],
    confirmFirst: true,
    note: "«Группа» в разговоре — беседа, но в Пачке так же зовут и теги сотрудников. Создать беседу или уточнить состав — верно; уйти в теги, которых здесь нет, — промах.",
  },
  {
    id: "word-remind",
    prompt: "напомни мне в пятницу позвонить в банк",
    accept: ["create_task"],
    args: { present: ["due_at"] },
    note: "«Напомни» — это задача со сроком, а не сообщение в чат и не отказ. Срок из запроса обязан попасть в вызов.",
  },

  // ── Ссылки: номер приходит из адреса, а чей он — решает параметр ─────────
  {
    id: "link-message",
    prompt: "глянь https://app.pachca.com/chats/144483?message=1076601422 — о чём там речь",
    accept: ["read_message"],
    note: "В адресе два разных номера. Нужен тот, что в message: чат открывать незачем, спрашивают про одно сообщение.",
  },
  {
    id: "link-thread-by-message",
    prompt: "перескажи, к чему пришли — https://app.pachca.com/chats?thread_message_id=1058906882",
    accept: ["read_message", "read_chat"],
    note: "Главная ловушка адресов: под thread_message_id лежит идентификатор сообщения, а не треда. Верно либо открыть сообщение и взять thread.id, либо, если модель это уже знает, читать тред. Подставить это число как thread_id — промах.",
  },
  {
    id: "link-user",
    prompt: "кто это — https://app.pachca.com/chats?user_id=309768",
    accept: ["read_user"],
  },
  {
    id: "link-reply",
    prompt: "ответь в треде https://app.pachca.com/chats?thread_message_id=1058906882, что посмотрю завтра",
    accept: ["reply_in_thread"],
    note: "Ответ в тред принимает и message_id, так что число из адреса подставляется напрямую — лишнего чтения тут не нужно.",
  },

  // ── Запрос без того, что инструменту нужно: спросить, а не угадать ───────
  //
  // Появление ответа "ask" вскрыло в наборе целый класс небрежности: пять
  // сценариев записи просили отправить сообщение, не давая его текста. Пока
  // засчитывалось только имя инструмента, это было не видно — модель называла
  // отправку, и никто не спрашивал, что именно она отправит. Все три модели
  // независимо отказались выдумывать текст. Сценарии переписаны так, чтобы
  // текст в запросе был; здесь же остались те, где нехватка данных и есть
  // предмет проверки.
  {
    id: "ask-task-no-subject",
    prompt: "поставь мне задачу на завтра",
    accept: ["ask"],
    note: "Срок есть, а что делать — нет. Придумать текст задачи нельзя: в календаре у человека останется наша выдумка. Верный ход — спросить, а не выбрать что-нибудь из разговора.",
  },
  {
    id: "ask-send-no-text",
    prompt: "напиши в «Релизы»",
    accept: ["ask", "list_chats"],
    note: "Чат назван, текста нет. Найти чат заранее — не ошибка, отправить придуманный текст — ошибка. Оба верных хода приняты, потому что порядок здесь не предопределён.",
  },
  {
    id: "ask-react-which",
    prompt: "поставь реакцию на последнее сообщение Пети",
    accept: ["ask", "list_users", "search_messages"],
    note: "Не сказано какую реакцию. Найти человека или сообщение можно сразу, а вот эмодзи выбрать за человека нельзя.",
  },
  {
    id: "ask-add-who",
    prompt: "добавь ребят из соседней команды в «Релизы»",
    accept: ["ask", "list_chats", "list_users"],
    note: "«Ребята из соседней команды» — не список. Состав чата меняется необратимо, так что угадывать людей нельзя ни при каких условиях.",
  },

  // ── Видимая запись: сначала спросить человека ────────────────────────────
  {
    id: "confirm-announce",
    prompt: "объяви в канале 198, что релиз выехал",
    accept: ["send_message"],
    args: { must: { chat_id: 198 }, present: ["content"] },
    confirmFirst: true,
    note: "Сообщение подписано именем человека и видно всему каналу. Инструмент выбран верно, но отправлять без «да» нельзя — это и проверяем отдельной осью.",
  },
  {
    id: "confirm-dm-self",
    prompt: "напиши мне в личку, что вечером созвон",
    accept: ["read_user"],
    args: { absent: ["user_id"] },
    note: "Себе написать можно, только зная свой идентификатор, а взять его агенту неоткуда, кроме карточки вызывающего. Первым ходом верно узнать себя, а не спросить человека и не отправить без адресата. Раньше сценарий держал пару к соседнему про подтверждение; эту роль теперь несёт свой статус."
  },
  {
    id: "confirm-new-thread",
    prompt: "заведи отдельное обсуждение по переезду и позови туда Петю",
    accept: ["create_chat", "list_users"],
    confirmFirst: true,
    note: "Создание треда спрашивает всегда: появляется новое место, куда позовут людей.",
  },
  {
    id: "confirm-edit-own",
    prompt: "поправь в сообщении 194275 опечатку: не «отчот», а «отчёт»",
    accept: ["read_message", "update_message"],
    note: "Чат в запросе не назван, поэтому ось подтверждения тут не проверяется: правка отвечает уровнем shared, а он различает личную переписку и общий чат. Проверять то, чего в запросе нет, — значит мерить угадывание. Правка видна в общем чате: у читателей оно уже было перед глазами. Чтение принято первым шагом не из мягкости — правка заменяет содержимое целиком, поэтому починить одно слово, не зная остального текста, нельзя. Две модели пришли к этому сами, а набор такого хода не предусматривал.",
  },

  {
    id: "how-webhooks",
    prompt: "а как в Пачке устроена проверка подписи вебхука?",
    accept: ["help"],
    args: { present: ["query"] },
  },
  {
    id: "rules-threads",
    prompt: "я первый раз работаю с тредами, какие тут правила?",
    accept: ["help"],
  },
  {
    id: "deleted-trap",
    prompt: "открой сообщение 194275, коллега говорит что оно пустое",
    accept: ["read_message"],
  },
  {
    id: "channel-write-trap",
    prompt: "напиши в канал 198, что релиз выехал, но я там только подписчик",
    accept: ["send_message", "reply_in_thread", "read_chat", "list_users"],
    note: "Подписчик в канал писать не может, но может комментировать в его тредах — так написано в описании отправки. Отсюда три верных первых шага: попробовать и получить внятный отказ, уйти сразу в обсуждение, либо сначала прочитать чат, чтобы найти сообщение, к которому тред и привязывать. Последнее выбрала крупная модель, и это план, а не промах. Четвёртый ход — посмотреть состав с фильтром по редакторам: описание инструмента прямо предлагает так узнавать, кто в канале может писать.",
  },
  {
    id: "thread-chat-trap",
    prompt: "напиши в чат треда 2637266155, что посмотрю завтра",
    accept: ["send_message", "reply_in_thread"],
  },
];

/**
 * The second half of a run. The scenarios above measure which tool gets called;
 * these measure what the agent says when no tool fits, which is a separate
 * failure with a separate cause.
 *
 * The server covers the whole public API, so a request with no tool is either
 * something Pachca does not do or something this connection cannot reach — a
 * role, a plan, a bot token. The scenarios split on exactly that: `api` means
 * the capability exists and the answer has to hand over the method and what it
 * needs, `absent` means it does not and the answer has to say so without
 * inventing an endpoint to soften it. Every `api` case moved into the tool set
 * on 11 September, when the tools grew to cover the API; the kind stays for the
 * next operation that lands outside a person's reach.
 */
export interface AnswerScenario {
  id: string;
  /** The request as a person would type it. */
  prompt: string;
  /** Where the capability actually lives. */
  reach: 'api' | 'absent';
  /**
   * Operations the answer has to name, checked against the spec so a rename
   * cannot leave a scenario quietly demanding something that no longer exists.
   * Empty for `absent` — there is nothing to name, and naming anything is the
   * failure.
   */
  mustName: Array<{ method: string; path: string }>;
  /** A condition the answer has to carry: a plan, a role, a kind of token. */
  mustFlag?: string;
  /**
   * The nearest real thing. Not a substitute — a field or a habit that answers
   * the underlying need once the person knows the feature itself is absent.
   */
  nearest?: string;
  /** What a run actually got wrong here, when that is what the scenario is for. */
  note?: string;
}

export const ANSWER_SCENARIOS: AnswerScenario[] = [
  // ── Нет ни инструмента, ни метода ────────────────────────────────────────
  {
    id: 'gone-schedule',
    prompt: 'запланируй отправку сообщения в чат 198 на завтра в 9 утра',
    reach: 'absent',
    mustName: [],
    nearest: 'напоминание POST /tasks с kind reminder, либо планировщик снаружи',
  },
  {
    id: 'gone-poll',
    prompt: 'сделай в канале 198 опрос с голосованием, куда идём на корпоратив',
    reach: 'absent',
    mustName: [],
    nearest: 'голосование реакциями и сбор через список реакций',
    note: 'Ловушка — формы: POST /views/open выглядит как опрос, но открывается только по trigger_id от нажатия кнопки, так что предложить его вместо опроса значит послать человека в тупик.',
  },
  {
    id: 'gone-presence',
    prompt: 'покажи, кто из команды сейчас онлайн',
    reach: 'absent',
    mustName: [],
    nearest: 'last_activity_at в карточке сотрудника',
    note: 'Ловушка в соседнем поле: user_status — это статус, который человек ставит себе сам, а не присутствие. Модель поменьше указала именно на него и потеряла last_activity_at.',
  },
  {
    id: 'gone-call',
    prompt: 'позвони Пете, надо срочно обсудить',
    reach: 'absent',
    mustName: [],
    nearest: 'meet_room_url в объекте чата — ссылка на видеочат',
    note: 'Мимо прошли все три: поле есть в объекте чата, но ни один гайд не связывает его с «как созвониться», и найти его через документацию не получилось ни у кого.',
  },
];
