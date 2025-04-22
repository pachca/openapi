import os
import sys
from pathlib import Path

# PATH_TO_YAML = './openapi_test.yaml'
PATH_TO_YAML = (
    f'{Path(__file__).parent.parent.resolve()}/openapi.yaml')
SPECIFICATION_FILE_NAME = (
    f'{Path(__file__).parent.parent.resolve()}/openapi.yaml')

PYTHON_TYPES = {
    'string': 'str',
    'integer': 'int',
    'boolean': 'bool',
}

ENUM_TYPES = {
    'string': 'str, Enum' if sys.version_info[1] < 11 else 'StrEnum',
    'integer': 'IntEnum',
}

HTTP_METHODS = (
    'get', 'post', 'put', 'update', 'patch', 'delete',
)

PARAM_TYPE_KEY = 'type'
PARAM_DEFAULT_KEY = 'default'

SCHEMA_SORT_ID = 'sort[id]'
PARAM_NAME_SORT = 'sort'
PARAM_NAME_SORT_FIELD = 'sort_field'

PARAM_LOCATION_QUERY = 'query'
PARAM_LOCATION_PATH = 'path'

PREFIX_RESPONSE = 'models_response_'
PREFIX_REQUEST = 'models_reqBod_'

DEFAULT_VALUE_SORT_FIELD = 'id'
TYPE_SORT_FIELD = 'str'

BASE_DIR = Path(os.path.dirname(os.path.abspath(__file__))).parent
LOG_FILE_NAME = os.path.join(BASE_DIR, "client_generator.log")

GENERATED_CLIENT_FOLDER = 'generator2_full'

TEMPLATE_CLASS_REQUEST_METHODS = """
class RequestMethods:

    async def get_client(self):
        pass

    async def format_url(self):
        pass

    async def filter_query_params(self):
        pass
"""
