import Link from 'next/link';
import {
  ArrowUpRight,
  ArrowLeftRight,
  Webhook,
  AlertTriangle,
  Download,
  LayoutList,
  ShieldCheck,
  ClipboardList,
  MessageSquare,
  MessagesSquare,
  Users,
  Tag,
  UserPlus,
  MessageSquareMore,
  SmilePlus,
  Link as LinkIcon,
  Bell,
  Bot,
  Shield,
  Zap,
  CheckCheck,
  User,
  FileText,
  SquareMousePointer,
  CircleHelp,
  ListTodo,
  ClipboardCheck,
  Activity,
  Search,
  FileSearch,
  Building2,
  Eye,
  UserRoundPlus,
  Sparkles,
  MessageSquareReply,
  AtSign,
  ArrowDownToLine,
  KeyRound,
  Terminal,
  Route,
  MousePointerClick,
  Blocks,
  Code,
  type LucideIcon,
} from 'lucide-react';

const iconMap: Record<string, LucideIcon> = {
  ArrowLeftRight,
  Webhook,
  AlertTriangle,
  Download,
  LayoutList,
  ShieldCheck,
  ClipboardList,
  MessageSquare,
  MessagesSquare,
  Users,
  Tag,
  UserPlus,
  MessageSquareMore,
  SmilePlus,
  LinkIcon,
  Bell,
  Bot,
  Shield,
  Zap,
  CheckCheck,
  User,
  FileText,
  SquareMousePointer,
  CircleHelp,
  ListTodo,
  ClipboardCheck,
  Activity,
  Search,
  FileSearch,
  Building2,
  Eye,
  UserRoundPlus,
  Sparkles,
  MessageSquareReply,
  AtSign,
  ArrowDownToLine,
  KeyRound,
  Terminal,
  Route,
  MousePointerClick,
  Blocks,
  Code,
};

/** Icon mapping for guide pages by path */
const GUIDE_ICONS: Record<string, string> = {
  '/guides/quickstart': 'Zap',
  '/guides/ai-agents': 'Sparkles',
  '/guides/cli': 'Terminal',
  '/guides/workflows': 'Route',
  '/guides/webhook': 'Webhook',
  '/guides/export': 'Download',
  '/guides/forms/overview': 'LayoutList',
  '/guides/dlp': 'ShieldCheck',
  '/guides/audit-events': 'ClipboardList',
  '/api/authorization': 'KeyRound',
  '/api/requests-responses': 'ArrowLeftRight',
  '/api/errors': 'AlertTriangle',
  '/updates': 'FileText',
};

/** Icon and description mapping for API sections by title */
const API_SECTION_META: Record<string, { icon: string; description: string }> = {
  'Общие методы': { icon: 'Zap', description: 'Экспорт и загрузка файлов' },
  'Профиль и статус': { icon: 'User', description: 'Информация о текущем пользователе' },
  Сотрудники: { icon: 'Users', description: 'Управление участниками пространства' },
  Теги: { icon: 'Tag', description: 'Группировка сотрудников по тегам' },
  Чаты: { icon: 'MessagesSquare', description: 'Создание и управление чатами' },
  'Участники чатов': { icon: 'UserPlus', description: 'Добавление и удаление участников' },
  Треды: { icon: 'MessageSquareMore', description: 'Обсуждения внутри сообщений' },
  Сообщения: { icon: 'MessageSquare', description: 'Отправка, редактирование, удаление' },
  'Прочтение сообщения': { icon: 'CheckCheck', description: 'Список прочитавших сообщение' },
  'Реакции на сообщения': { icon: 'SmilePlus', description: 'Добавление и удаление реакций' },
  Ссылки: { icon: 'LinkIcon', description: 'Разворачивание ссылок (unfurl)' },
  Напоминания: { icon: 'Bell', description: 'Создание и управление напоминаниями' },
  Формы: { icon: 'SquareMousePointer', description: 'Модальные окна с полями ввода' },
  'Боты и Webhook': { icon: 'Bot', description: 'Настройка ботов и история вебхуков' },
  Безопасность: { icon: 'Shield', description: 'Журнал аудита событий' },
  Поиск: { icon: 'Search', description: 'Поиск сотрудников, чатов и сообщений' },
};

