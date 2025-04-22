import os
import subprocess

from .request_methods_generator import generate
from .services.constants import GENERATED_CLIENT_FOLDER
from .services.logger_setup import setup_logging
from .yaml_processor import process_endpoints


def generate_client():
    logger = setup_logging('client_generator')

    try:
        process_endpoints()
    except Exception as ex:
        logger.critical('Unable to create pydantic models! '
                        f'Error: {ex}')

    try:
        generate()
    except Exception as ex:
        logger.critical('Unable to create endpoints! '
                        f'Error: {ex}')

    dir_path = (
        os.path.dirname(os.path.realpath(__file__)) +
        f'/{GENERATED_CLIENT_FOLDER}'
    )
    logger.debug(f'Working directory: {dir_path}')
    try:
        subprocess.run(
            ['black', f'{dir_path}/models', '--line-length', '79'], check=True
        )
        subprocess.run(
            [
                'black',
                f'{dir_path}/request_methods.py',
                '--line-length',
                '79'
            ],
            check=True
        )
        logger.debug('Finished code formatting!')
        subprocess.run(
            [
                'ruff',
                'check',
                f'{dir_path}/models',
                '--fix',
                '--silent',
            ]
        )
        subprocess.run(
            [
                'ruff',
                'check',
                f'{dir_path}/request_methods.py',
                '--fix',
                '--silent'
            ]
        )
        logger.debug('Finished code fix with ruff!')
    except Exception as ex:
        logger.error(f'Unable to format or fix code: {ex}')


if __name__ == '__main__':
    generate_client()
