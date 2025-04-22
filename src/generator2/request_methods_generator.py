import os
import re
import textwrap
from typing import Union

from httpx import codes
from openapi_parser import parse
from openapi_parser.specification import (DataType, Operation, Parameter, Path,
                                          Specification)

from .services.constants import (DEFAULT_VALUE_SORT_FIELD,
                                 GENERATED_CLIENT_FOLDER, PARAM_DEFAULT_KEY,
                                 PARAM_LOCATION_PATH, PARAM_LOCATION_QUERY,
                                 PARAM_NAME_SORT, PARAM_NAME_SORT_FIELD,
                                 PARAM_TYPE_KEY, PREFIX_REQUEST,
                                 PREFIX_RESPONSE, SCHEMA_SORT_ID,
                                 SPECIFICATION_FILE_NAME,
                                 TEMPLATE_CLASS_REQUEST_METHODS,
                                 TYPE_SORT_FIELD)


def format_path_params(param_path: dict[str, Union[str, dict]]) -> str:
    """Форматирует параметры пути для использования в функции."""
    return (
        ", ".join(
            [f"'{name}': {name}" for name in param_path]
        ) if param_path else ""
    )


def format_query_params(param_query: dict[str, Union[str, dict]]) -> str:
    """Форматирует параметры запроса для использования в функции."""
    return ", ".join([
        f"{name}={name}" for name in param_query.keys()
    ]) if param_query else ""


def generate_url_template(
        url: str, param_path: dict[str, Union[str, dict]]
) -> str:
    """Генерирует строку с форматированным URL для функции."""
    if param_path:
        path_params = format_path_params(param_path)
        return f"url = await self.format_url('{url}', {{{path_params}}})"
    return f"url = '{url}'"


def generate_function_params(
    param_path: dict[str, Union[str, dict]] = None,
    param_query: dict[str, Union[str, dict]] = None,
    name_request_scheme: str = None,
) -> str:
    """Генерирует список параметров для функции."""
    function_params = []

    if param_path:
        function_params.extend(
            [
                f'{name}: {type_param}'
                for name, type_param in param_path.items()
            ]
        )
    if param_query:
        for name, data_param in param_query.items():
            type_param = data_param['type']
            default_value = data_param['default']
            if name in {'sort', 'sort_field'}:
                default_value = f"'{default_value}'"
            function_params.append(f'{name}: {type_param} = {default_value}')

    if name_request_scheme:
        return ", ".join(
            ["self", f"data: {name_request_scheme}"] + function_params
        )
    return ", ".join(["self"] + function_params)


def generate_request_handling(
    method_request: str,
    name_request_scheme: str = None,
    param_query: dict[str, Union[str, dict]] = None,
) -> str:
    """Генерирует логику отправки запроса в зависимости от параметров."""
    if name_request_scheme:
        return (
            f'response = await client.{method_request}'
            '(url, json=data.model_dump())'
        )
    if param_query:
        return (
            f'response = await client.{method_request}'
            '(url, params=query_params)'
        )
    return f"response = await client.{method_request}(url)"


def generate_response_handling(
    name_response_scheme: str = None,
    name_error_scheme: str = None,
) -> str:
    """Генерирует логику обработки ответа от сервера."""
    response_handling = ""
    if name_response_scheme:
        response_handling += (
            '\n            if response.is_success:\n'
            f'              return {name_response_scheme}'
            '.model_validate_json(response.text)'
        )
    if name_error_scheme:
        response_handling += (
            '\n            if response.is_client_error:\n'
            f'              return {name_error_scheme}'
            '.model_validate_json(response.text)'
        )
    return response_handling


