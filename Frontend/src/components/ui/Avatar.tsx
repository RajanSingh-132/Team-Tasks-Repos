import clsx from 'clsx';
import { getInitials } from '../../utils';

const COLORS = ['bg-brand-500','bg-emerald-500','bg-amber-500','bg-rose-500','bg-sky-500','bg-violet-500'];
function colorFor(name: string) {
  let sum = 0; for (const c of name) sum += c.charCodeAt(0);
  return COLORS[sum % COLORS.length];
}

interface AvatarProps { name: string; size?: 'sm' | 'md' | 'lg'; className?: string; }

export default function Avatar({ name, size = 'md', className }: AvatarProps) {
  return (
    <div className={clsx(
      'rounded-full flex items-center justify-center font-bold text-white flex-shrink-0',
      colorFor(name),
      size === 'sm' && 'w-7 h-7 text-xs',
      size === 'md' && 'w-9 h-9 text-sm',
      size === 'lg' && 'w-12 h-12 text-base',
      className
    )}>
      {getInitials(name)}
    </div>
  );
}
