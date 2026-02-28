
# AuditDetailsSearch

## Properties
| Name | Type | Description | Notes |
| ------------ | ------------- | ------------- | ------------- |
| **searchType** | **kotlin.String** | Тип поиска |  |
| **queryPresent** | **kotlin.Boolean** | Указан ли поисковый запрос |  |
| **cursorPresent** | **kotlin.Boolean** | Использован ли курсор |  |
| **limit** | **kotlin.Int** | Количество возвращённых результатов |  |
| **filters** | [**kotlin.collections.Map&lt;kotlin.String, kotlin.Any&gt;**](kotlin.Any.md) | Применённые фильтры. Возможные ключи зависят от типа поиска: order, sort, created_from, created_to, company_roles (users), active, chat_subtype, personal (chats), chat_ids, user_ids (messages) |  |



