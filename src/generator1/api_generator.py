import os
import subprocess
import sys

from generator1.generator import BASE_DIR

generator_script_path = os.path.join(BASE_DIR, "generator.py")


def generate():
    command = [sys.executable, generator_script_path, "generate"]
    result = subprocess.run(command, check=True, shell=False, text=True)

    if result.returncode == 0:
        print("Команда выполнена успешно.")
    else:
        print("Ошибка выполнения команды:", result.returncode)


def test():
    command = [sys.executable, generator_script_path, "test"]
    result = subprocess.run(command, check=True, shell=False, text=True)

    if result.returncode == 0:
        print("Команда выполнена успешно.")
    else:
        print("Ошибка выполнения команды:", result.returncode)


def gen_and_test():
    generate()
    test()