interface CardGroupProps {
  children: React.ReactNode;
  columns?: 2 | 3;
}

const columnClasses = {
  2: 'grid-cols-1 sm:grid-cols-2',
  3: 'grid-cols-1 sm:grid-cols-2 xl:grid-cols-3',
};

export function CardGroup({ children, columns = 3 }: CardGroupProps) {
  return (
    <div className={`card-group grid ${columnClasses[columns]} gap-3 my-8 not-prose`}>
      {children}
    </div>
  );
}

interface CardProps {
  title: string;
  icon?: string;
  href?: string;
  download?: boolean;
  compact?: boolean;
  children?: React.ReactNode;
}

export function Card({ title, icon, href, download, compact, children }: CardProps) {
  const Icon = icon ? iconMap[icon] : null;

  if (compact && href) {
    const compactContent = (
      <>
        {Icon && <Icon className="w-4 h-4 text-white" strokeWidth={2} />}
        <span className="text-[14px] font-medium text-text-primary">{title}</span>
        <ArrowUpRight className="w-3.5 h-3.5 text-text-tertiary transition-transform duration-200 group-hover:translate-x-0.5 group-hover:-translate-y-0.5" />
      </>
    );
    const compactClassName =
      'group no-underline! inline-flex items-center gap-2 px-2.5 py-2 text-[14px] font-medium rounded-lg border border-glass-border bg-glass backdrop-blur-md hover:bg-glass-hover hover:border-glass-heavy-border transition-all duration-200';
    return (
      <Link href={href} className={compactClassName}>
        {compactContent}
      </Link>
    );
  }

  const content = (
    <>
      {Icon && <Icon className="h-5 w-5 text-text-primary" strokeWidth={2} />}
      <div>
        <span className="text-[15px] font-medium! text-text-primary block">{title}</span>
        <span className="text-[14px] leading-relaxed text-text-secondary font-normal! block mt-0.5 [&_p]:text-[14px]! [&_p]:text-inherit! [&_p]:mb-0! [&_p]:text-[inherit]! [&_p]:leading-inherit!">
          {children}
        </span>
      </div>
    </>
  );

  if (href) {
    const className =
      'group relative flex flex-col gap-2.5 px-4 py-3 rounded-xl border border-glass-border bg-glass backdrop-blur-md hover:bg-glass-hover hover:border-glass-heavy-border transition-all duration-200 no-underline!';
    const cornerIcon = download ? (
      <ArrowDownToLine className="absolute top-3 right-3 h-4 w-4 text-text-tertiary transition-transform duration-200 group-hover:translate-y-0.5" />
    ) : (
      <ArrowUpRight className="absolute top-3 right-3 h-4 w-4 text-text-tertiary transition-transform duration-200 group-hover:translate-x-0.5 group-hover:-translate-y-0.5" />
    );

    if (download) {
      return (
        <a href={href} download className={className}>
          {content}
          {cornerIcon}
        </a>
      );
    }

    const isExternal = href.startsWith('http');
    const isFile = /\.\w+$/.test(href) && !href.startsWith('/guides/');
    const openInNewTab = isExternal || isFile;

    if (openInNewTab) {
      return (
        <a href={href} target="_blank" rel="noopener noreferrer" className={className}>
          {content}
          {cornerIcon}
        </a>
      );
    }

    return (
      <Link href={href} className={className}>
        {content}
        {cornerIcon}
      </Link>
    );
  }

  return (
    <div className="flex flex-col gap-2.5 px-4 py-3 rounded-xl border border-glass-border bg-glass backdrop-blur-md">
      {content}
    </div>
  );
}

export { GUIDE_ICONS, API_SECTION_META };
