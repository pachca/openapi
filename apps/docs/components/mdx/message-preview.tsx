'use client';

import { useState, useMemo } from 'react';
import {
  Bot,
  FileText,
  FileSpreadsheet,
  Image as ImageIcon,
  Video,
  FileAudio2,
  FileArchive,
  FileCog,
  FileCode,
  Database,
  File as FileIcon,
} from 'lucide-react';

// ─── types ───────────────────────────────────────────────────────

export interface MessageButton {
  text: string;
  url?: string;
  data?: string;
}

export interface MessageFile {
  key?: string;
  name: string;
  file_type: 'file' | 'image';
  size: number;
  width?: number;
  height?: number;
}

export interface LinkPreviewData {
  url: string;
  title?: string;
  description?: string;
  image_url?: string;
  favicon?: string;
  domain?: string;
}

export interface MessagePayload {
  entity_type?: string;
  entity_id?: number;
  content?: string;
  buttons?: MessageButton[][];
  files?: MessageFile[];
  parent_message_id?: number;
  display_avatar_url?: string;
  display_name?: string;
  skip_invite_mentions?: boolean;
}

// ─── constants ───────────────────────────────────────────────────

const FILE_TYPE_COLORS: Record<string, string> = {
  word: '#459AEE',
  excel: '#4CAF50',
  powerPoint: '#FB8C00',
  pdf: '#D64A3B',
  video: '#346EDB',
  audio: '#F2CC01',
  text: '#78909C',
  compressed: '#BC805A',
  executable: '#424242',
  code: '#00C3B0',
  data: '#9FD240',
  markdown: '#7E57C2',
  image: '#A330DD',
  unknown: '#BDBDBD',
};

// ─── helpers ─────────────────────────────────────────────────────

