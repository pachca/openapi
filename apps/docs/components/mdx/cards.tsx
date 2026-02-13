import Link from 'next/link';
import {
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
};

/** Icon mapping for guide pages by path */
const GUIDE_ICONS: Record<string, string> = {
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
}

export function CardGroup({ children }: CardGroupProps) {
  return (
    <div className="card-group grid grid-cols-1 sm:grid-cols-2 xl:grid-cols-3 gap-3 my-8 not-prose">
      {children}
    </div>
  );
}

interface CardProps {
  title: string;
  icon?: string;
  href: string;
  children: React.ReactNode;
}

export function Card({ title, icon, href, children }: CardProps) {
  const Icon = icon ? iconMap[icon] : null;

  return (
    <Link
      href={href}
      className="group flex flex-col gap-2.5 px-4 py-3 rounded-lg border border-background-border hover:bg-background-tertiary transition-all duration-200 no-underline!"
    >
      {Icon && <Icon className="h-5 w-5 text-text-primary" strokeWidth={2} />}
      <div>
        <span className="text-[14px] font-medium! text-text-primary block">{title}</span>
        <span className="text-[13px] leading-relaxed text-text-secondary font-normal! block mt-0.5">
          {children}
        </span>
      </div>
    </Link>
  );
}

export { GUIDE_ICONS, API_SECTION_META };
