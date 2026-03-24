import { useState } from 'react'
import { toast } from 'sonner'
import PageHeader from '@/components/shared/PageHeader'
import BottomNav from '@/components/shared/BottomNav'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { useAuth } from '@/hooks/useAuth'
import { useHolidays, useCreateHoliday, useAssignHolidayToMr } from '@/hooks/useHolidays'
import { useManagerMrs } from '@/hooks/useManagerTeam'
import { useQuery } from '@tanstack/react-query'
import { supabase } from '@/lib/supabase'

interface ManagerHolidaysProps {
  embedded?: boolean
  useAdminScope?: boolean
}

export default function ManagerHolidays({ embedded = false, useAdminScope = false }: ManagerHolidaysProps) {
  const { user } = useAuth()
  const { data: holidays = [] } = useHolidays()
  const { data: managerMrs = [] } = useManagerMrs(user?.id ?? '')
  const { data: adminMrs = [] } = useQuery({
    queryKey: ['all-mrs-for-holidays'],
    enabled: useAdminScope && !!supabase,
    queryFn: async () => {
      if (!supabase) return []
      const { data, error } = await supabase
        .from('users')
        .select('id, full_name')
        .eq('role', 'mr')
        .eq('is_active', true)
        .order('full_name')
      if (error) throw error
      return data ?? []
    },
  })
  const mrs = useAdminScope ? adminMrs : managerMrs
  const createHoliday = useCreateHoliday()
  const assignHoliday = useAssignHolidayToMr()
  const [name, setName] = useState('')
  const [date, setDate] = useState('')
  const [type, setType] = useState<'national' | 'company'>('national')
  const [holidayId, setHolidayId] = useState('')
  const [selectedMrs, setSelectedMrs] = useState<string[]>([])

  return (
    <div className={embedded ? 'space-y-4' : 'min-h-screen bg-background pb-20'}>
      {!embedded && <PageHeader title="Holidays" />}
      <div className="p-4 space-y-4">
        <div className="rounded-xl border p-3 space-y-2">
          <p className="text-sm font-medium">Create Holiday</p>
          <Input value={name} onChange={e => setName(e.target.value)} placeholder="Holiday name" />
          <Input type="date" value={date} onChange={e => setDate(e.target.value)} />
          <select className="h-10 w-full border rounded-md px-2" value={type} onChange={e => setType(e.target.value as 'national' | 'company')}>
            <option value="national">National</option>
            <option value="company">Company</option>
          </select>
          <Button
            className="w-full"
            onClick={() =>
              void createHoliday
                .mutateAsync({ name, holiday_date: date, holiday_type: type, created_by: user?.id ?? '' })
                .then(() => toast.success('Holiday created'))
            }
          >
            Create
          </Button>
        </div>

        <div className="rounded-xl border p-3 space-y-2">
          <p className="text-sm font-medium">Assign Holidays to MRs</p>
          <select className="h-10 w-full border rounded-md px-2" value={holidayId} onChange={e => setHolidayId(e.target.value)}>
            <option value="">Select Holiday</option>
            {holidays.map(h => <option key={h.id} value={h.id}>{h.name} - {h.holiday_date}</option>)}
          </select>
          <div className="space-y-1">
            {mrs.map(mr => (
              <label key={mr.id} className="flex items-center gap-2 text-sm">
                <input
                  type="checkbox"
                  checked={selectedMrs.includes(mr.id)}
                  onChange={e =>
                    setSelectedMrs(prev => (e.target.checked ? [...prev, mr.id] : prev.filter(id => id !== mr.id)))
                  }
                />
                {mr.full_name}
              </label>
            ))}
          </div>
          <Button
            className="w-full"
            onClick={() =>
              void Promise.all(
                selectedMrs.map(mrId =>
                  assignHoliday.mutateAsync({ mrId, holidayId, assignedBy: user?.id ?? '' }),
                ),
              ).then(() => toast.success('Assigned to selected MRs'))
            }
          >
            Assign
          </Button>
        </div>
      </div>
      {!embedded && <BottomNav role="manager" />}
    </div>
  )
}
