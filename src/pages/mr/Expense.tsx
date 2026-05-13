import { useEffect, useMemo, useState } from 'react'
import { toast } from 'sonner'
import PageHeader from '@/components/shared/PageHeader'
import BottomNav from '@/components/shared/BottomNav'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { useAuth } from '@/hooks/useAuth'
import { todayInputDate } from '@/lib/dateUtils'
import {
  EXPENSE_CATEGORY_OPTIONS,
  expenseDescriptionForSave,
  type ExpenseCategoryOption,
} from '@/lib/expenseCategories'
import { Trash2, Plus, IndianRupee } from 'lucide-react'
import { cn } from '@/lib/utils'
import {
  useExpenseItems,
  useExpenseReport,
  useAddExpenseItem,
  useDeleteExpenseItem,
  useSubmitExpenseReport,
  useGetOrCreateExpenseReport,
} from '@/hooks/useExpense'

export default function MRExpense() {
  const { user } = useAuth()
  const dateOptions = useMemo(() => {
    const today = new Date()
    return [0, 1, 2].map(offset => {
      const d = new Date(today)
      d.setDate(today.getDate() - offset)
      return d.toISOString().slice(0, 10)
    })
  }, [])
  const [date, setDate] = useState(todayInputDate())
  const [category, setCategory] = useState<ExpenseCategoryOption>('Food')
  const [otherDetail, setOtherDetail] = useState('')
  const [amount, setAmount] = useState('')
  const [createAttemptedKey, setCreateAttemptedKey] = useState<string | null>(null)
  const { data: report } = useExpenseReport(user?.id ?? '', date)
  const { data: items = [] } = useExpenseItems(report?.id)
  const addItem = useAddExpenseItem()
  const deleteItem = useDeleteExpenseItem()
  const submitReport = useSubmitExpenseReport()
  const getOrCreateReport = useGetOrCreateExpenseReport()
  const totalUsed = useMemo(() => items.reduce((sum, item) => sum + Number(item.amount || 0), 0), [items])
  const dailyLimit = Number(report?.daily_limit ?? 300)
  const balance = dailyLimit - totalUsed

  useEffect(() => {
    if (!user?.id || !date) return
    if (report?.id) return
    const requestKey = `${user.id}-${date}`
    if (createAttemptedKey === requestKey) return
    setCreateAttemptedKey(requestKey)
    void getOrCreateReport.mutateAsync({ mrId: user.id, date }).catch(() => {})
  }, [user?.id, date, report?.id, getOrCreateReport, createAttemptedKey])

  const dateLabels = ['Today', 'Yesterday', 'Day Before']

  const descriptionToSave = expenseDescriptionForSave(category, otherDetail)
  const canAdd =
    !!report?.id &&
    !!amount &&
    Number(amount) > 0 &&
    (category !== 'Other' || otherDetail.trim().length > 0)

  const handleAdd = () => {
    if (!report?.id) return
    if (category === 'Other' && !otherDetail.trim()) {
      toast.error('Describe the expense when you choose Other')
      return
    }
    void addItem
      .mutateAsync({
        expense_report_id: report.id,
        category,
        description: descriptionToSave,
        amount: Number(amount || 0),
      })
      .then(() => {
        setOtherDetail('')
        setAmount('')
        toast.success('Expense added')
      })
      .catch(() => toast.error('Could not add expense'))
  }

  return (
    <div className="min-h-screen bg-background pb-24">
      <PageHeader title="Expense Report" showBack />

      <div className="px-4 md:px-6 py-5 space-y-5 max-w-lg md:max-w-2xl lg:max-w-4xl mx-auto">
        <div className="flex gap-2">
          {dateOptions.map((option, i) => (
            <button
              key={option}
              type="button"
              onClick={() => setDate(option)}
              className={cn(
                'flex-1 rounded-2xl py-2.5 text-xs font-semibold border-2 transition-all active:scale-95',
                date === option
                  ? 'bg-primary text-primary-foreground border-primary shadow-sm shadow-primary/20'
                  : 'bg-card text-foreground border-border/60',
              )}
            >
              {dateLabels[i]}
            </button>
          ))}
        </div>

        <div className="rounded-2xl bg-gradient-to-br from-primary/10 via-primary/5 to-background border border-primary/10 p-4">
          <div className="grid grid-cols-3 gap-3 text-center">
            <div>
              <p className="text-[10px] text-muted-foreground font-medium uppercase tracking-wider">Limit</p>
              <p className="text-lg font-extrabold text-foreground tracking-tight">{dailyLimit}</p>
            </div>
            <div>
              <p className="text-[10px] text-muted-foreground font-medium uppercase tracking-wider">Used</p>
              <p className="text-lg font-extrabold text-foreground tracking-tight">{totalUsed}</p>
            </div>
            <div>
              <p className="text-[10px] text-muted-foreground font-medium uppercase tracking-wider">Balance</p>
              <p
                className={cn(
                  'text-lg font-extrabold tracking-tight',
                  balance >= 0 ? 'text-emerald-600 dark:text-emerald-400' : 'text-destructive',
                )}
              >
                {balance}
              </p>
            </div>
          </div>
        </div>

        <div className="glass-card p-4 space-y-4">
          <div>
            <p className="text-sm font-bold text-foreground">Add expense</p>
            <p className="text-[11px] text-muted-foreground mt-0.5">Tap a category, enter amount, then add.</p>
          </div>

          <div className="space-y-1.5">
            <Label className="text-[11px] font-semibold text-muted-foreground">Category</Label>
            <div className="grid grid-cols-2 sm:grid-cols-3 gap-2">
              {EXPENSE_CATEGORY_OPTIONS.map(c => (
                <button
                  key={c}
                  type="button"
                  onClick={() => {
                    setCategory(c)
                    if (c !== 'Other') setOtherDetail('')
                  }}
                  className={cn(
                    'rounded-xl border-2 py-2.5 px-2 text-xs font-semibold transition-all active:scale-[0.98]',
                    category === c
                      ? 'border-primary bg-primary/10 text-primary'
                      : 'border-border/60 bg-card text-foreground hover:border-primary/40',
                  )}
                >
                  {c}
                </button>
              ))}
            </div>
          </div>

          {category === 'Other' && (
            <div className="space-y-1.5 animate-fade-in">
              <Label className="text-[11px] font-semibold text-muted-foreground">Describe expense</Label>
              <Input
                value={otherDetail}
                onChange={e => setOtherDetail(e.target.value)}
                placeholder="What was this for?"
                className="rounded-xl border-2 border-border/60 h-11 font-medium"
                autoComplete="off"
              />
            </div>
          )}

          <div className="space-y-1.5">
            <Label className="text-[11px] font-semibold text-muted-foreground">Amount (Rs)</Label>
            <Input
              type="number"
              inputMode="decimal"
              min={0}
              value={amount}
              onChange={e => setAmount(e.target.value)}
              placeholder="0"
              className="rounded-xl border-2 border-border/60 h-11 font-medium text-lg"
            />
          </div>

          <Button
            className="w-full touch-target rounded-2xl bg-primary text-primary-foreground hover:bg-primary/90 font-bold h-12"
            disabled={!canAdd || addItem.isPending || report?.status === 'submitted'}
            onClick={() => void handleAdd()}
          >
            <Plus className="h-4 w-4 mr-1.5" />
            {addItem.isPending ? 'Adding…' : 'Add to list'}
          </Button>
        </div>

        {items.length > 0 && (
          <div className="space-y-2.5 md:grid md:grid-cols-2 md:gap-3 md:space-y-0">
            <p className="section-title md:col-span-2">Today&apos;s lines ({items.length})</p>
            <div className="space-y-2.5 md:grid md:grid-cols-2 md:gap-3 md:space-y-0 md:col-span-2">
              {items.map(item => (
                <div key={item.id} className="glass-card p-3.5 flex items-center gap-3">
                  <div className="h-9 w-9 rounded-xl bg-primary/10 flex items-center justify-center shrink-0">
                    <IndianRupee className="h-4 w-4 text-primary" />
                  </div>
                  <div className="flex-1 min-w-0">
                    <p className="text-sm font-semibold text-foreground">{item.category}</p>
                    <p className="text-[11px] text-muted-foreground truncate">{item.description || '—'}</p>
                  </div>
                  <p className="text-sm font-bold text-foreground tabular-nums shrink-0">Rs {item.amount}</p>
                  <button
                    type="button"
                    disabled={report?.status === 'submitted' || deleteItem.isPending}
                    onClick={() =>
                      void deleteItem
                        .mutateAsync({ id: item.id, expense_report_id: item.expense_report_id })
                        .then(() => toast.success('Removed'))
                    }
                    className="p-1.5 rounded-lg text-muted-foreground hover:text-destructive hover:bg-destructive/10 transition-colors disabled:opacity-40"
                  >
                    <Trash2 className="h-4 w-4" />
                  </button>
                </div>
              ))}
            </div>
          </div>
        )}

        <Button
          className="w-full touch-target rounded-2xl font-bold h-12 shadow-lg shadow-primary/20"
          disabled={!report?.id || totalUsed <= 0 || report.status === 'submitted' || submitReport.isPending}
          onClick={() =>
            void submitReport
              .mutateAsync(report?.id ?? '')
              .then(() => toast.success('Expense report submitted'))
              .catch(() => toast.error('Submit failed'))
          }
        >
          {report?.status === 'submitted' ? 'Already submitted' : submitReport.isPending ? 'Submitting…' : 'Submit expense report'}
        </Button>
      </div>

      <BottomNav role={user?.role === 'manager' ? 'manager' : 'mr'} />
    </div>
  )
}
