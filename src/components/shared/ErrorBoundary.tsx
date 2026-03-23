import { Component, type ErrorInfo, type ReactNode } from 'react'
import { Button } from '@/components/ui/button'

interface Props {
  children: ReactNode
}

interface State {
  hasError: boolean
  message: string
}

export default class ErrorBoundary extends Component<Props, State> {
  constructor(props: Props) {
    super(props)
    this.state = { hasError: false, message: '' }
  }

  static getDerivedStateFromError(error: Error): State {
    return { hasError: true, message: error.message || 'Something went wrong' }
  }

  componentDidCatch(error: Error, info: ErrorInfo) {
    console.error('ErrorBoundary:', error, info.componentStack)
  }

  render() {
    if (this.state.hasError) {
      return (
        <div className="flex min-h-[100dvh] flex-col items-center justify-center bg-background px-6 text-center">
          <p className="text-lg font-semibold text-foreground">Something went wrong</p>
          <p className="mt-2 max-w-sm text-sm text-muted-foreground">
            {this.state.message}
          </p>
          <Button
            type="button"
            className="mt-6 touch-target rounded-lg"
            onClick={() => {
              this.setState({ hasError: false, message: '' })
              window.location.reload()
            }}
          >
            Refresh
          </Button>
        </div>
      )
    }
    return this.props.children
  }
}
