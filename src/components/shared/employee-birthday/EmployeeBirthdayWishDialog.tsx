import { useState } from 'react'
import { Cake, PartyPopper } from 'lucide-react'
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog'
import { Button } from '@/components/ui/button'
import { Textarea } from '@/components/ui/textarea'
import type { EmployeeBirthdayToday } from '@/types/database.types'

interface EmployeeBirthdayWishDialogProps {
  person: EmployeeBirthdayToday | null
  open: boolean
  onOpenChange: (open: boolean) => void
  onSendWish: (message: string) => Promise<void>
  onSkipToday: () => void
  isSending?: boolean
}

function personInitials(name: string) {
  return name
    .split(' ')
    .map(n => n[0])
    .join('')
    .slice(0, 2)
    .toUpperCase()
}

export default function EmployeeBirthdayWishDialog({
  person,
  open,
  onOpenChange,
  onSendWish,
  onSkipToday,
  isSending,
}: EmployeeBirthdayWishDialogProps) {
  const [message, setMessage] = useState('')

  const defaultMessage = person
    ? `Happy Birthday, ${person.full_name.split(' ')[0]}! 🎂 Wishing you health, happiness, and a great year ahead.`
    : ''

  const displayMessage = message || defaultMessage

  return (
    <Dialog
      open={open && !!person}
      onOpenChange={o => {
        if (!o) onOpenChange(false)
      }}
    >
      <DialogContent className="max-w-[380px] rounded-2xl border-amber-400/30 bg-gradient-to-b from-amber-500/10 to-background p-0 overflow-hidden gap-0">
        <div className="bg-gradient-to-br from-amber-500/25 via-pink-500/15 to-primary/10 px-5 pt-6 pb-4 text-center">
          <div className="mx-auto mb-3 flex h-14 w-14 items-center justify-center rounded-2xl bg-gradient-to-br from-amber-400 to-pink-500 shadow-lg">
            <Cake className="h-7 w-7 text-white" />
          </div>
          <DialogHeader className="space-y-1 text-center sm:text-center">
            <DialogTitle className="text-lg flex items-center justify-center gap-1.5">
              <PartyPopper className="h-5 w-5 text-amber-600" />
              Birthday today!
            </DialogTitle>
            <DialogDescription className="text-sm text-foreground/80">
              {person ? (
                <>
                  It&apos;s <span className="font-semibold text-foreground">{person.full_name}</span>
                  {person.designation ? ` · ${person.designation}` : ''}
                  {' '}({person.role})
                </>
              ) : (
                'Send a birthday wish to your colleague.'
              )}
            </DialogDescription>
          </DialogHeader>

          {person && (
            <div className="mt-4 flex justify-center">
              {person.profile_photo_url ? (
                <img
                  src={person.profile_photo_url}
                  alt=""
                  className="h-16 w-16 rounded-full object-cover ring-4 ring-background/80 shadow-md"
                />
              ) : (
                <div className="flex h-16 w-16 items-center justify-center rounded-full bg-primary/15 text-lg font-bold text-primary ring-4 ring-background/80">
                  {personInitials(person.full_name)}
                </div>
              )}
            </div>
          )}
        </div>

        <div className="px-5 py-4 space-y-3">
          <p className="text-xs text-muted-foreground text-center">
            Send your wishes — they&apos;ll see them on their dashboard today.
          </p>
          <Textarea
            value={displayMessage}
            onChange={e => setMessage(e.target.value)}
            onFocus={() => {
              if (!message) setMessage(defaultMessage)
            }}
            rows={4}
            className="rounded-xl resize-none text-sm"
            placeholder="Write a birthday message…"
          />
        </div>

        <DialogFooter className="flex-col gap-2 px-5 pb-5 sm:flex-col">
          <Button
            className="w-full rounded-xl font-semibold"
            disabled={isSending || !person}
            onClick={() => void onSendWish(displayMessage.trim())}
          >
            {isSending ? 'Sending…' : 'Send wishes 🎉'}
          </Button>
          <Button
            type="button"
            variant="ghost"
            className="w-full rounded-xl text-muted-foreground"
            onClick={() => {
              onSkipToday()
              onOpenChange(false)
            }}
          >
            Remind me later today
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  )
}
