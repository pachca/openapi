# Rich answers: message Markdown, .md cards, .html preview

Source: [Formatting answers](https://dev.pachca.com/guides/ai-agents/markdown.md).
The full list of inline constructs is in
[Text formatting](https://dev.pachca.com/guides/markdown.md).

## Pick the form

| Result                                                                          | Send as                              |
| ------------------------------------------------------------------------------- | ------------------------------------ |
| A short answer, a link, a code snippet                                          | Message text                         |
| A report, summary, review, meeting notes, anything with lists, tables, headings | An `.md` file                        |
| A diff of code                                                                  | An `.md` file with `diff` blocks     |
| A sequence or a scheme                                                          | An `.md` file with a `mermaid` block |
| An exact layout: dashboard, report with your own styling, email mock-up         | A self-contained `.html` file        |

## Message text

The `content` of a new or edited message is always Markdown — there is no flag
to turn on. Bold, italic, strikethrough, links, mentions, inline code and code
blocks work. Lists and tables are not recognized: `-`, `1.` and `|` stay in the
text as is. A quote loses its `>` and becomes plain text, and a heading becomes
a bold line without the hashes. Limit: 40,000 bytes of Markdown, about 20,000
Cyrillic characters.

## .md file as a card

When a bot attaches an `.md` file, Pachca shows it as a formatted card in the
chat, with a full-screen view. The card appears when the `.md` is the only
document of the message (pictures and videos do not count) and has a typical
document size. A longer `.md`, or one among several files, shows as a file card
and opens in the same view on click. Rendered: headings, lists, quotes, links,
images, tables, task checklists, code blocks with highlighting, `diff` blocks,
`mermaid` diagrams. Everything a bot sends renders the same as content from
employees.

How to attach, by access path:

- **API:** upload the file by the three-step
  [file upload](https://dev.pachca.com/api/file-uploads.md) scheme, then pass
  the file key in `files` of the new message with `name` and `file_type`. The
  `.md` extension in the file name turns the card on.
- **CLI:** `pachca upload report.md -o json` gets the signature, uploads the
  file from disk and returns only its `key`. Then pass the file record as JSON:
  `pachca messages create --entity-type thread --entity-id <id> --files '[{"key":"<key>","name":"report.md","file_type":"file","size":<bytes>}]'`
  ([CLI files](https://dev.pachca.com/guides/cli/files.md)). `key`, `name` and
  `file_type` are required, and the extension of `name` must match the one in
  `key`, otherwise `422`. Set `file_type` every time: `file` for a `.md` or
  `.html` report, `image` for a picture. `size` is optional: pass it so the
  card shows the size right away. From stdin, name the file:
  `pachca upload - --name report.md`. Without `--name` the key ends in
  `stdin`, and the file cannot be sent as `report.md`.
- **MCP:** a small file goes by its contents in `files` of `pachca_send_message`
  — up to 4 MB per call with files in base64, about 3 MB of source files. A file
  from disk the agent uploads itself and attaches by key
  ([MCP server limits](https://dev.pachca.com/guides/mcp/overview.md)).

Every path needs `uploads:write` on the token. Very large `.md` and `.html`
files open as an ordinary attachment to download instead of a preview.

## .html file

Pachca shows attached `.html`, `.htm` and `.txt` in a full-screen view on
click; `.txt` is shown as is. As with the `.md` card, a thumbnail in the chat
appears only when the file is the only document of the message. For `.html` the
thumbnail also needs a typical document size, and that size must be known:
when you attach by key, pass `size` in `files` so it shows right away (with
file contents in MCP the server fills it in). HTML opens in an isolated frame,
so build it self-contained:

- scripts do not run — the page is static;
- external resources do not load: embed images as `data:image/…` URIs, keep
  styles in a `style` tag or attribute;
- fonts and video do not load even when embedded, so use system fonts;
- forms are cut out, together with `link`, `base`, `meta` and `area` tags;
- only `https` links (open in a new tab) and anchor links stay links; `http`,
  `mailto` and relative paths stop being links.

If something was cut out, the view shows a note that the preview may differ
from the original.
