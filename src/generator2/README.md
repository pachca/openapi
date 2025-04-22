### Инструкция (работать в папке `src` при активированном venv):

1. Создать файл .env в директории generator2, с токеном для работы с API пачки. Пример файла .env.example:

```
TOKEN=ваштокен
```

2. Создать и активировать виртуальное окружение, установить зависимости:

```
python -m venv venv
source venv/sctipts/activate
pip install -r requirements.txt
```

3. Важно - текущая версия работает только через модули python: python -m generator2.имяфайла

4. Запустить единый генератор клиента:

```
python -m generator2.generator_starter
```

5. Дождаться генерации кода, в результате будут получены (обновлены) модели и эндпоинты.


6. Запустить скрипт-пример запроса

```
python -m generator2.generator2_full.pachca
```
