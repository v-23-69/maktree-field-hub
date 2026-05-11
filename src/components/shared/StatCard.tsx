import { cn } from '@/lib/utils';
import { LucideIcon } from 'lucide-react';

interface StatCardProps {
  icon: LucideIcon;
  value: string | number;
  label: string;
  className?: string;
  color?: 'primary' | 'emerald' | 'amber' | 'blue';
}

const colorMap = {
  primary: { bg: 'bg-primary/10', text: 'text-primary' },
  emerald: { bg: 'bg-emerald-500/10', text: 'text-emerald-600 dark:text-emerald-400' },
  amber: { bg: 'bg-amber-500/10', text: 'text-amber-600 dark:text-amber-400' },
  blue: { bg: 'bg-blue-500/10', text: 'text-blue-600 dark:text-blue-400' },
};

export default function StatCard({ icon: Icon, value, label, className, color = 'primary' }: StatCardProps) {
  const c = colorMap[color];
  return (
    <div className={cn('glass-card p-4 animate-fade-in-up', className)}>
      <div className={cn('flex h-9 w-9 items-center justify-center rounded-xl', c.bg)}>
        <Icon className={cn('h-[18px] w-[18px]', c.text)} />
      </div>
      <p className="text-[22px] font-extrabold tracking-tight text-foreground mt-2.5 leading-none">{value}</p>
      <p className="text-[11px] text-muted-foreground font-medium mt-1">{label}</p>
    </div>
  );
}
