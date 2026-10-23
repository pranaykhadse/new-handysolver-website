import type { ComponentType } from 'react';
import { BellRing, Boxes, BriefcaseBusiness, Building2, Factory, HardHat, HeartPulse, Hotel, ShoppingBag, Users, CodeXml, Image as ImageIcon, Search } from 'lucide-react';
import { guessJobIcon } from './job-icon';

// Icons a job post can use. When none was chosen in the admin, one is picked from the job title.
export const JOB_ICON_COMPONENTS: Record<string, ComponentType<{ size?: number }>> = {
  'bell-ring': BellRing, 'boxes': Boxes, 'shopping-bag': ShoppingBag, 'building-2': Building2,
  'hard-hat': HardHat, 'factory': Factory, 'heart-pulse': HeartPulse,
  'briefcase-business': BriefcaseBusiness, 'hotel': Hotel, 'users': Users,
  'code': CodeXml, 'image': ImageIcon, 'search': Search,
};

export function jobIconFor(icon: string | null | undefined, title: string): ComponentType<{ size?: number }> | null {
  return JOB_ICON_COMPONENTS[icon || guessJobIcon(title)] ?? null;
}
