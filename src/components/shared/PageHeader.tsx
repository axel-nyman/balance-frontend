import { ReactNode } from 'react'

interface PageHeaderProps {
  title: string
  /** Inline element rendered next to the title (e.g., an edit affordance) */
  titleAction?: ReactNode
  description?: ReactNode
  action?: ReactNode
  /** Left-side navigation element (e.g., back link) */
  backLink?: ReactNode
}

export function PageHeader({ title, titleAction, description, action, backLink }: PageHeaderProps) {
  return (
    <div className="mb-4">
      {backLink && <div className="mb-2">{backLink}</div>}
      <div className="flex flex-col gap-1 sm:flex-row sm:items-center sm:justify-between">
        <div>
          <div className="flex items-center gap-1.5">
            <h1 className="text-2xl font-semibold tracking-tight text-foreground">{title}</h1>
            {titleAction}
          </div>
          {description && (
            typeof description === 'string' ? (
              <p className="text-sm text-muted-foreground mt-1">{description}</p>
            ) : (
              <div className="mt-1">{description}</div>
            )
          )}
        </div>
        {action && <div className="mt-4 sm:mt-0">{action}</div>}
      </div>
    </div>
  )
}