def get_template_methods(
        name_func: str,
        url: str,
        method_request: str,
        docstring: str,
        param_path: dict[str, Union[str, dict]] = None,
        param_query: dict[str, Union[str, dict]] = None,
        name_request_scheme: str = None,
        name_response_scheme: str = None,
        name_error_scheme: str = None,
) -> str:
    """Возвращает шаблон генерируемой функции."""
    function_params = generate_function_params(
        param_path, param_query, name_request_scheme
    )
    format_url = generate_url_template(url, param_path)
    filter_params = format_query_params(param_query)
    request_handling = generate_request_handling(
        method_request, name_request_scheme, param_query
    )
    response_handling = generate_response_handling(
        name_response_scheme, name_error_scheme
    )
    response_annotation = (
        f" -> {name_response_scheme}" if name_response_scheme else ""
    )
    filter_params_code = (
        f"\n            query_params = await self.filter_query_params"
        f"({filter_params})"
        if filter_params else ""
    )

    return f"""

    async def {name_func}({function_params}){response_annotation}:
        {docstring}
        client = await self.get_client()
        async with client:
            {format_url}{filter_params_code}
            {request_handling}{response_handling}
            return None
"""


def format_docstring(summary: str, description: str, max_width: int = 79):
    """Редактирует длины строк докстринг
    генерируемых функций в соответствиие с PEP8
    """
    formatted_summary = "\n".join(textwrap.wrap(summary, width=max_width))
    formatted_description = "\n".join(
        textwrap.wrap(description, width=max_width),
    )
    return f'"""{formatted_summary}\n\n{formatted_description}"""'


def format_name_func(operation_id: str):
    """Возвращает название генерируемой функции запроса в требуемом формате"""
    return '_'.join(
        re.findall(r'[a-z]+|[A-Z][^A-Z]*', operation_id),
    ).lower()


def get_python_type(schema_type: DataType):
    """Сопоставляет текущий тип данных параметра с типом данных Python
    и возвращает его
    """
    type_mapping = {
        DataType.STRING: "str",
        DataType.INTEGER: "int",
        DataType.NUMBER: "float",
        DataType.BOOLEAN: "bool",
        DataType.ARRAY: "list",
        DataType.OBJECT: "dict",
    }

    return type_mapping.get(schema_type, None)


def import_string_generation(
        prefix: str,
        operation_id: str,
        schema: str,
        code: str = None,
        method: str = None
) -> str:
    """Возвращает шаблон строки импорта"""
    if prefix == PREFIX_RESPONSE:
        return (
            f'from .models.{prefix}{operation_id}'
            f'{method}{code} import {schema}'
        )
    if prefix == PREFIX_REQUEST:
        return f'from .models.{prefix}{operation_id} import {schema}'


def process_operation(operation: Operation) -> tuple[str]:
    """Обрабатывает объект Operation и возвращает кортеж значений:
    - method метод запроса операции
    - operation_id уникальный идентификатор операции
    - operation.summary краткое описание операции
    - operation.description развернутое описание операции
    - name_request_scheme сгенерированое название схемы объекта передаваемого
      в запросе
    - name_response_scheme сгенерированое название схемы возвращаемого объекта
    - name_error_scheme сгенерированое название схемы объекта ошибки
    - import_template Список строк для импортов используемых моделей схем."""
    import_template = []
    name_request_scheme = None
    name_response_scheme = None
    name_error_scheme = None

    method = operation.method.value
    operation_id = operation.operation_id

    if operation.request_body:
        name_request_scheme = operation_id.capitalize()
        import_template.append(
            import_string_generation(
                prefix=PREFIX_REQUEST,
                operation_id=operation_id,
                schema=name_request_scheme
            )
        )
    for response in operation.responses:
        if codes.is_success(response.code) and response.content:
            name_response_scheme = (
                f'Response{operation_id.capitalize()}'
                f'{operation.method.value.capitalize()}'
                f'{str(response.code).capitalize()}'
            )
            import_template.append(
                import_string_generation(
                    prefix=PREFIX_RESPONSE,
                    operation_id=operation_id,
                    schema=name_response_scheme,
                    code=response.code,
                    method=method,
                )
            )
        if codes.is_client_error(response.code):
            name_error_scheme = (
                f'Response{operation_id.capitalize()}'
                f'{operation.method.value.capitalize()}'
                f'{str(response.code).capitalize()}'
            )
            import_template.append(
                import_string_generation(
                    prefix=PREFIX_RESPONSE,
                    operation_id=operation_id,
                    schema=name_error_scheme,
                    code=response.code,
                    method=method,
                )
            )

    return (
        method, operation_id, operation.summary, operation.description,
        name_request_scheme, name_response_scheme, name_error_scheme,
        import_template
    )


