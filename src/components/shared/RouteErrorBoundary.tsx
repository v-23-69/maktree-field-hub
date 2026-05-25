import { Component, type ErrorInfo, type ReactNode } from 'react'
import { useNavigate } from 'react-router-dom'
import { Button } from '@/components/ui/button'
import { reportError } from '@/lib/observability'

interface Props {
  children: ReactNode
  /** Short label for monitoring, e.g. "mr-dashboard" */
  scope: string
  fallbackPath?: string
}

interface State {
  hasError: boolean
}

function RouteErrorFallback({
  scope,
  fallbackPath,
  onRetry,
}: {
  scope: string
  fallbackPath?: string
  onRetry: () => void
}) {
  const navigate = useNavigate()

  return (
    <div className="flex min-h-[50vh] flex-col items-center justify-center gap-4 px-6 text-center">
      <p className="text-lg font-semibold text-foreground">This screen could not load</p>
      <p className="max-w-sm text-sm text-muted-foreground">
        A temporary error occurred ({scope}). Your data is safe — try again or go back.
      </p>
      <div className="flex flex-wrap gap-2 justify-center">
        <Button type="button" variant="default" className="rounded-lg" onClick={onRetry}>
          Try again
        </Button>
        {fallbackPath && (
          <Button
            type="button"
            variant="outline"
            className="rounded-lg"
            onClick={() => navigate(fallbackPath)}
          >
            Go to dashboard
          </Button>
        )}
      </div>
    </div>
  )
}

export default class RouteErrorBoundary extends Component<Props, State> {
  state: State = { hasError: false }

  static getDerivedStateFromError(): State {
    return { hasError: true }
  }

  componentDidCatch(error: Error, info: ErrorInfo) {
    void reportError(error, { scope: this.props.scope, componentStack: 'present' })
    if (import.meta.env.DEV) {
      console.error('RouteErrorBoundary', this.props.scope, error, info.componentStack)
    }
  }

  handleRetry = () => {
    this.setState({ hasError: false })
  }

  render() {
    if (this.state.hasError) {
      return (
        <RouteErrorFallback
          scope={this.props.scope}
          fallbackPath={this.props.fallbackPath}
          onRetry={this.handleRetry}
        />
      )
    }
    return this.props.children
  }
}
