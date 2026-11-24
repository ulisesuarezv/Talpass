import Image from 'next/image';

import { siteConfig } from '@/config/site';
import { cn } from '@/lib/utils';

/** Recorte provisional de la lámina aprobada; sustituir por el original. */
export function BrandLogo({ className }: { className?: string }) {
  return (
    <span
      className={cn(
        'inline-flex shrink-0 items-center rounded-lg bg-white px-2 py-1.5',
        className,
      )}
    >
      <Image
        src="/brand/talpass-logo-provisional.webp"
        alt={siteConfig.name}
        width={744}
        height={200}
        unoptimized
        className="h-auto w-24 sm:w-36"
      />
    </span>
  );
}
