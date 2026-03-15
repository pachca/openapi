### Send message with files

1. Upload each file — command returns `key`:
   ```bash
   pachca upload report.pdf
   ```
   > Command automatically gets signature and uploads file to S3

2. Send message with all files:
   ```bash
   pachca messages create --entity-id=<chat_id> --content="Смотри файл" --files='[{"key":"attaches/files/.../report.pdf","name":"report.pdf","file_type":"file","size":12345}]'
   ```

> `pachca upload` automatically gets signature (POST /uploads), substitutes filename in `key`, and uploads to S3. Returns ready-to-use `key` for `files`.

