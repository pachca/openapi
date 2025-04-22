ifneq (,$(wildcard ../../.env))
    include ../../.env
    export
endif

.PHONY: help
help:
	@echo "Команды:"
	@echo "	help	- Список всех команд"
	@echo "	build	- Создание библиотеки"
	@echo "	clean	- Очистка временных файлов"
	@echo "	upload	- Загрузка библиотеки на testPyPi"

build: clean

	python setup.py bdist_wheel --dist-dir=../repository/

clean: 
	@rm -rf .pytest_cache/ .mypy_cache/ junit/ build/ ../repository/ ../*.egg-info/

.PHONY: upload
upload: build
	@echo "library пакет"
	@echo $$TWINE_USERNAME
	@echo $$TWINE_API_TOKEN
	TWINE_USERNAME=$$TWINE_USERNAME TWINE_PASSWORD=$$TWINE_API_TOKEN twine upload --repository testpypi ../repository/* --verbose