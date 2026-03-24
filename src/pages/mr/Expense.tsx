import { useEffect, useMemo, useState } from 'react'
import { toast } from 'sonner'
import PageHeader from '@/components/shared/PageHeader'
import BottomNav from '@/components/shared/BottomNav'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { useAuth } from '@/hooks/useAuth'
import { todayInputDate } from '@/lib/dateUtils'
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
  const { data: report } = useExpenseReport(user?.id ?? '', date)
  const { data: items = [] } = useExpenseItems(report?.id)
  const addItem = useAddExpenseItem()
  const deleteItem = useDeleteExpenseItem()
  const submitReport = useSubmitExpenseReport()
  const getOrCreateReport = useGetOrCreateExpenseReport()
  const totalUsed = useMemo(() => items.reduce((sum, item) => sum + Number(item.amount || 0), 0), [items])
  const dailyLimit = Number(report?.daily_limit ?? 300)

  useEffect(() => {
    if (!user?.id || !date) return
    if (report?.id) return
    void getOrCreateReport.mutateAsync({ mrId: user.id, date }).catch(() => {
      // ignore; page already shows read-only error via queries if needed
    })
  }, [user?.id, date, report?.id, getOrCreateReport])

  return (
    <div className="min-h-screen bg-background pb-20">
      <PageHeader title="Expense" />
      <div className="p-4 space-y-4">
        <div className="grid grid-cols-3 gap-2">
          {dateOptions.map(option => (
            <Button
              key={option}
              type="button"
              variant={date === option ? 'default' : 'outline'}
              className="text-xs"
              onClick={() => setDate(option)}
            >
              {option === dateOptions[0] ? 'Today' : option === dateOptions[1] ? 'Yesterday' : 'Day -2'}
            </Button>
          ))}
        </div>
        <div className="rounded-xl border p-3 text-sm space-y-1">
          <p>Daily Limit: Rs {dailyLimit}</p>
          <p>Used: Rs {totalUsed}</p>
          <p className={dailyLimit - totalUsed >= 0 ? 'text-emerald-700' : 'text-destructive'}>
            Balance: Rs {dailyLimit - totalUsed}
          </p>
        </div>
        <div className="rounded-xl border p-3 space-y-2">
          <select value={category} onChange={e => setCategory(e.target.value)} className="h-10 w-full border rounded-md px-2">
            {['Travel', 'Food', 'Stationery', 'Printing', 'Communication', 'Other'].map(c => (
              <option key={c} value={c}>{c}</option>
            ))}
          </select>
          <Input value={description} onChange={e => setDescription(e.target.value)} placeholder="Description" />
          <Input type="number" value={amount} onChange={e => setAmount(e.target.value)} placeholder="Amount" />
          <Button
            className="w-full"
            disabled={!report?.id}
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
                  toast.success('Expense item added')
                })
            }
          >
            + Add Expense
          </Button>
        </div>
        <div className="space-y-2">
          {items.map(item => (
            <div key={item.id} className="rounded-xl border p-3 flex items-center justify-between gap-2">
              <div>
                <p className="text-sm">{item.category} - Rs {item.amount}</p>
                <p className="text-xs text-muted-foreground">{item.description}</p>
              </div>
              <Button variant="destructive" size="sm" onClick={() => void deleteItem.mutateAsync({ id: item.id })}>Delete</Button>
            </div>
          ))}
        </div>
        <Button
          className="w-full"
          disabled={!report?.id || totalUsed <= 0 || report.status === 'submitted'}
          onClick={() => void submitReport.mutateAsync(report?.id ?? '').then(() => toast.success('Expense submitted'))}
        >
          {report?.status === 'submitted' ? 'Already Submitted' : 'Submit Expense'}
        </Button>
      </div>
      <BottomNav role="mr" />
    </div>
  )
}