def process_parameters(parameters: list[Parameter]) -> tuple[dict, dict]:
    """Обрабатывает параметры запроса и возвращает два словаря:
    - param_path: параметры, относящиеся к пути (path).
    - param_query: параметры, относящиеся к строке запроса (query)"""
    param_path = {}
    param_query = {}

    for param in parameters:
        if param.location.value == PARAM_LOCATION_PATH:
            schema_type = get_python_type(param.schema.type)
            param_path[param.name] = schema_type
        if param.location.value == PARAM_LOCATION_QUERY:
            schema_type = get_python_type(param.schema.type)
            if param.name == SCHEMA_SORT_ID:
                default_value_sort = param.schema.default
                param.name = PARAM_NAME_SORT
                param_query[PARAM_NAME_SORT_FIELD] = {
                    PARAM_TYPE_KEY: TYPE_SORT_FIELD,
                    PARAM_DEFAULT_KEY: DEFAULT_VALUE_SORT_FIELD
                }
                param_query[param.name] = {
                    PARAM_TYPE_KEY: schema_type,
                    PARAM_DEFAULT_KEY: default_value_sort
                }
                continue
            param_query[param.name] = {
                PARAM_TYPE_KEY: schema_type,
                PARAM_DEFAULT_KEY: None,
            }

    return param_path, param_query


def template_generation(paths: list[Path]) -> tuple[list[str]]:
    """Собирает параметры запроса всех paths спецификации
    передает их в функицю get_template_methods
    Возвращает кортеж состоящий из:
    - templates список шаблонов методов запроса
    - import_templates список шаблонов импортов
    """
    templates = []
    import_templates = []

    for path in paths:
        url = path.url
        for operation in path.operations:
            (
                method,
                operation_id,
                summary,
                description,
                name_request_scheme,
                name_response_scheme,
                name_error_scheme,
                import_template,
            ) = process_operation(operation)

            import_templates.extend(import_template)

            method_request = method.lower()
            function_name = format_name_func(operation_id)
            docstring = format_docstring(summary, description)

            param_path, param_query = process_parameters(operation.parameters)

            templates.append(
                get_template_methods(
                    function_name,
                    url,
                    method_request,
                    docstring,
                    param_path,
                    param_query,
                    name_request_scheme,
                    name_response_scheme,
                    name_error_scheme
                ),
            )

    return templates, import_templates


def get_obj_openapi_spec(
        path_to_file=SPECIFICATION_FILE_NAME,
) -> Specification:
    """Читает спецификацию openapi из файла openapi.yaml и возвращает
    спецификацию в виде объекта Specification библиотеки openapi_parser
    """
    base_dir = os.path.dirname(os.path.abspath(__file__))
    full_path = os.path.join(base_dir, path_to_file)

    with open(full_path, 'r', encoding='utf-8') as file:
        spec_openapi = file.read()

    return parse(spec_string=spec_openapi)


def generation_class_bot(
    templates: list,
    import_templates: list,
    file=f'./{__package__}/{GENERATED_CLIENT_FOLDER}/request_methods.py',
):
    with open(
        file, 'w', encoding='utf-8',
    ) as file:
        for module_name in import_templates:
            file.write(f'{module_name}\n')
        file.write(f'{TEMPLATE_CLASS_REQUEST_METHODS}')
        for template in templates:
            file.write(template)


def generate():
    spec: Specification = get_obj_openapi_spec()
    paths: list[Path] = spec.paths

    templates, import_templates = template_generation(paths)

    generation_class_bot(
        templates=templates, import_templates=import_templates
    )


if __name__ == "__main__":
    generate()
