import { Button } from '@/components/ui/button'
import { useMarkSundayDcr } from '@/hooks/useReport'
import { toast } from 'sonner'
import { cn } from '@/lib/utils'

interface Props {
  reportDate: string
  className?: string
  label?: string
}

export default function MarkSundayDcrButton({ reportDate, className, label = 'Mark Sunday DCR' }: Props) {
  const markSunday = useMarkSundayDcr()

  return (
    <Button
      type="button"
      className={cn(
        'rounded-xl h-10 text-xs font-bold bg-sky-600 hover:bg-sky-700 text-white',
        className,
      )}
      disabled={markSunday.isPending}
      onClick={() => {
        void markSunday
          .mutateAsync(reportDate)
          .then(() => toast.success('Sunday DCR submitted'))
          .catch(e => toast.error(e instanceof Error ? e.message : 'Could not submit'))
      }}
    >
      {markSunday.isPending ? 'Submitting…' : label}
    </Button>
  )
}
