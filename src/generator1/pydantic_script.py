import os
import sys
from pathlib import Path

sys.path.append(str(Path(__file__).parent.parent))

from generator1 import BASE_DIR, PACKAGE_NAME, PROJECT_NAME  # noqa


def correcting_imports_in_model_files(file_path):
    with open(file_path, encoding="utf-8") as file:
        content = file.readlines()

    new_content = []
    skip_next_lines = False

    for line in content:
        # Проверяем, является ли строка условием TYPE_CHECKING
        if line.strip() == "if TYPE_CHECKING:":
            skip_next_lines = True
            continue  # Пропускаем эту строку

        # Если мы пропускаем строки, значит это импорты
        if skip_next_lines:
            if line.strip():  # Если строка не пустая
                new_content.append(line.lstrip())  # Сдвигаем влево
        else:
            new_content.append(line)  # Добавляем строку как есть

        # Если встретили пустую строку, значит закончили с импортами
        if line.strip() == "":
            skip_next_lines = False

    # Записываем изменения обратно в файл
    with open(file_path, "w", encoding="utf-8") as file:
        file.writelines(new_content)


def changes_all_model_files(directory):
    for filename in os.listdir(directory):
        if filename.endswith(".py"):
            correcting_imports_in_model_files(
                os.path.join(directory, filename)
            )


changes_all_model_files(os.path.join(
    BASE_DIR, PROJECT_NAME, PACKAGE_NAME, 'models'
))
