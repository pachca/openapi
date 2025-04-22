import asyncio
import os

from dotenv import load_dotenv

from .bot import Bot
from .logger_setup import setup_logging
from .models.models_reqBod_createChat import Createchat
from .models.models_reqBod_createMessage import Createmessage, Message
from .models.models_reqBod_createTask import Createtask
from .models.models_reqBod_editMessage import Editmessage
from .models.models_reqBod_postMembersToChats import Postmemberstochats
from .models.models_reqBod_postMessageReactions import Postmessagereactions
from .models.models_reqBod_putStatus import Putstatus

load_dotenv()

logger = setup_logging('pachca_log')

if __name__ == '__main__':
    pachca = Bot(token=f'{os.environ.get("TOKEN", "LOOKUP FAILED!")}')

    message_test = Createmessage(message=Message(
        entity_type="discussion",
        entity_id=17579010,
        content=("Вчера мы продали 756 футболок "
                 "(что на 10% больше, чем в прошлое воскресенье)"),
    ))
    async def run_pachca():

        # Получение common methods
        logger.debug(f'get_common_methods: {await pachca.get_common_methods()}')
        # Создание беседы.
        created_chat = await pachca.create_chat(
            data=Createchat(
                chat={
                    'name': 'Тестовая беседа 31',
                    'channel': False,
                    'public': True,
                },
            ),
        )
        logger.debug(f'create_chat: {created_chat}')

        # Получение всех бесед данного рабочего пространства
        all_chats = await pachca.get_chats()
        logger.debug(f'get_chats: {all_chats}')

        # Получение конкретной беседы по id
        chat = await pachca.get_chat(created_chat.data.id)
        logger.debug(f'get_chat: {chat}')

        # Подключение пользователей к беседе.
        response_post_members = await pachca.post_members_to_chats(
            id=chat.data.id,
            data=Postmemberstochats(
                member_ids=[518863],
                silent=False,
            ),
        )
        logger.debug(f'post_members_to_chats: {response_post_members}')

        # Получение всех бесед данного рабочего пространства (на одну больше)
        all_chats = await pachca.get_chats()
        logger.debug(f'get_chats: {all_chats}')

        # Создание нового сообщения в беседе.
        response_create_message = await pachca.create_message(
            data=Createmessage(
                message={
                    'content': f'Запощеное сообщение в беседу {chat.data.id}',
                    'entity_type': 'discussion',
                    'entity_id': chat.data.id,
                },
            ),
        )
        logger.debug(f'create_message: {response_create_message}')

        # Получение списка тегов
        logger.debug(f'get_tags: {await pachca.get_tags()}')

        # Создание треда к конкретному сообщению с id.
        response_create_thread = await pachca.create_thread(
            id=response_create_message.data.id,
        )
        logger.debug(f'create_thread: {response_create_thread}')

        # Создание комментария в треде другого сообщения
        response_create_message_in_thread = await pachca.create_message(
            data=Createmessage(
                message={
                    'content': (
                        'Новое сообщение в тред'
                        f'{response_create_thread.data.id}'
                    ),
                    'entity_type': 'thread',
                    'entity_id': response_create_thread.data.id,
                },
            ),
        )
        logger.debug(f'create_message_in_thread: {response_create_message_in_thread}')

        # Получение списка всех сообщений конкретного треда или беседы с пагинацией
        response_list_messages = await pachca.get_list_message(
            chat_id=response_create_thread.data.chat_id, per=10, page=1,
        )
        logger.debug(f'get_list_message: {response_list_messages}')

        # Получение конкретного сообщения по id
        response_get_message = await pachca.get_message(
            id=response_create_message_in_thread.data.id,
        )
        logger.debug(f'get_message: {response_get_message}')

        # Редактирование конкретного сообщения по его id
        response_edit_message = await pachca.edit_message(
            id=response_create_message_in_thread.data.id,
            data=Editmessage(message={
                'content': ('РЕДАКТИРОВАНИЕ СООБЩЕНИЯ '
                            f'{response_create_message_in_thread.data.id} '
                            'ЧЕРЕЗ АПИ СОВЕРШЕНО УСПЕШНО'),
            }),
        )
        logger.debug(f'edit_message: {response_edit_message}')

        # Добавление реакции к сообщению с id
        response_add_reaction = await pachca.post_message_reactions(
            id=response_edit_message.data.id,
            data=Postmessagereactions(code='👍'),
        )
        response_add_reaction = await pachca.post_message_reactions(
            id=response_edit_message.data.id,
            data=Postmessagereactions(code='😱'),
        )
        logger.debug(f'post_message_reactions: {response_add_reaction}')

        # Получение списка всех реакций конкретного сообщения.
        response_message_reactions = await pachca.get_message_reactions(
            id=response_edit_message.data.id,
        )
        logger.debug(f'get_message_reactions: {response_message_reactions}')

        # Удаение конкретной реакции у конкретного сообщения.
        response_delete_reaction = await pachca.delete_message_reactions(
            id=response_edit_message.data.id,
            code='😱',
        )
        logger.debug(f'delete_message_reactions: {response_delete_reaction}')

        # Создание напоминания
        response_create_task = await pachca.create_task(
            data=Createtask(
                task={
                    'kind': 'reminder',
                    'content': 'дата в прошлом',
                    'priority': 3,
                    'due_at': '2025-12-24T18:00:29.000Z',
                },
            ),
        )
        logger.debug(f'create_task: {response_create_task}')

        # Метод для того чтобы покинуть конкретный чат (беседу)
        response_leave_chat = await pachca.leave_chat(
            id=created_chat.data.id
        )
        logger.debug(f'leave_chat: {response_leave_chat}')

        response_get_users = await pachca.get_employees()
        logger.debug(f'One user from list: {response_get_users.data[0].id}')

        # Получить конкретного сотрудника рабочего простанства.
        response_get_user = await pachca.get_employee(
            response_get_users.data[0].id,
        )
        logger.debug(f'get_employee: {response_get_user}')

        # Добавить статус текущему пользователю, обладателю токена.
        response_put_status = await pachca.put_status(
            data=Putstatus(
                status={
                    'emoji': '😱',
                    'expires_at': '2025-12-24T17:47:25.000Z',
                    'title': 'Статус из клиента АПИ',
                },
            ),
        )
        logger.debug(f'put_status: {response_put_status}')

        # Получить статус текущего пользователя, обладателя токена.
        response_get_status = await pachca.get_status()
        logger.debug(f'get_status: {response_get_status}')

        # Удалить статус текущему пользователю, обладателю токена.
        response_del_status = await pachca.del_status()
        logger.debug(f'del_status: {response_del_status}')

        # Получения подписи и ключа для загрузки файла
        response_get_uploads = await pachca.get_uploads()
        logger.debug(f'del_status: {response_get_uploads}')

        response_get_tags_employees = await pachca.get_tags_employees(
            id=1234
        )
        logger.debug(f'get_tags_employees: {response_get_tags_employees}')

        response_get_tag = await pachca.get_tag(
            id=1234
        )
        logger.debug(f'get_tag: {response_get_tag}')

        logger.debug('*' * 60)

    asyncio.run(run_pachca())
