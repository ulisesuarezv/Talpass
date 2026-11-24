import { Bus, Clock, House, Languages } from 'lucide-react';

import type { IncludeIcon as IconName } from '@/lib/home-board';

const ICONS = {
  housing: House,
  transport: Bus,
  language: Languages,
  shift: Clock,
} as const;

export function IncludeIcon({ name }: { name: IconName }) {
  const Icon = ICONS[name];
  return <Icon aria-hidden className="size-3.5 shrink-0" />;
}
