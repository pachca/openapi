import ast
import os
import shutil
import subprocess
import sys
from pathlib import Path

import yaml

sys.path.append(str(Path(__file__).parent.parent))

from jinja2 import Environment, FileSystemLoader  # noqa

from generator1 import BASE_DIR, PACKAGE_NAME, PROJECT_NAME  # noqa


def extract_functions_and_imports_from_file(file_path) -> None:
    with open(file_path, encoding='utf-8') as file:
        tree = ast.parse(file.read())

    functions = []
    imports = []

    for node in ast.walk(tree):
        if isinstance(node, ast.AsyncFunctionDef) or isinstance(
            node,
            ast.FunctionDef,
        ):
            functions.append(ast.unparse(node))
        elif isinstance(node, ast.ImportFrom):
            module = node.module if node.module else '.'
            for alias in node.names:
                if module == 'typing':
                    imports.append(f'from typing import {alias.name}')
                elif module.startswith('models'):
                    imports.append(f'from .models import {alias.name}')
                elif module == 'types':
                    imports.append(f'from .types import {alias.name}')
                elif module == 'client_serv':
                    imports.append(f'from .client_serv import {alias.name}')
                else:
                    imports.append(f'from {module} import {alias.name}')

    return functions, imports


def get_all_api_functions_and_imports(api_dir):
    all_functions = []
    all_imports = []
    for root, _, files in os.walk(api_dir):
        for file in files:
            if file.endswith('.py'):
                file_path = os.path.join(root, file)
                functions, imports = extract_functions_and_imports_from_file(
                    file_path,
                )
                all_functions.extend(functions)
                all_imports.extend(imports)
    return all_functions, all_imports


def get_base_url_from_yaml(openapi_yaml):
    with open(os.path.join(BASE_DIR, openapi_yaml), encoding='utf-8') as file:
        data = yaml.safe_load(file)
    return data['servers'][0]['url']


api_dir = os.path.join(
    BASE_DIR,
    PROJECT_NAME,
    PACKAGE_NAME,
    'api',
)
openapi_yaml = 'openapi.yaml'
endpoints, imports = get_all_api_functions_and_imports(api_dir)
base_url = get_base_url_from_yaml(openapi_yaml)
env = Environment(
    loader=FileSystemLoader(os.path.join(BASE_DIR, 'templates')),
)

client_template = env.get_template('client.py.jinja')

client_path = os.path.join(
    BASE_DIR,
    PROJECT_NAME,
    PACKAGE_NAME,
    'client.py',
)

with open(client_path, mode='w', encoding='utf-8') as file:
    unique_imports = list(set(imports))
    models_imports = sorted(
        [
            model
            for model in unique_imports
            if model.startswith(
                'from .models',
            )
        ],
    )
    typing_imports = sorted(
        [
            model
            for model in unique_imports
            if model.startswith(
                'from typing import',
            )
        ],
    )
    types_imports = sorted(
        [
            model
            for model in unique_imports
            if model.startswith(
                'from .types import',
            )
        ],
    )
    other_imports = sorted(
        list(
            set(unique_imports)
            - set(typing_imports)
            - set(types_imports)
            - set(models_imports),
        ),
    )
    if models_imports:
        models_imports_str = (
            'from .models import (\n    '
            + ',\n    '.join(
                [
                    model.split(
                        'from .models import ',
                    )[-1]
                    for model in models_imports
                ],
            )
            + '\n)'
        )
        file.write(models_imports_str + '\n\n')
    if typing_imports:
        typing_imports_str = (
            'from typing import (\n    '
            + ',\n    '.join(
                [
                    model.split(
                        'from typing import ',
                    )[-1]
                    for model in typing_imports
                ],
            )
            + '\n)'
        )
        file.write(typing_imports_str + '\n\n')
    if types_imports:
        types_imports_str = (
            'from .types import (\n    '
            + ',\n    '.join(
                [
                    model.split(
                        'from .types import ',
                    )[-1]
                    for model in types_imports
                ],
            )
            + '\n)'
        )
        file.write(types_imports_str + '\n\n')
    if other_imports:
        file.write('\n'.join(other_imports) + '\n\n')
    file.write(client_template.render(endpoints=endpoints, base_url=base_url))

cli_servis_path = os.path.join(
    BASE_DIR,
    PROJECT_NAME,
    PACKAGE_NAME,
    'client_serv.py',
)

logger_setup_path = os.path.join(
    BASE_DIR,
    PROJECT_NAME,
    PACKAGE_NAME,
    'logger_setup.py',
)

source_file_serv = os.path.join(
    BASE_DIR,
    'client_servis.py',
)
shutil.copy(source_file_serv, cli_servis_path)

source_file_log = os.path.join(
    BASE_DIR,
    'logger_setup.py',
)
shutil.copy(source_file_log, logger_setup_path)

try:
    subprocess.run(
        [
            'black',
            (
                os.path.join(
                    BASE_DIR,
                    PROJECT_NAME,
                    PACKAGE_NAME,
                    'client.py',
                )
            ),
            '--line-length',
            '79',
        ],
        check=True,
    )
    subprocess.run(
        [
            'isort',
            (
                os.path.join(
                    BASE_DIR,
                    PROJECT_NAME,
                    PACKAGE_NAME,
                    'client.py',
                )
            ),
        ],
    )
except subprocess.CalledProcessError as e:
    print('Автолинтер не сработал!', e)
