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
  FileSearch,
  Building2,
  Eye,
  UserRoundPlus,
  Sparkles,
  MessageSquareReply,
  AtSign,
  ArrowDownToLine,
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
  FileSearch,
  Building2,
  Eye,
  UserRoundPlus,
  Sparkles,
  MessageSquareReply,
  AtSign,
  ArrowDownToLine,
};

/** Icon mapping for guide pages by path */
const GUIDE_ICONS: Record<string, string> = {
  '/guides/ai-agents': 'Sparkles',
  '/guides/requests-responses': 'ArrowLeftRight',
  '/guides/webhook': 'Webhook',
  '/guides/errors': 'AlertTriangle',
  '/guides/export': 'Download',
  '/guides/forms': 'LayoutList',
  '/guides/dlp': 'ShieldCheck',
  '/guides/audit-events': 'ClipboardList',
  '/guides/updates': 'FileText',
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
  'Прочтение сообщения': { icon: 'CheckCheck', description: 'Информация о прочтении' },
  'Реакции на сообщения': { icon: 'SmilePlus', description: 'Реакции на сообщения' },
  Ссылки: { icon: 'LinkIcon', description: 'Разворачивание ссылок (unfurl)' },
  Напоминания: { icon: 'Bell', description: 'Создание и управление напоминаниями' },
  Формы: { icon: 'SquareMousePointer', description: 'Модальные окна с полями ввода' },
  'Боты и Webhook': { icon: 'Bot', description: 'Информация о ботах и вебхуках' },
  Безопасность: { icon: 'Shield', description: 'Аудит и настройки безопасности' },
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
  children: React.ReactNode;
}

export function Card({ title, icon, href, children }: CardProps) {
  const Icon = icon ? iconMap[icon] : null;

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
    return (
      <Link
        href={href}
        className="group relative flex flex-col gap-2.5 px-4 py-3 rounded-lg border border-background-border hover:bg-background-tertiary transition-all duration-200 no-underline!"
      >
        {content}
        <ArrowUpRight className="absolute top-3 right-3 h-4 w-4 text-text-tertiary transition-transform duration-200 group-hover:translate-x-0.5 group-hover:-translate-y-0.5" />
      </Link>
    );
  }

  return (
    <div className="flex flex-col gap-2.5 px-4 py-3 rounded-lg border border-background-border">
      {content}
    </div>
  );
}

export { GUIDE_ICONS, API_SECTION_META };
