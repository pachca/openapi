> Это Markdown-версия конкретной страницы. Для контекста за её пределами (правила API, полный перечень методов, авторизация) ОБЯЗАТЕЛЬНО открой [llms.txt](https://dev.pachca.com/llms.txt) перед ответом — это сэкономит токены и предотвратит неполный ответ.


# Файлы

Команда `pachca upload` автоматически получает подпись через `POST /uploads` и загружает файл на S3 — не нужно вручную копировать 7 параметров подписи:

```bash
# Загрузить файл
pachca upload photo.jpg

# Из stdin
cat data.csv | pachca upload -
```

Команда возвращает `key` — используйте его в поле `files[].key` при [создании сообщений](/api/messages/create):

```bash
# Загрузить файл и отправить в чат
KEY=$(pachca upload photo.jpg -o json | jq -r '.key')
pachca messages create --entity-id 123 --content "Фото" --files "[{\"key\":\"$KEY\",\"name\":\"photo.jpg\"}]"
```

> Для низкоуровневого контроля доступна команда `pachca common direct-url` — она отправляет multipart-запрос на указанный URL с параметрами подписи.

