### Send message with files

1. For each file: get upload parameters:
   ```bash
   pachca common uploads
   ```
   > Returns `key` (with `${filename}`), `direct_url`, `policy`, signature

2. For each file: replace `${filename}` in `key` with actual filename, then upload file via POST to `direct_url`
   > multipart/form-data, no auth — upload to S3

3. Build `files` array from all uploaded files (`key`, `name`, `file_type`, `size`)

4. Send message with all files:
   ```bash
   pachca messages create --entity-id=<chat_id> --content="Смотри файл" --files='[{"key":"...","name":"report.pdf","file_type":"file","size":12345}]'
   ```

> Files are not sent inline. Upload is two-step: first POST /uploads (parameters), then POST to `direct_url` (file to S3). Steps 1-2 repeat for each file, message is sent once with all files.

