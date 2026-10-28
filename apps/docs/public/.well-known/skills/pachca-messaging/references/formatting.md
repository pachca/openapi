# Formatting messages in Pachca

The same markdown engine handles message `content` (create and edit), incoming webhook text and the `text` of a `markdown` form block. It recognises a narrow set of constructs. Mentions (see the skill) work in messages and incoming webhooks only: in a form block `@nickname`, `<@user_id>`, `@all` and tag mentions stay plain text. Lists, tables and quotes stay as text, and raw HTML and separator lines disappear (see below).

## What renders

| Element       | Write                                   | Result                                                                                                                                                                                                      |
| ------------- | --------------------------------------- | ----------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| Bold          | `**text**` or `__text__`                | bold                                                                                                                                                                                                        |
| Italic        | `*text*` or `_text_`                    | italic                                                                                                                                                                                                      |
| Strikethrough | `~~text~~`                              | struck through                                                                                                                                                                                              |
| Link          | `[label](https://example.com)`          | link with the label. The URL must start with `https://`, `http://` or a scheme such as `mailto:` or `tel:`. With `example.com` or a relative path only the label stays, without a link and without an error |
| Bare URL      | `https://example.com`                   | clickable link                                                                                                                                                                                              |
| Inline code   | `` `code` ``                            | monospace                                                                                                                                                                                                   |
| Image syntax  | `![caption](https://example.com/i.png)` | only a link with the text "caption", no image                                                                                                                                                               |
| Heading       | `# Title` … `###### Title`              | a bold line, the hashes removed                                                                                                                                                                             |

Headings have no style of their own: `# Summary`, `## Summary` and `**Summary**` look the same. The space after the hashes is required: `#Summary` arrives as typed, hash included.

To show a picture, attach it as a file (see [files.md](files.md)) instead of using image syntax.

## Code blocks

- The opening and closing fences (three backticks) must each be on their own line. A one-line ` ```code``` ` is not a code block: it renders as inline code.
- The highlight language goes right after the opening fence, with no space: ` ```json `. The content starts on the next line.
- Without a language Pachca guesses it from the content. Name the language when you know it.

## What does not render

- Bulleted and numbered lists: the `-` and `1.` markers stay in the text.
- Tables: the `|` characters stay in the text.
- Quotes: the text stays, the leading `>` disappears.

Shape a message without them: short paragraphs, a bold lead-in per point, line breaks. If the structure matters, attach a `.md` file.

Some constructs are swallowed instead of shown:

- HTML tags disappear: `<br>`, `<u>` and `</u>` (the text between them stays, unformatted), `<!-- comments -->` and placeholders such as `<name>` or `<file-id>`. Some take more text with them. A line that starts with a block tag such as `<div>`, `<details>` or `<p>` disappears together with the lines below it, up to the next blank line. The same happens to a tag or placeholder alone on a line at the start of the message or after a blank line. A line that starts with `<!--` hides everything up to and including the line with the closing `-->`, or the rest of the message if there is none. To show a placeholder, put it in inline code (`` `<name>` ``) or write `{name}`. The `<@user_id>` mention form is not affected.
- Separator lines `---`, `***` and `___` disappear. When `---` or `===` sits directly under text with no blank line between them, the paragraph above turns bold instead.
- Lines indented by four or more spaces become a code block when they start the message or follow a blank line, a heading or a code block. Indented lines directly under a line of text just continue that paragraph.

## Text read from Pachca

When an employee writes in the app, the message is stored structurally, and `content` (in API responses and outgoing webhooks) is markdown rebuilt from that structure. It can contain quote lines starting with `>` and list lines starting with `-` or `1.`, which do not render when sent back: the `>` disappears and the list markers stay as typed. Inline markup inside them works: in `- **important**` the marker stays and the word is bold. Underline has no markdown form, so underlined text arrives plain.

So when you quote, summarise or forward something you read, rewrite it in the supported set instead of pasting `content` as is.

## Rich documents as files

For a table, a checklist, a diagram, a code review or anything long, attach a file instead of fighting the inline set. Through MCP, send it as content (base64) in the call if you wrote it yourself. The CLI and the REST API need an upload first, then the key (see [files.md](files.md)).

**`.md` file.** Rendered as a formatted card in the chat with a full-screen view. The card appears when the `.md` is the only document in the message. Among several files it opens in the same viewer on click. Supported: headings, lists, quotes, links, images, tables, task checklists, code blocks with highlighting, `diff` blocks (added and removed lines coloured), `mermaid` diagrams. The `.md` extension in the file name turns the card on.

**`.html` file.** Shown as a document thumbnail and opened full screen in an isolated frame, so build it self-contained:

- scripts do not run, the page is static;
- external resources do not load: embed images as `data:` URIs, keep styles in a `style` tag or attribute;
- forms are stripped, along with `link`, `base`, `meta` and `area` tags;
- only `https` and anchor links stay links. `http`, `mailto` and relative paths stop being links.

If something was stripped, the viewer shows a note that the preview may differ from the original.

**`.txt` file.** Shown as is, with no formatting: a thumbnail of its beginning in the chat when it is the only document in the message, and the same full-screen viewer on click.

A large `.md`, `.html` or `.txt` file shows as a plain file, without the in-chat card or thumbnail, even when it is the only document. A click still opens the viewer. Very large `.md`, `.html` and `.txt` files open as a plain download instead of a preview. To get the card, keep a report compact or split it across several messages.

## Limits

- Message text: up to 40,000 bytes in UTF-8, about 20,000 Cyrillic characters.
- No separate flag is needed: `content` is always parsed as markdown, on create and on edit.

Source pages: <https://dev.pachca.com/guides/markdown.md>, <https://dev.pachca.com/guides/ai-agents/markdown.md>
