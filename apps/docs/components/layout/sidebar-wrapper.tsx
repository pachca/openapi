import { generateNavigation } from '@/lib/navigation';
import type { TabId } from '@/lib/tabs-config';
import type { NavigationSection } from '@/lib/openapi/types';
import { SidebarClient } from './sidebar';

export async function Sidebar() {
  const [guidesNav, apiNav, cliNav, sdkNav, n8nNav, updatesNav] = await Promise.all([
    generateNavigation('guides'),
    generateNavigation('api'),
    generateNavigation('cli'),
    generateNavigation('sdk'),
    generateNavigation('n8n'),
    generateNavigation('updates'),
  ]);

  const navigationByTab: Record<TabId, NavigationSection[]> = {
    guides: guidesNav,
    api: apiNav,
    cli: cliNav,
    sdk: sdkNav,
    n8n: n8nNav,
    updates: updatesNav,
  };

  return <SidebarClient navigationByTab={navigationByTab} />;
}
