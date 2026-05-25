import { loadUpdates, isNewUpdate } from '@/lib/updates-parser';
import { Header } from './header';

export function HeaderServer() {
  const hasNewUpdates = loadUpdates().some((u) => isNewUpdate(u.date));
  return <Header hasNewUpdates={hasNewUpdates} />;
}
