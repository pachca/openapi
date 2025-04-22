from .schema_link_processor import load_schema, new_replace_ref_with_schema
from .services.constants import ENUM_TYPES, PYTHON_TYPES
from .services.file_writer import write_to_file


def check_error_field(model_name: str, field_name: str, field_type: str):
    """Заменяет для специфичных полей тайпхинт на Any."""
    if model_name != 'Errors':
        return field_type
    if field_name != 'value':
        return field_type
    return 'Any'


def create_model(name: str, fields: list) -> str:
    """Генерирует код модели Pydantic."""
    model_code = f'class {name}(BaseModel):\n'
    alias = ''
    for field in fields:
        field_name = field[0]
        if '-' in field[0]:
            alias = f', alilas=\'{field[0]}\''
            field_name = field_name.replace('-', '_')
        else:
            alias = ''

        if field[2]:
            model_code += (
                f'    {field_name}: '
                f'{check_error_field(name, field_name, field[1])} '
                f'= Field(..., description=\'{field[3]}\'{alias})\n'
            )
        else:
            model_code += (
                f'    {field_name}: '
                f'Optional[{check_error_field(name, field_name, field[1])}] '
                f'= Field(None, description=\'{field[3]}\'{alias})\n'
            )
    return model_code


def create_enum(name: str, enum_type: str, fields: list):
    """Создает классы Enum."""
    enum_class_code = f'class enum_{name}({ENUM_TYPES.get(enum_type)}):\n'
    if enum_type == 'string':
        for field in fields:
            enum_class_code += f'    {field} = \'{field}\'\n'
    if enum_type == 'integer':
        for field in fields:
            enum_class_code += f'    {name}_{field} = {field}\n'
    return enum_class_code


def look_into_schema_new(schema: dict, file_name: str):
    """Разбирает схемы и вызывает генерацию моделей."""
    schema = new_replace_ref_with_schema(schema)
    list_of_properties = []
    nested_properties = []
    enum_properties = []
    required_properties = []
    upper_schema_name = list(schema.keys())[0]
    inner_schema = (
        schema.get(upper_schema_name).get('properties')
        or schema.get(upper_schema_name).get('items', {}).get('properties')
        or schema.get(upper_schema_name).get(
            'items',{}).get('items', {}).get('properties'))
    required_properties = schema.get(upper_schema_name).get('required', [])
    for property in inner_schema:
        inner_body = new_replace_ref_with_schema(inner_schema.get(property))
        if 'enum' in inner_body:
            enum_properties.append(
                (property, inner_body.get('type'),  inner_body['enum']),
            )
        inner_schema[property] = inner_body

        if inner_body.get('items', {}).get('$ref'):
            inner_schema[property] = load_schema(inner_body.get('items', {}).get('$ref'))
        description = inner_body.get('description', 'No docstring provided')
        property_type = (
            PYTHON_TYPES.get(inner_body.get('type')) or inner_body.get('type'))
        if property_type is None:
            property_type = (
                [item.get('type') for item
                 in inner_body.get('allOf')
                 if '$ref' not in item][0]
            )
        if 'enum' in inner_body:
            property_type = f'enum_{property}'
        if property_type == 'object':
            property_type = property.capitalize()
        if property_type == 'array':
            list_type = inner_body.get("items").get("type")
            list_type = PYTHON_TYPES.get(list_type, list_type)
            if list_type is None:
                list_type = next(iter(inner_schema.keys())).capitalize()
            if list_type == 'object' or list_type == 'array':
                list_type = property.capitalize()
            if inner_body.get("items").get("items"):
                list_type = f'List[{list_type}]'
            property_type = (f'List[{list_type}]')
        if property_type == 'Payload':
            property_type = 'Dict'
        list_of_properties.append(
            (
                property,
                property_type,
                True if property in required_properties else False,
                description.replace('\n', ''),
            ),
        )
        if ('allOf' in inner_body
           or inner_body.get('type') == 'object'
           and inner_body.get('properties')
           or inner_body.get('type') == 'array'
           and inner_body.get('items', {}).get('properties')
           or inner_body.get('items', {}).get('$ref')
           or inner_body.get('items', {}).get('items')):
            nested_properties.append(property)

    for nested in nested_properties:
        nested_obj = new_replace_ref_with_schema(inner_schema)
        if nested in nested_obj:
            look_into_schema_new(
                {nested.capitalize(): nested_obj[nested]},
                file_name=file_name
            )
        else:
            look_into_schema_new(nested_obj, file_name=file_name)

    for enum_class in enum_properties:
        write_to_file(file_name, create_enum(*enum_class) + '\n\n')
    write_to_file(
        file_name,
        create_model(upper_schema_name, list_of_properties) + '\n\n')
