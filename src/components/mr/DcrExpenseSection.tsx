import { useEffect, useMemo, useState } from 'react'
import { toast } from 'sonner'
import { IndianRupee, Plus, Trash2 } from 'lucide-react'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Checkbox } from '@/components/ui/checkbox'
import { cn } from '@/lib/utils'
import {
  EXPENSE_CATEGORY_OPTIONS,
  expenseDescriptionForSave,
  type ExpenseCategoryOption,
} from '@/lib/expenseCategories'
import {
  useAddExpenseItem,
  useDeleteExpenseItem,
  useExpenseItems,
  useExpenseReport,
  useGetOrCreateExpenseReport,
} from '@/hooks/useExpense'

type Props = {
  mrId: string
  reportDate: string
  skipExpense: boolean
  onSkipChange: (skip: boolean) => void
}

export default function DcrExpenseSection({ mrId, reportDate, skipExpense, onSkipChange }: Props) {
  const [category, setCategory] = useState<ExpenseCategoryOption>('Food')
  const [otherDetail, setOtherDetail] = useState('')
  const [amount, setAmount] = useState('')
  const [createKey, setCreateKey] = useState<string | null>(null)

  const { data: report, isLoading: reportLoading } = useExpenseReport(mrId, reportDate)
  const getOrCreate = useGetOrCreateExpenseReport()
  const { data: items = [] } = useExpenseItems(skipExpense ? undefined : report?.id)
  const addItem = useAddExpenseItem()
  const deleteItem = useDeleteExpenseItem()

  const totalUsed = useMemo(() => items.reduce((s, i) => s + Number(i.amount || 0), 0), [items])
  const dailyLimit = Number(report?.daily_limit ?? 300)
  const balance = dailyLimit - totalUsed
  const isSubmitted = report?.status === 'submitted'

  useEffect(() => {
    if (!mrId || !reportDate || skipExpense || report?.id) return
    const key = `${mrId}-${reportDate}`
    if (createKey === key) return
    setCreateKey(key)
    void getOrCreate.mutateAsync({ mrId, date: reportDate }).catch(() => {
      setCreateKey(null)
    })
  }, [mrId, reportDate, skipExpense, report?.id, getOrCreate, createKey])

  const canAdd =
    !skipExpense &&
    !!report?.id &&
    !isSubmitted &&
    !!amount &&
    Number(amount) > 0 &&
    (category !== 'Other' || otherDetail.trim().length > 0)

  const handleAdd = () => {
    if (!report?.id) return
    void addItem
      .mutateAsync({
        expense_report_id: report.id,
        category,
        description: expenseDescriptionForSave(category, otherDetail),
        amount: Number(amount),
      })
      .then(() => {
        setAmount('')
        setOtherDetail('')
        toast.success('Expense line added')
      })
      .catch(() => toast.error('Could not add expense'))
  }

  return (
    <div className="rounded-2xl border border-border/70 bg-card p-4 space-y-4">
      <div className="flex items-start justify-between gap-3">
        <div>
          <p className="text-sm font-bold text-foreground">Expense report (optional)</p>
          <p className="text-[11px] text-muted-foreground mt-0.5">
            Add lines here or skip. Submitted together with your DCR.
          </p>
        </div>
        <label className="flex items-center gap-2 shrink-0 cursor-pointer">
          <Checkbox checked={skipExpense} onCheckedChange={v => onSkipChange(v === true)} />
          <span className="text-xs text-muted-foreground">Skip</span>
        </label>
      </div>

      {!skipExpense && (
        <>
          {reportLoading && !report?.id ? (
            <p className="text-xs text-muted-foreground">Loading expense report…</p>
          ) : (
            <>
              <div className="grid grid-cols-3 gap-2 text-center text-xs">
                <div className="rounded-lg bg-muted/40 p-2">
                  <p className="text-muted-foreground">Limit</p>
                  <p className="font-bold tabular-nums">{dailyLimit}</p>
                </div>
                <div className="rounded-lg bg-muted/40 p-2">
                  <p className="text-muted-foreground">Used</p>
                  <p className="font-bold tabular-nums">{totalUsed}</p>
                </div>
                <div className="rounded-lg bg-muted/40 p-2">
                  <p className="text-muted-foreground">Balance</p>
                  <p
                    className={cn(
                      'font-bold tabular-nums',
                      balance >= 0 ? 'text-emerald-600' : 'text-destructive',
                    )}
                  >
                    {balance}
                  </p>
                </div>
              </div>

              {isSubmitted && (
                <p className="text-xs text-emerald-700 dark:text-emerald-400 font-medium">
                  Expense report already submitted for this date.
                </p>
              )}

              {!isSubmitted && (
                <div className="space-y-3">
                  <div className="grid grid-cols-2 gap-2">
                    {EXPENSE_CATEGORY_OPTIONS.map(c => (
                      <button
                        key={c}
                        type="button"
                        onClick={() => {
                          setCategory(c)
                          if (c !== 'Other') setOtherDetail('')
                        }}
                        className={cn(
                          'rounded-xl border py-2 text-xs font-semibold',
                          category === c
                            ? 'border-primary bg-primary/10 text-primary'
                            : 'border-border bg-background',
                        )}
                      >
                        {c}
                      </button>
                    ))}
                  </div>

                  {category === 'Other' && (
                    <Input
                      value={otherDetail}
                      onChange={e => setOtherDetail(e.target.value)}
                      placeholder="Describe expense"
                      className="h-10 rounded-xl"
                    />
                  )}

                  <div className="space-y-1">
                    <Label className="text-[11px]">Amount (Rs)</Label>
                    <Input
                      type="number"
                      min={0}
                      value={amount}
                      onChange={e => setAmount(e.target.value)}
                      className="h-10 rounded-xl"
                    />
                  </div>

                  <Button
                    type="button"
                    variant="outline"
                    className="w-full h-10 rounded-xl"
                    disabled={!canAdd || addItem.isPending}
                    onClick={handleAdd}
                  >
                    <Plus className="h-4 w-4 mr-1" />
                    Add expense
                  </Button>
                </div>
              )}

              {items.length > 0 && (
                <div className="space-y-2">
                  {items.map(item => (
                    <div
                      key={item.id}
                      className="flex items-center gap-2 rounded-xl border border-border/60 bg-muted/20 p-2.5"
                    >
                      <IndianRupee className="h-4 w-4 text-primary shrink-0" />
                      <div className="flex-1 min-w-0">
                        <p className="text-xs font-semibold">{item.category}</p>
                        <p className="text-[10px] text-muted-foreground truncate">
                          {item.description || '—'}
                        </p>
                      </div>
                      <p className="text-xs font-bold tabular-nums shrink-0">Rs {item.amount}</p>
                      {!isSubmitted && (
                        <button
                          type="button"
                          className="p-1 text-muted-foreground hover:text-destructive"
                          onClick={() =>
                            void deleteItem.mutateAsync({
                              id: item.id,
                              expense_report_id: item.expense_report_id,
                            })
                          }
                        >
                          <Trash2 className="h-4 w-4" />
                        </button>
                      )}
                    </div>
                  ))}
                </div>
              )}
            </>
          )}
        </>
      )}
    </div>
  )
}
