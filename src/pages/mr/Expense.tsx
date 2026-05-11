import { useEffect, useMemo, useState } from 'react'
import { toast } from 'sonner'
import PageHeader from '@/components/shared/PageHeader'
import BottomNav from '@/components/shared/BottomNav'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { useAuth } from '@/hooks/useAuth'
import { todayInputDate } from '@/lib/dateUtils'
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
  const [category, setCategory] = useState('Travel')
  const [description, setDescription] = useState('')
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

  return (
    <div className="min-h-screen bg-background pb-24">
      <PageHeader title="Expense Report" showBack />

      <div className="px-4 py-5 space-y-5 max-w-lg mx-auto">
        {/* Date selector */}
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
                  : 'bg-card text-foreground border-border/60'
              )}
            >
              {dateLabels[i]}
            </button>
          ))}
        </div>

        {/* Balance card */}
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
              <p className={cn('text-lg font-extrabold tracking-tight', balance >= 0 ? 'text-emerald-600 dark:text-emerald-400' : 'text-destructive')}>
                {balance}
              </p>
            </div>
          </div>
        </div>

        {/* Add expense form */}
        <div className="glass-card p-4 space-y-3">
          <p className="text-sm font-bold text-foreground">Add Expense</p>

          <div className="space-y-1.5">
            <Label className="text-[11px] font-semibold text-muted-foreground">Category</Label>
            <select
              value={category}
              onChange={e => setCategory(e.target.value)}
              className="flex h-11 w-full rounded-xl border-2 border-border/60 bg-background px-3 text-sm font-medium focus:border-primary focus:outline-none transition-colors"
            >
              {['Travel', 'Food', 'Stationery', 'Printing', 'Communication', 'Other'].map(c => (
                <option key={c} value={c}>{c}</option>
              ))}
            </select>
          </div>

          <div className="space-y-1.5">
            <Label className="text-[11px] font-semibold text-muted-foreground">Description</Label>
            <Input
              value={description}
              onChange={e => setDescription(e.target.value)}
              placeholder="e.g. Bus fare to Pune"
              className="rounded-xl border-2 border-border/60 h-11 font-medium"
            />
          </div>

          <div className="space-y-1.5">
            <Label className="text-[11px] font-semibold text-muted-foreground">Amount (Rs)</Label>
            <Input
              type="number"
              value={amount}
              onChange={e => setAmount(e.target.value)}
              placeholder="0"
              className="rounded-xl border-2 border-border/60 h-11 font-medium"
            />
          </div>

          <Button
            className="w-full touch-target rounded-2xl bg-primary text-primary-foreground hover:bg-primary/90 font-bold"
            disabled={!report?.id || !amount}
            onClick={() =>
              void addItem
                .mutateAsync({
                  expense_report_id: report?.id ?? '',
                  category: category as never,
                  description,
                  amount: Number(amount || 0),
                })
                .then(() => {
                  setDescription('')
                  setAmount('')
                  toast.success('Expense added')
                })
            }
          >
            <Plus className="h-4 w-4 mr-1.5" /> Add Expense
          </Button>
        </div>

        {/* Items list */}
        {items.length > 0 && (
          <div className="space-y-2.5">
            <p className="section-title">Expenses ({items.length})</p>
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
                  onClick={() => void deleteItem.mutateAsync({ id: item.id })}
                  className="p-1.5 rounded-lg text-muted-foreground hover:text-destructive hover:bg-destructive/10 transition-colors"
                >
                  <Trash2 className="h-4 w-4" />
                </button>
              </div>
            ))}
          </div>
        )}

        {/* Submit */}
        <Button
          className="w-full touch-target rounded-2xl font-bold h-12 shadow-lg shadow-primary/20"
          disabled={!report?.id || totalUsed <= 0 || report.status === 'submitted'}
          onClick={() => void submitReport.mutateAsync(report?.id ?? '').then(() => toast.success('Expense submitted'))}
        >
          {report?.status === 'submitted' ? 'Already Submitted' : 'Submit Expense Report'}
        </Button>
      </div>

      <BottomNav role={user?.role === 'manager' ? 'manager' : 'mr'} />
    </div>
  )
}
