import { generateNavigation } from '@/lib/navigation';
import { SidebarClient } from './sidebar';

export async function Sidebar() {
  const navigation = await generateNavigation();
  return <SidebarClient navigation={navigation} />;
}
