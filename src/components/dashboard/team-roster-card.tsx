import * as React from 'react'
import { motion, AnimatePresence } from 'framer-motion'
import { Link } from 'react-router-dom'
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar'
import { Badge } from '@/components/ui/badge'
import { cn } from '@/lib/utils'
import { Users } from 'lucide-react'

export type TeamRosterMember = {
  id: string
  name: string
  subtitle?: string
  avatar?: string
  badge?: string
}

type Props = {
  title?: string
  description?: string
  folderName: string
  itemCount?: number
  members: TeamRosterMember[]
  viewAllHref?: string
  viewAllLabel?: string
  className?: string
}

export default function TeamRosterCard({
  title = 'Team',
  description = 'People in your field team.',
  folderName,
  itemCount,
  members,
  viewAllHref,
  viewAllLabel = 'View team',
  className,
}: Props) {
  const listVariants = {
    hidden: { opacity: 0 },
    visible: { opacity: 1, transition: { staggerChildren: 0.05 } },
  }

  const itemVariants = {
    hidden: { opacity: 0, y: 8 },
    visible: { opacity: 1, y: 0 },
  }

  return (
    <div
      className={cn(
        'w-full rounded-2xl border border-border/80 bg-card p-5 shadow-sm text-card-foreground space-y-5',
        className,
      )}
    >
      <div className="flex items-center justify-between gap-3">
        <div className="min-w-0">
          <h2 className="text-base font-semibold text-foreground">{title}</h2>
          <p className="text-xs text-muted-foreground mt-0.5">{description}</p>
        </div>
        <div className="flex items-center gap-1 text-muted-foreground shrink-0">
          <Users className="h-4 w-4" />
          <span className="text-xs font-medium">{members.length}</span>
        </div>
      </div>

      <div className="flex items-center gap-3 rounded-xl bg-muted/40 px-3 py-2.5">
        <div className="flex h-11 w-11 items-center justify-center rounded-lg bg-primary/10 text-primary shrink-0">
          <Users className="h-5 w-5" />
        </div>
        <div className="min-w-0">
          <p className="font-medium text-sm text-foreground truncate">{folderName}</p>
          {itemCount !== undefined && (
            <p className="text-xs text-muted-foreground">{itemCount} members</p>
          )}
        </div>
      </div>

      <div className="space-y-2">
        <h3 className="text-xs font-semibold text-muted-foreground uppercase tracking-wider">Members</h3>
        <motion.ul
          className="space-y-2.5"
          variants={listVariants}
          initial="hidden"
          animate="visible"
        >
          <AnimatePresence>
            {members.slice(0, 6).map(user => (
              <motion.li
                key={user.id}
                variants={itemVariants}
                layout
                className="flex items-center justify-between gap-2"
              >
                <div className="flex items-center gap-3 min-w-0">
                  <Avatar className="h-9 w-9">
                    <AvatarImage src={user.avatar} alt={user.name} />
                    <AvatarFallback className="text-xs">
                      {user.name
                        .split(' ')
                        .map(n => n[0])
                        .join('')
                        .slice(0, 2)
                        .toUpperCase()}
                    </AvatarFallback>
                  </Avatar>
                  <div className="min-w-0">
                    <p className="text-sm font-medium text-foreground truncate">{user.name}</p>
                    {user.subtitle && (
                      <p className="text-xs text-muted-foreground truncate">{user.subtitle}</p>
                    )}
                  </div>
                </div>
                {user.badge && (
                  <Badge variant="secondary" className="shrink-0 text-[10px] font-medium">
                    {user.badge}
                  </Badge>
                )}
              </motion.li>
            ))}
          </AnimatePresence>
        </motion.ul>
      </div>

      {viewAllHref && members.length > 0 && (
        <Link
          to={viewAllHref}
          className="block text-center text-sm font-medium text-primary hover:text-primary/90 py-1"
        >
          {viewAllLabel} →
        </Link>
      )}
    </div>
  )
}
