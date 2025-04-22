import errno
import os
import os.path
import pathlib

from .constants import GENERATED_CLIENT_FOLDER


def mkdir_p(path):
    try:
        os.makedirs(path)
    except OSError as exc: # Python >2.5
        if exc.errno == errno.EEXIST and os.path.isdir(path):
            pass


def safe_open_w(path, mode: str):
    ''' Open "path" for writing, creating any parent directories as needed.
    '''
    mkdir_p(os.path.dirname(path))
    return open(path, mode, encoding='utf-8')


def write_to_file(
    file_name: str, text_to_write: str, folder_name: str = 'models',
    open_file_mode: str = 'a'
):
    """Записывает текст в файл."""
    with safe_open_w(
        (pathlib.Path(__file__).parent.parent.resolve()
         / GENERATED_CLIENT_FOLDER / folder_name / f'{file_name}.py'),
        open_file_mode
    ) as f:
        f.write(text_to_write)


if __name__ == '__main__':
    write_to_file('model_users.py', '\n\nANOTHER CODE HERE')
