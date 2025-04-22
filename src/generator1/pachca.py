import asyncio
import datetime
import os

from dotenv import load_dotenv
from pachca_api.client import Pachca
from pachca_api.logger_setup import setup_logging
from pachca_api.models import (CreateTaskBodyTask, EditMessageBody,
                               EditMessages, GroupTag, MembersChat,
                               QueryStatusStatus)
from pachca_api.models.base_chat import BaseChat
from pachca_api.models.code_reaction import CodeReaction
from pachca_api.models.create_chat_body import CreateChatBody
from pachca_api.models.create_message_body import CreateMessageBody
from pachca_api.models.create_messages import CreateMessages
from pachca_api.models.create_task_body import CreateTaskBody

load_dotenv()
pachca = Pachca(os.getenv('TOKEN'))

logger = setup_logging(
    'test_requests_logging',
    'pachca_testresults.log',
)


async def main() -> None:
    """Функция теста эндпоинтов"""

    # подготовка запроса на создание беседы -->
    query_chat = BaseChat(name='test500_2')
    chat_body = CreateChatBody(chat=query_chat)
    # <--
    # запрос на создание беседы
    chat_create = asyncio.create_task(pachca.createChat(body=chat_body))
    chat_response = await chat_create

    # запрос на получение списка бесед и каналов
    create_task = await asyncio.create_task(pachca.getChats())

    # запрос на получение информации о беседе
    getChat = await asyncio.create_task(
        pachca.getChat(id=chat_response.data.id),
    )
    # подготовка запроса на создание сообщения в созданную беседу -->
    create_message = CreateMessages(
        entity_id=chat_response.data.id,
        content='Super puper',
    )
    message_body = CreateMessageBody(message=create_message)
    # <--
    # запрос на создание сообщения в созданную беседу
    message_create = asyncio.create_task(
        pachca.createMessage(body=message_body),
    )
    message_response = await message_create
    # создание треда к созданному сообщению
    thread_create = asyncio.create_task(
        pachca.createThread(id=message_response.data.id),
    )
    # запрос на получение списка сообщений
    getListMessage = await asyncio.create_task(
        pachca.getListMessage(chat_id=chat_response.data.id),
    )

    # запрос на получение сообщения
    getMessage = await asyncio.create_task(
        pachca.getMessage(id=message_response.data.id),
    )

    # подготовка запроса на редактирование сообщения -->
    edit_meassage = EditMessages(content='NOT SUPER PUPER')
    edit_message_body = EditMessageBody(message=edit_meassage)
    # <--
    # запрос на редактирование сообщения
    editMessage = await asyncio.create_task(
        pachca.editMessage(
            id=message_response.data.id,
            body=edit_message_body,
        ),
    )

    # подготовка запроса на добавление реакции к сообщению -->
    post_reactions = CodeReaction(code='😭')
    # <--
    # запрос на добавление реакции к сообщению
    postMessageReactions = await pachca.postMessageReactions(
        id=message_response.data.id,
        body=post_reactions,
    )

    # подготовка запроса на получение списка реакций к сообщению -->
    # <--
    # запрос на получение списка реакций
    getMessageReactions = await pachca.getMessageReactions(
        id=message_response.data.id,
    )

    # запрос на удаление реакции
    deleteMessageReactions = await pachca.deleteMessageReactions(
        id=message_response.data.id,
        code='😭',
    )

    # подготовка запроса на создание напоминания -->
    create_body_task = CreateTaskBodyTask(
        kind='call',
        content='Звонок другу',
        due_at=datetime.datetime.now(),
    )
    body_task = CreateTaskBody(task=create_body_task)
    # <--
    # запрос на создание напоминания
    createtaskbody = await asyncio.create_task(
        pachca.createTask(body=body_task),
    )

    # запрос на получения списка пользователей
    # users_response = await asyncio.create_task(pachca.getEmployees())

    # запрос на получение информации о пользователе
    # getEmployee = await asyncio.create_task(
    #     pachca.getEmployee(id=users_response.data[0].id)
    # )

    # подготовка запроса на добавление участника -->
    # chats_body = MembersChat(member_ids=[users_response.data[0].id])
    # <--
    # запрос на добавление участника в беседу
    # postMembersToChats = await asyncio.create_task(pachca.postMembersToChats(
    #     id=chat_response.data.id, body=chats_body)
    # )

    # подготовка запроса на добавление статуса -->
    query_status = QueryStatusStatus(
        emoji='😭',
        title='Я не плачу это просто слезы',
        expires_at=None,
    )
    # <--
    # запрос на добавление статуса
    putStatus = await asyncio.create_task(pachca.putStatus(body=query_status))

    # запрос на получение информации о своем статусе
    getStatus = await asyncio.create_task(pachca.getStatus())

    # запрос на удаление статуса
    delStatus = await asyncio.create_task(pachca.delStatus())

    # запрос на получение тегов сотрудников
    getTags = await asyncio.create_task(pachca.getTags())

    if len(getTags.data) > 0:
        tag_id = getTags.data[0].id
    else:
        tag_id = 0
    # запрос получение информации о теге
    getTag = await asyncio.create_task(pachca.getTag(id=tag_id))

    # запрос получение информации о теге участников
    getTagsEmployees = await asyncio.create_task(
        pachca.getTagsEmployees(id=tag_id),
    )

    # подготовка запроса на добавление участника -->
    tags_body = GroupTag(group_tag_ids=[tag_id])
    # <--
    # запрос на добавление тегов в состав участников беседы или канала
    postTagsToChats = await asyncio.create_task(
        pachca.postTagsToChats(id=chat_response.data.id, body=tags_body),
    )

    # запрос на получение списка актуальных полей сущности
    getCommonMethods = await asyncio.create_task(
        pachca.getCommonMethods(entity_type='User'),
    )

    # запрос получения подписи и ключа для загрузки файла
    getUploads = await asyncio.create_task(pachca.getUploads())

    # запрос исключение участника из беседы
    leaveChat = await asyncio.create_task(
        pachca.leaveChat(id=chat_response.data.id),
    )

    logger.debug(await pachca.getUploads())

    for task in (
        chat_response,
        create_task,
        getChat,
        message_response,
        thread_create,
        getListMessage,
        getMessage,
        editMessage,
        create_task,
        postMessageReactions,
        getMessageReactions,
        deleteMessageReactions,
        createtaskbody,
        # users_response,
        # getEmployee,
        # postMembersToChats,
        putStatus,
        getStatus,
        delStatus,
        getTags,
        getTag,
        getTagsEmployees,
        postTagsToChats,
        getCommonMethods,
        getUploads,
        leaveChat,
    ):
        result = task
        logger.debug(
            f'{task}: data={result} \n***',
        )
    logger.debug('Tests ended ' + '*' * 100)


if __name__ == '__main__':
    asyncio.run(main())
