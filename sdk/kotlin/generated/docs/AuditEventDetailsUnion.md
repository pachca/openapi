
# AuditEventDetailsUnion

## Properties
| Name | Type | Description | Notes |
| ------------ | ------------- | ------------- | ------------- |
| **changedAttrs** | **kotlin.collections.List&lt;kotlin.String&gt;** | Список изменённых полей |  |
| **newCompanyRole** | **kotlin.String** | Новая роль |  |
| **previousCompanyRole** | **kotlin.String** | Предыдущая роль |  |
| **initiatorId** | **kotlin.Int** | Идентификатор инициатора действия |  |
| **name** | **kotlin.String** | Название тега |  |
| **inviterId** | **kotlin.Int** | Идентификатор пригласившего |  |
| **oldName** | **kotlin.String** | Прежнее название чата |  |
| **newName** | **kotlin.String** | Новое название чата |  |
| **publicAccess** | **kotlin.Boolean** | Публичный доступ |  |
| **chatId** | **kotlin.Int** | Идентификатор чата |  |
| **tagName** | **kotlin.String** | Название тега |  |
| **scopes** | **kotlin.collections.List&lt;kotlin.String&gt;** | Скоупы токена |  |
| **messageId** | **kotlin.Int** | Идентификатор сообщения |  |
| **reason** | **kotlin.String** | Причина операции |  |
| **dlpRuleId** | **kotlin.Int** | Идентификатор правила DLP |  |
| **dlpRuleName** | **kotlin.String** | Название правила DLP |  |
| **userId** | **kotlin.Int** | Идентификатор пользователя |  |
| **actionMessage** | **kotlin.String** | Описание действия |  |
| **conditionsMatched** | **kotlin.Boolean** | Результат проверки условий правила (true — условия сработали) |  |
| **searchType** | **kotlin.String** | Тип поиска |  |
| **queryPresent** | **kotlin.Boolean** | Указан ли поисковый запрос |  |
| **cursorPresent** | **kotlin.Boolean** | Использован ли курсор |  |
| **limit** | **kotlin.Int** | Количество возвращённых результатов |  |
| **filters** | [**kotlin.collections.Map&lt;kotlin.String, kotlin.Any&gt;**](kotlin.Any.md) | Применённые фильтры. Возможные ключи зависят от типа поиска: order, sort, created_from, created_to, company_roles (users), active, chat_subtype, personal (chats), chat_ids, user_ids (messages) |  |



