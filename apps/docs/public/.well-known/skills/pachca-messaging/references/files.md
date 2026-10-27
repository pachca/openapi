# Sending files in Pachca

A message or a draft carries at most 10 files. Each file is either sent as **content** (the MCP server uploads it) or by **key**: of your own upload, or of a file already in Pachca. The same record shape works in creating and editing a message and a draft, with two differences:

- A draft accepts a `key` only of a file you uploaded yourself: your own upload, or a file the server uploaded from your `content`. A key of a file someone else uploaded, even one copied from a message, gets `422` with code `invalid` on `draft.files`.
- To keep an attached file in an edit, a message takes it again by `key`, a draft by its `id` (together with `key` and `name`).

## Pick the way

| What you send                                                         | How                                                                                                                                                                                            |
| --------------------------------------------------------------------- | ---------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| Small text you wrote yourself: a `.md` report, a CSV, an `.html` page | content (base64) in the MCP call. The server uploads it                                                                                                                                        |
| A real document or picture from disk: PDF, PNG, DOCX                  | your own upload, then the key. Needs a shell that reads the file and reaches the storage                                                                                                       |
| A file that is already in Pachca (attached to a message or draft)     | its `key` as the attachment carries it. In a draft this works only if you uploaded the file yourself. Otherwise, with a shell, download it and upload it again to get your own key (see below) |

- To download an attachment for a new upload, `pachca files get <id> --save <path>` (the attachment's `id`) works for any attachment you can see. A `url` into the storage also downloads with a plain request. A `url` into the Pachca API (`/files/{id}`, used in a workspace with encryption or a secure perimeter) needs the token with the `files:read` scope. `403` with `confidential_download_denied` means the workspace does not let the file out to the address you download from, or, in a workspace with the secure perimeter, the antivirus found a virus in the file and it is refused from any address: say so to the user, naming both causes.
- One MCP call carries up to 4 MB including base64, about 3 MB of source files.
- Content in the call exists only in MCP. The CLI and the REST API always upload first, then pass the key.
- Do not try to put a binary file from disk into `content`: a model cannot pass a real file that way.
- Claude chat (web, desktop, mobile) sends only content, that is small text: its code sandbox cannot read the user's disk, and its network reaches package managers at most, not `direct_url`. If the user says they are in Claude chat, or you have no shell that reaches the storage, and they ask to send a file from disk, say it cannot be uploaded from here and suggest attaching the file in Pachca by hand, or use a draft with the text and let the employee add the file. Cowork works in a folder the user shared: try the upload there, and fall back the same way if the storage does not answer.
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

The same four steps: `POST /uploads` with the token (no body), `${filename}` in `key` replaced with the file name, the multipart form to `direct_url`, then `files` in `POST /messages`. The SDKs and full examples are on <https://dev.pachca.com/api/file-uploads.md>.

## The file record

| Field             | Rule                                                                                                                                                                                                                               |
| ----------------- | ---------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| `key`             | the key from the upload with `${filename}` replaced                                                                                                                                                                                |
| `name`            | the display name. The base part can differ, the **extension must match** the one in `key`, otherwise `422 wrong_params`                                                                                                            |
| `file_type`       | `file`, `image`, `audio`, `voice`, `video`. A `voice` file must be the only file in the message or draft, otherwise `422`. A bot token cannot send one (`403`)                                                                     |
| `size`            | bytes, shown to readers. Pass it when you know it, as after your own upload (`wc -c`). A file record read from Pachca has no `size`: without it the server takes the size from storage after sending, except for an encrypted file |
| `width`, `height` | pixels, for `image`                                                                                                                                                                                                                |
| `duration_ms`     | required for `voice`. A voice message longer than 30 minutes is rejected                                                                                                                                                           |
| `waveform`        | required for `voice`                                                                                                                                                                                                               |

## Errors

| Symptom                                                  | Cause                                                                                                                                                                                                                    | Fix                                                                                                                                        |
| -------------------------------------------------------- | ------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------ | ------------------------------------------------------------------------------------------------------------------------------------------ |
| `403` from the storage                                   | the form does not match what was signed: a field was changed or left out, an extra one was sent (for example `direct_url`), the start of `key` was changed, the file was not last, or fields from two answers were mixed | get new parameters and send them exactly as step 3 says. Expiry is rare: the signature lasts 14 days                                       |
| `400` from the storage                                   | the form was not `multipart/form-data`, or, where the parameters came with `bucket`, the file is over 4 GB                                                                                                               | send a multipart form, not JSON. A bigger file goes as a link or in parts                                                                  |
| `422 wrong_params`, `key` still ends in `${filename}`    | `${filename}` was not replaced in `key`                                                                                                                                                                                  | put the real file name in place of `${filename}`. Do not drop the extension from `name` to get past the check: the file then does not open |
| `422 wrong_params`, `key` already has the real file name | the `name` extension differs from the `key` one, `name` has control characters, a field is missing or unknown (`duration_ms` and `waveform` for `voice`), or a voice message is over 30 minutes                          | read `message` in the response and check the record against the table above                                                                |
| `422 invalid` on `draft.files`                           | a draft got the key of a file you did not upload                                                                                                                                                                         | upload the file yourself and pass that key                                                                                                 |

## After sending

- Removing an attachment by editing deletes the file from storage. In an edit, `files` replaces the whole set: pass the files to keep again with the same `key`. A kept file stays the same attachment, with its `id` and name: the `name` and other fields you send for it are ignored, so to rename a file upload it again.
- Deleting the message erases its files from storage with no trash.
- Both cases leave the file in storage while another message or draft in the workspace carries the same `key`: a forwarded copy, or the same file attached elsewhere by key.
- A draft never erases a file from storage, neither when you remove the file from the draft nor when you delete the draft. A forwarded copy never erases it either, whether you edit it or delete it.
- To get rid of a sensitive file, remove it in this order: from every draft that carries it, then from every forwarded copy, then from the other messages. The file is erased by the last removal only when that is a message that is not a forwarded copy, such as the original. In any other order the file can stay in storage with nothing pointing to it.

Source pages: <https://dev.pachca.com/guides/mcp/tools.md>, <https://dev.pachca.com/api/file-uploads.md>, <https://dev.pachca.com/guides/mcp/overview.md>