/** Simple markdown → HTML (matches backend CommonMark subset) */
export function renderMarkdown(text: string): string {
  return (
    text
      .replace(/&/g, '&amp;')
      .replace(/</g, '&lt;')
      .replace(/>/g, '&gt;')
      // Fenced code blocks
      .replace(/```\w*\n([\s\S]*?)```/g, '<pre class="wp-code-block">$1</pre>')
      .replace(/```([\s\S]*?)```/g, '<pre class="wp-code-block">$1</pre>')
      // Inline code
      .replace(/`([^`]+)`/g, '<code class="wp-inline-code">$1</code>')
      // Bold
      .replace(/\*\*(.+?)\*\*/g, '<strong>$1</strong>')
      .replace(/__(.+?)__/g, '<strong>$1</strong>')
      // Italic
      .replace(/\*(.+?)\*/g, '<em>$1</em>')
      .replace(/_(.+?)_/g, '<em>$1</em>')
      // Strikethrough
      .replace(/~~(.+?)~~/g, '<del>$1</del>')
      // Markdown links
      .replace(/\[([^\]]+)\]\(([^)]+)\)/g, '<a href="$2" class="wp-link">$1</a>')
      // Autolinks
      .replace(/(?<!["=])(https?:\/\/[^\s<>)}\]"',]+)/g, '<a href="$1" class="wp-link">$1</a>')
      // Line breaks
      .replace(/\n/g, '<br />')
  );
}

function formatFileSize(bytes: number): string {
  if (bytes < 1024) return `${bytes} B`;
  if (bytes < 1024 * 1024) return `${(bytes / 1024).toFixed(1)} KB`;
  return `${(bytes / (1024 * 1024)).toFixed(1)} MB`;
}

function getFileType(name: string): string {
  const n = name.toLowerCase();
  if (/\.(doc|docx)$/.test(n)) return 'word';
  if (/\.(xls|xlsx)$/.test(n)) return 'excel';
  if (/\.(ppt|pptx)$/.test(n)) return 'powerPoint';
  if (/\.pdf$/.test(n)) return 'pdf';
  if (/\.(apng|png|avif|gif|jpg|jpeg|jfif|pjpeg|pjp|webp|bmp)$/.test(n)) return 'image';
  if (/\.(webm|mkv|ogm|ogv|ogg|mov|mp4|m4v|avi)$/.test(n)) return 'video';
  if (/\.(mp3|oga|wav|aac)$/.test(n)) return 'audio';
  if (/\.md$/.test(n)) return 'markdown';
  if (/\.(txt|rtf)$/.test(n)) return 'text';
  if (/\.(zip|rar)$/.test(n)) return 'compressed';
  if (/\.(exe|msi)$/.test(n)) return 'executable';
  if (/\.(html|css|js)$/.test(n)) return 'code';
  if (/\.(csv|json|xml)$/.test(n)) return 'data';
  return 'unknown';
}

function extractUrls(content: string): string[] {
  const regex = /https?:\/\/[^\s<>)}\]"',]+/g;
  return [...new Set(content.match(regex) || [])];
}

function getDomain(url: string): string {
  try {
    return new URL(url).hostname;
  } catch {
    return url;
  }
}

// ─── sub-components ──────────────────────────────────────────────

function FileTypeIcon({ fileType }: { fileType: string }) {
  const cls = 'text-white';
  switch (fileType) {
    case 'word':
    case 'markdown':
    case 'text':
    case 'pdf':
    case 'powerPoint':
      return <FileText size={20} className={cls} />;
    case 'excel':
      return <FileSpreadsheet size={20} className={cls} />;
    case 'data':
      return <Database size={20} className={cls} />;
    case 'video':
      return <Video size={20} className={cls} />;
    case 'audio':
      return <FileAudio2 size={20} className={cls} />;
    case 'compressed':
      return <FileArchive size={20} className={cls} />;
    case 'executable':
      return <FileCog size={20} className={cls} />;
    case 'code':
      return <FileCode size={20} className={cls} />;
    case 'image':
      return <ImageIcon size={20} className={cls} />;
    default:
      return <FileIcon size={20} className={cls} />;
  }
}

function BotButtonsPreview({ buttons }: { buttons: MessageButton[][] }) {
  return (
    <div className="flex w-full max-w-[380px] flex-col gap-1">
      {buttons.map((row, ri) => (
        <div key={ri} className="flex w-full gap-1">
          {row.map((btn, bi) => {
            const isUrl = !!btn.url;
            return (
              <button
                key={bi}
                className={`flex min-h-8 w-full shrink items-center justify-center gap-2.5 truncate rounded-md border border-glass-border bg-glass px-2.5 text-[13px] font-medium transition-colors cursor-default ${
                  isUrl ? 'text-primary' : 'text-text-primary'
                }`}
              >
                <span className="truncate">{btn.text}</span>
              </button>
            );
          })}
        </div>
      ))}
    </div>
  );
}

function ImagePreview({ file }: { file: MessageFile }) {
  const ratio = file.width && file.height ? file.width / file.height : 380 / 253;
  const displayWidth = Math.min(file.width || 380, 380);
  const displayHeight = displayWidth / ratio;

  return (
    <div
      className="relative flex min-h-[60px] w-fit max-w-full min-w-[60px] items-center justify-center overflow-hidden rounded-md border border-glass-border"
      style={{
        width: displayWidth,
        height: Math.min(displayHeight, 380),
      }}
    >
      <div className="flex h-full w-full items-center justify-center bg-glass">
        <ImageIcon className="h-8 w-8 text-text-tertiary" />
      </div>
    </div>
  );
}

function FileCardPreview({ file }: { file: MessageFile }) {
  const fileType = getFileType(file.name);
  const bgColor = FILE_TYPE_COLORS[fileType] || FILE_TYPE_COLORS.unknown;

  return (
    <div className="flex max-w-[328px] flex-[0_1_328px] flex-col overflow-hidden rounded-md border border-glass-border bg-glass">
      <div className="flex w-full items-center gap-3 px-3 py-2.5">
        <div
          className="flex h-9 w-9 shrink-0 items-center justify-center overflow-hidden rounded-md"
          style={{ backgroundColor: bgColor }}
        >
          <FileTypeIcon fileType={fileType} />
        </div>
        <div className="w-0 flex-1">
          <span className="block truncate text-[14px] font-medium text-text-primary">
            {file.name}
          </span>
          <span className="mt-0.5 block text-[13px] text-text-secondary">
            {formatFileSize(file.size)}
          </span>
        </div>
      </div>
    </div>
  );
}

function MessageUploadsPreview({ files }: { files: MessageFile[] }) {
  const images = files.filter((f) => f.file_type === 'image');
  const otherFiles = files.filter((f) => f.file_type !== 'image');

  return (
    <>
      {images.length === 1 && images[0] && <ImagePreview file={images[0]} />}
      {images.length > 1 && (
        <div className="grid w-full max-w-[1000px] grid-cols-2 gap-2">
          {images.map((_, i) => (
            <div
              key={i}
              className="flex items-center justify-center overflow-hidden rounded-md border border-glass-border bg-glass"
              style={{ aspectRatio: '16/9' }}
            >
              <ImageIcon className="h-6 w-6 text-text-tertiary" />
            </div>
          ))}
        </div>
      )}
      {otherFiles.length > 0 && (
        <div className="flex max-w-[1000px] flex-wrap gap-2">
          {otherFiles.map((file, i) => (
            <FileCardPreview key={i} file={file} />
          ))}
        </div>
      )}
    </>
  );
}

function LinkPreviewCard({ preview }: { preview: LinkPreviewData }) {
  const hasContent = preview.title || preview.description;

  return (
    <div className="relative flex w-full max-w-[380px] shrink cursor-default flex-col overflow-hidden rounded-md border border-glass-border bg-glass">
      {hasContent && (
        <div className={`p-3 ${preview.image_url ? 'truncate border-b border-glass-border' : ''}`}>
          <div className="flex truncate">
            {preview.favicon && (
              <div className="mr-1.5 flex h-5 w-5 shrink-0 items-center justify-center rounded-sm bg-glass-hover">
                {/* eslint-disable-next-line @next/next/no-img-element */}
                <img alt="" className="h-3.5 w-3.5" src={preview.favicon} />
              </div>
            )}
            {preview.domain && (
              <p
                className={`truncate text-[14px] font-medium text-text-primary ${preview.description || preview.image_url ? 'mb-2' : ''}`}
              >
                {preview.domain}
              </p>
            )}
          </div>
          {preview.title && (preview.description || preview.image_url) && (
            <p className="line-clamp-2 text-[14px] font-medium text-text-primary">
              {preview.title}
            </p>
          )}
          {preview.description && (
            <p className="line-clamp-3 overflow-hidden text-[14px] whitespace-pre-line text-text-secondary">
              {preview.description}
            </p>
          )}
        </div>
      )}
      {preview.image_url && (
        <div className="w-full">
          {/* eslint-disable-next-line @next/next/no-img-element */}
          <img
            alt={preview.title || ''}
            src={preview.image_url}
            className={`h-full w-full object-top ${
              hasContent ? 'aspect-[1200/630] object-cover' : 'aspect-video object-cover'
            }`}
            onError={(e) => {
              e.currentTarget.parentElement?.remove();
            }}
          />
        </div>
      )}
    </div>
  );
}

function LinkPreviewsBlock({ content, linkPreview }: { content: string; linkPreview: boolean }) {
  const previews = useMemo<LinkPreviewData[]>(() => {
    if (!linkPreview || !content) return [];
    return extractUrls(content)
      .slice(0, 5)
      .map((url) => ({
        url,
        domain: getDomain(url),
        title: getDomain(url),
      }));
  }, [content, linkPreview]);

  if (!previews.length) return null;

  return (
    <>
      {previews.map((p) => (
        <LinkPreviewCard key={p.url} preview={p} />
      ))}
    </>
  );
}

// ─── main component ──────────────────────────────────────────────

export interface MessagePreviewProps {
  msg: MessagePayload;
  linkPreview?: boolean;
}

export function MessagePreview({ msg, linkPreview = false }: MessagePreviewProps) {
  const now = new Date();
  const time = `${now.getHours()}:${String(now.getMinutes()).padStart(2, '0')}`;
  const displayName = msg.display_name || 'Бот';
  const contentHtml = msg.content ? renderMarkdown(msg.content) : '';
  const avatarUrl = msg.display_avatar_url;
  const [failedAvatarUrl, setFailedAvatarUrl] = useState<string | null>(null);
  const showCustomAvatar = !!avatarUrl && failedAvatarUrl !== avatarUrl;

  return (
    <div className="flex gap-3 pt-3 pb-4 pl-5 pr-2">
      {/* Avatar */}
      <div className="flex w-9 shrink-0 items-start justify-end pt-1">
        {showCustomAvatar ? (
          // eslint-disable-next-line @next/next/no-img-element
          <img
            src={avatarUrl}
            alt={displayName}
            className="h-9 w-9 rounded-full object-cover"
            onError={() => setFailedAvatarUrl(avatarUrl ?? null)}
          />
        ) : (
          <div className="flex h-9 w-9 items-center justify-center rounded-full bg-primary/15">
            <Bot className="h-[18px] w-[18px] text-primary" />
          </div>
        )}
      </div>

      {/* Content */}
      <div className="flex min-w-0 grow flex-col gap-1 pr-2">
        {/* Header: name + badge + time */}
        <div className="flex flex-col">
          <div className="flex items-center gap-1">
            <span className="truncate text-[14px] font-medium text-text-primary">
              {displayName}
            </span>
            <span className="shrink-0 rounded-full bg-glass-hover px-2 py-0.5 text-[12px] font-medium text-text-secondary">
              Бот
            </span>
            <span className="shrink-0 text-[13px] text-text-tertiary">{time}</span>
          </div>
        </div>

        {/* Message body: text → files → link previews → buttons */}
        <div className="flex flex-col gap-2">
          {contentHtml && (
            <div
              className="text-[14px] leading-5 text-text-primary wp-message"
              dangerouslySetInnerHTML={{ __html: contentHtml }}
            />
          )}
          {msg.files && msg.files.length > 0 && <MessageUploadsPreview files={msg.files} />}
          {msg.content && <LinkPreviewsBlock content={msg.content} linkPreview={linkPreview} />}
          {msg.buttons && msg.buttons.length > 0 && <BotButtonsPreview buttons={msg.buttons} />}
        </div>
      </div>
    </div>
  );
}
