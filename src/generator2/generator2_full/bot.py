import httpx

from .constants import PARAM_NAME_SORT, PARAM_NAME_SORT_FIELD, TOKEN_TYPE, URL
from .request_methods import RequestMethods


class Bot(RequestMethods):
    base_url = URL
    token_type = TOKEN_TYPE

    def __init__(self, token):
        self.token = f'{self.token_type} {token}'

    async def get_client(self):
        return httpx.AsyncClient(
            base_url=self.base_url,
            headers={'Authorization': self.token},
        )

    async def format_url(
        self,
        url_template: str,
        path_param: dict[str, int] = None,
    ):
        return url_template.format(**path_param)

    async def filter_query_params(self, **kwargs):
        if PARAM_NAME_SORT in kwargs or PARAM_NAME_SORT_FIELD in kwargs:
            sort = kwargs.pop(PARAM_NAME_SORT)
            sort_field = kwargs.pop(PARAM_NAME_SORT_FIELD)
            kwargs[f'sort[{sort_field}]'] = sort

        return {
            str(key): value
            for key, value in kwargs.items() if value is not None
        }
