import { useMemo, useState } from 'react'
import { useLocation } from 'react-router-dom'
import { Lock } from 'lucide-react'
import { toast } from 'sonner'
import { supabase } from '@/lib/supabase'
import { Button } from '@/components/ui/button'
import { Textarea } from '@/components/ui/textarea'

export default function BlockedComplaint() {
  const location = useLocation()
  const blockReason = (location.state as { blockReason?: string } | null)?.blockReason
  const [complaint, setComplaint] = useState('')
  const [done, setDone] = useState(false)
  const employeeCode = useMemo(() => localStorage.getItem('last_employee_code') ?? '', [])

  const handleSubmit = async () => {
    if (!supabase) return
    if (!employeeCode.trim()) {
      toast.error('Employee code not found. Please try login again.')
      return
    }
    if (complaint.trim().length < 50) {
      toast.error('Complaint must be at least 50 characters')
      return
    }
    const { data, error } = await supabase.rpc('login_lookup_by_employee_code', {
      p_employee_code: employeeCode,
    })
    if (error) {
      toast.error(error.message)
      return
    }
    const row = Array.isArray(data) ? data[0] : data
    let userId = row?.user_id ?? row?.id
    if (!userId) {
      const { data: uData, error: uErr } = await supabase
        .from('users')
        .select('id')
        .eq('employee_code', employeeCode)
        .maybeSingle()
      if (uErr) {
        toast.error(uErr.message)
        return
      }
      userId = uData?.id
    }
    if (!userId) {
      toast.error('Could not identify user from employee code')
      return
    }
    const { error: insertError } = await supabase.from('block_complaints').insert({
      user_id: userId,
      complaint: complaint.trim(),
    })
    if (insertError) {
      toast.error(insertError.message)
      return
    }
    setDone(true)
  }

  return (
    <div className="min-h-screen bg-background p-4 flex items-center justify-center">
      <div className="w-full max-w-md space-y-4 rounded-xl border p-4">
        <div className="flex items-center gap-2 text-destructive">
          <Lock className="h-5 w-5" />
          <h1 className="font-semibold">Your account has been blocked</h1>
        </div>
        <p className="text-sm text-muted-foreground">Reason: {blockReason || 'Not provided'}</p>
        {done ? (
          <p className="text-sm text-emerald-700">
            Your complaint has been sent to admin. We will review and respond.
          </p>
        ) : (
          <>
            <p className="text-sm font-medium">Write to Administration</p>
            <Textarea
              className="min-h-28"
              value={complaint}
              onChange={e => setComplaint(e.target.value)}
              placeholder="Please describe your issue in detail..."
            />
            <Button className="w-full" onClick={() => void handleSubmit()}>
              Submit
            </Button>
          </>
        )}
      </div>
    </div>
  )
}
