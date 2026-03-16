### Отправить сообщение с файлами

1. Загрузи каждый файл — команда вернёт `key`:
   ```bash
   pachca upload report.pdf
   ```
   > Команда автоматически получает подпись и загружает файл на S3

2. Отправь сообщение со всеми файлами:
   ```bash
   pachca messages create --entity-id=<chat_id> --content="Смотри файл" --files='[{"key":"attaches/files/.../report.pdf","name":"report.pdf","file_type":"file","size":12345}]'
   ```

> `pachca upload` автоматически получает подпись (POST /uploads), подставляет имя файла в `key` и загружает на S3. Возвращает готовый `key` для использования в `files`.

