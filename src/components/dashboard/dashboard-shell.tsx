import { cn } from '@/lib/utils'



/** Shared panel chrome so dashboard blocks feel like one system. */

export function dashboardPanelClass(className?: string) {

  return cn(

    'rounded-2xl border border-border/80 bg-card text-card-foreground shadow-sm',

    className,

  )

}



/**

 * Responsive page shell:

 * - phone: narrow single column

 * - tablet (md): wider canvas, room for 2-column sections

 * - laptop (lg+): full dashboard width

 */

export function dashboardPageClass(className?: string) {

  return cn(

    'mx-auto w-full px-4 py-5 space-y-5',

    'max-w-lg',

    'md:px-8 md:py-6 md:max-w-3xl md:space-y-6',

    'lg:px-10 lg:max-w-5xl lg:space-y-6',

    'xl:max-w-6xl',

    className,

  )

}



/** Two columns from tablet portrait upward. */

export function dashboardTablet2Col(className?: string) {

  return cn(

    'grid grid-cols-1 gap-5',

    'md:grid-cols-2 md:gap-5',

    'lg:gap-6',

    className,

  )

}



/** Three columns on large tablet / laptop. */

export function dashboardTablet3Col(className?: string) {

  return cn(

    'grid grid-cols-1 gap-4',

    'md:grid-cols-2 md:gap-4',

    'lg:grid-cols-3 lg:gap-5',

    className,

  )

}



type DashboardSectionProps = {

  title: string

  description?: string

  action?: React.ReactNode

  children: React.ReactNode

  className?: string

}



export function DashboardSection({

  title,

  description,

  action,

  children,

  className,

}: DashboardSectionProps) {

  return (

    <section className={cn('space-y-3 md:space-y-4', className)}>

      <div className="flex items-start justify-between gap-3">

        <div className="min-w-0">

          <h2 className="text-sm md:text-base font-semibold text-foreground tracking-tight">{title}</h2>

          {description && (

            <p className="text-xs md:text-sm text-muted-foreground mt-0.5 leading-relaxed">{description}</p>

          )}

        </div>

        {action}

      </div>

      {children}

    </section>

  )

}


