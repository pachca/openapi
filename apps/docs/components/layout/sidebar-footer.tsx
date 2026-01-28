export function SidebarFooter() {
  const currentYear = new Date().getFullYear();

  return (
    <div className="flex-shrink-0 bg-background-secondary border-t border-background-border p-4">
      <div className="flex items-start justify-between gap-3">
        <div className="flex-1 min-w-0">
          <p className="text-text-secondary text-xs leading-relaxed">
            Мы постоянно улучшаем API системы, и скоро вы получите еще больше методов для работы с
            вашей компанией.
          </p>
          <p className="text-text-tertiary text-xs mt-2">
            © {currentYear} Пачка. Сделано с заботой.
          </p>
        </div>
      </div>
    </div>
  );
}
