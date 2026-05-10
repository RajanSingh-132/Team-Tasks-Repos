import clsx from 'clsx';

interface SpinnerProps { size?: 'sm' | 'md' | 'lg'; className?: string; }

export default function Spinner({ size = 'md', className }: SpinnerProps) {
  return (
    <div className={clsx(
      'inline-block rounded-full border-2 border-current border-t-transparent animate-spin',
      size === 'sm' && 'w-4 h-4',
      size === 'md' && 'w-6 h-6',
      size === 'lg' && 'w-10 h-10',
      className
    )} />
  );
}
