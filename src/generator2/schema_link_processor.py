from .services.yaml_loader import YAML_DICT


def unite_schemas(schemas: list[dict], schema2: dict):
    for schema in schemas:
        schema2['type'] = schema2.get('type') or schema.get('type')
        required_proprties = schema2.get('required', [])
        required_proprties.extend(schema.get('required', []))
        schema2['required'] = list(set(required_proprties))
        if schema2['type'] == 'object':
            schema2['properties'] = (
                schema.get('properties', {}) | schema2.get('properties', {})
            )
        if schema2['type'] == 'array':
            if 'items' in schema2 and schema2['items'].get('properties'):
                required_proprties = schema2['items'].get('required', [])
                required_proprties.extend(schema['items'].get('required', []))
                schema2['required'] = list(set(required_proprties))
                schema2['items']['properties'] = (
                    schema.get('items').get('properties') | schema2.get('items').get('properties')
                )
            else:
                schema2['items'] = (
                    schema.get('items', {}) | schema2.get('items', {})
                )
    return schema2


def load_schema(path_to_schema: str, is_parameter: bool = False) -> dict:
    """Возвращает схему из ссылки."""
    schema_name = path_to_schema.split('/')[-1]
    if is_parameter:
        return YAML_DICT.get('components').get('parameters').get(schema_name)
    return YAML_DICT.get('components').get('schemas').get(schema_name)


def new_replace_ref_with_schema(schema: dict):
    if '$ref' in schema:
        return load_schema(schema['$ref'])

    if 'allOf' in schema:
        all_inherits = [new_replace_ref_with_schema(load_schema(ingerit['$ref'])) for ingerit in schema['allOf'] if '$ref' in ingerit]
        all_non_inherits = [ingerit for ingerit in schema['allOf'] if '$ref' not in ingerit]
        if not all_non_inherits:
            all_non_inherits = [{}]
        temp = all_non_inherits[0]
        temp = unite_schemas(all_inherits, temp)
        schema = temp
    schema_name = next(iter(schema.keys()))
    if 'allOf' in schema[schema_name]:
        schema[schema_name] = new_replace_ref_with_schema(schema[schema_name])
    return schema
