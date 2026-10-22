# Formatting messages in Pachca

The same markdown engine handles message `content` (create and edit), incoming webhook text and the `text` of a `markdown` form block. It recognises a narrow set of constructs. Everything else arrives as plain text.

## What renders

| Element       | Write                                   | Result                                        |
| ------------- | --------------------------------------- | --------------------------------------------- |
| Bold          | `**text**` or `__text__`                | bold                                          |
| Italic        | `*text*` or `_text_`                    | italic                                        |
| Strikethrough | `~~text~~`                              | struck through                                |
| Link          | `[label](https://example.com)`          | link with the label                           |
| Bare URL      | `https://example.com`                   | clickable link                                |
| Inline code   | `` `code` ``                            | monospace                                     |
| Image syntax  | `![caption](https://example.com/i.png)` | only a link with the text "caption", no image |
| Heading       | `# Title` … `###### Title`              | a bold line, the hashes removed               |

Headings have no style of their own: `# Summary`, `## Summary` and `**Summary**` look the same. The space after the hashes is required: `#Summary` arrives as typed, hash included.

To show a picture, attach it as a file (see [files.md](files.md)) instead of using image syntax.

## Code blocks

- The opening and closing fences (three backticks) must each be on their own line. A one-line ` ```code``` ` is not a code block: the text after the opening fence is read as a language name and the closing fence stays as text.
- The highlight language goes right after the opening fence, with no space: ` ```json `. The content starts on the next line.
- Without a language Pachca guesses it from the content. Cyrillic text is almost always guessed as `1C`, so label plain text blocks ` ```text `.

## What does not render

- Bulleted and numbered lists: the `-` and `1.` markers stay in the text.
- Tables: the `|` characters stay in the text.
- Quotes: the text stays, the leading `>` disappears.

Shape a message without them: short paragraphs, a bold lead-in per point, line breaks. If the structure matters, attach a `.md` file.

## Text read from Pachca

When an employee writes in the app, the message is stored structurally, and `content` (in API responses and outgoing webhooks) is markdown rebuilt from that structure. It can contain quote lines starting with `>` and list lines starting with `-` or `1.`, which cannot be sent back. Inline markup inside them works: in `- **important**` the marker stays and the word is bold. Underline has no markdown form, so underlined text arrives plain.

So when you quote, summarise or forward something you read, rewrite it in the supported set instead of pasting `content` as is.

## Rich documents as files

For a table, a checklist, a diagram, a code review or anything long, attach a file instead of fighting the inline set. Send it as content in the call if you wrote it yourself (see [files.md](files.md)).

**`.md` file.** Rendered as a formatted card in the chat with a full-screen view. The card appears when the `.md` is the only document in the message. Among several files it opens in the same viewer on click. Supported: headings, lists, quotes, links, images, tables, task checklists, code blocks with highlighting, `diff` blocks (added and removed lines coloured), `mermaid` diagrams. The `.md` extension in the file name turns the card on.

**`.html` file.** Shown as a document thumbnail and opened full screen in an isolated frame, so build it self-contained:

- scripts do not run, the page is static;
- external resources do not load: embed images as `data:` URIs, keep styles in a `style` tag or attribute;
- forms are stripped, along with `link`, `base`, `meta` and `area` tags;
- only `https` and anchor links stay links. `http`, `mailto` and relative paths stop being links.

If something was stripped, the viewer shows a note that the preview may differ from the original.

**`.txt` file.** Shown in the same viewer as is, with no formatting.

Very large `.md` and `.html` files open as a plain download instead of a preview.

## Limits

- Message text: up to 40,000 bytes in UTF-8, about 20,000 Cyrillic characters. In a workspace with advanced encryption, up to 27,000 bytes.
- No separate flag is needed: `content` is always parsed as markdown, on create and on edit.

Source pages: <https://dev.pachca.com/guides/markdown.md>, <https://dev.pachca.com/guides/ai-agents/markdown.md>
