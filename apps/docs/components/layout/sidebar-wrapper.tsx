import { generateNavigation } from '@/lib/navigation';
import { SidebarClient } from './sidebar';

export async function Sidebar() {
  const [guideNav, apiNav] = await Promise.all([
    generateNavigation('guide'),
    generateNavigation('api'),
  ]);
  return <SidebarClient guideNavigation={guideNav} apiNavigation={apiNav} />;
}
