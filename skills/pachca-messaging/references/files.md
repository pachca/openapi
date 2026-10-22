# Sending files in Pachca

A message or a draft carries at most 10 files. Each file is either sent as **content** (the MCP server uploads it) or by **key** (you uploaded it yourself). The same file record works in creating and editing a message and in creating and editing a draft.

## Pick the way

| What you send                                                         | How                                                     |
| --------------------------------------------------------------------- | ------------------------------------------------------- |
| Small text you wrote yourself: a `.md` report, a CSV, an `.html` page | content (base64) in the MCP call. The server uploads it |
| A real document or picture from disk: PDF, PNG, DOCX                  | your own upload, then the key. Needs a terminal         |
| A file that is already in Pachca (attached to a message or draft)     | its `key` as the attachment carries it                  |

- One MCP call carries up to 4 MB including base64, about 3 MB of source files.
- Do not try to put a binary file from disk into `content`: a model cannot pass a real file that way.
- A program without a terminal (for example the Claude app) sends only content, that is small text. If the user asks it to send a file from disk, say it cannot and suggest attaching the file in Pachca by hand, or use a draft with the text and let the employee add the file.
- Avatars take only content.

## Upload from disk through MCP plus a shell

1. Call `pachca_get_upload_params` (no arguments). The parameters are for one file: call it again for every next file.
2. In the returned `key`, replace `${filename}` with the actual file name. Change nothing else: the start of the key varies.
3. POST a `multipart/form-data` form to `direct_url` **from this same answer**. Send every returned field as is, leave out `direct_url` itself, and put the file **last**. Some workspaces return `acl`, others `bucket`: send whichever came. `direct_url` is the file storage, not a Pachca endpoint: no `Authorization` header.

   ```bash
   curl -sS -X POST "<direct_url>" \
     -F "Content-Disposition=<as returned>" \
     -F "acl=<as returned>" \
     -F "policy=<as returned>" \
     -F "x-amz-credential=<as returned>" \
     -F "x-amz-algorithm=<as returned>" \
     -F "x-amz-date=<as returned>" \
     -F "x-amz-signature=<as returned>" \
     -F "key=<key with the real file name>" \
     -F "file=@report.pdf"
   ```

   Success is `204` with an empty body.

4. Send the message or draft with the file record: `key`, `name`, `file_type` and `size` in bytes (for example `wc -c < report.pdf`).

## Upload through the CLI

`pachca upload <file>` does steps 1–3 and returns the ready `key`:

```bash
KEY=$(pachca upload report.pdf -o json | jq -r '.key')
SIZE=$(wc -c < report.pdf | tr -d ' ')
pachca messages create --entity-id 12345 \
  --content "Отчёт за квартал" \
  --files "[{\"key\":\"$KEY\",\"name\":\"report.pdf\",\"file_type\":\"file\",\"size\":$SIZE}]"
```

## Upload through the API

The same three steps: `POST /uploads` with the token (no body), the multipart form to `direct_url`, then `files` in `POST /messages`. The SDKs and full examples are on <https://dev.pachca.com/api/file-uploads.md>.

## The file record

| Field             | Rule                                                                                                                    |
| ----------------- | ----------------------------------------------------------------------------------------------------------------------- |
| `key`             | the key from the upload with `${filename}` replaced                                                                     |
| `name`            | the display name. The base part can differ, the **extension must match** the one in `key`, otherwise `422 wrong_params` |
| `file_type`       | `file`, `image`, `audio`, `voice`, `video`                                                                              |
| `size`            | bytes, shown to readers. Pass it for a file sent by key                                                                 |
| `width`, `height` | pixels, for `image`                                                                                                     |
| `duration_ms`     | required for `voice`. A voice message longer than 30 minutes is rejected                                                |
| `waveform`        | required for `voice`                                                                                                    |

## Errors

| Symptom                | Cause                                           | Fix                             |
| ---------------------- | ----------------------------------------------- | ------------------------------- |
| `403` from the storage | the signature expired                           | get new parameters              |
| `400` from the storage | the form was not `multipart/form-data`          | send a multipart form, not JSON |
| the file does not show | `${filename}` was not replaced in `key`         | replace it with the real name   |
| `422 wrong_params`     | the `name` extension differs from the `key` one | make the extensions match       |

## After sending

- Removing an attachment by editing deletes the file from storage. In an edit, `files` replaces the whole set: pass the files to keep again with the same `key`.
- Deleting the message erases its files from storage with no trash. A forwarded copy keeps the file alive while it references it.

Source pages: <https://dev.pachca.com/guides/ai-agents/mcp-tools.md>, <https://dev.pachca.com/api/file-uploads.md>, <https://dev.pachca.com/guides/ai-agents/mcp.md>
