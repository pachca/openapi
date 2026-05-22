// Pure date formatting — no fs/node imports, safe to use in client components.

const MONTHS_RU: Record<string, string> = {
  '01': 'января',
  '02': 'февраля',
  '03': 'марта',
  '04': 'апреля',
  '05': 'мая',
  '06': 'июня',
  '07': 'июля',
  '08': 'августа',
  '09': 'сентября',
  '10': 'октября',
  '11': 'ноября',
  '12': 'декабря',
};

/** Convert ISO date (YYYY-MM-DD) to Russian display format (DD месяца YYYY). */
export function formatDateRu(isoDate: string): string {
  const [year, month, day] = isoDate.split('-');
  const monthName = MONTHS_RU[month] || month;
  return `${day} ${monthName} ${year}`;
}
