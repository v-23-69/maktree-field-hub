/**
 * Production-safe error reporting. No PHI in context payloads.
 * Set VITE_SENTRY_DSN to enable Sentry (loaded on first report only).
 */

type ErrorContext = Record<string, string>

let sentryInitPromise: Promise<void> | null = null

async function ensureSentry(): Promise<boolean> {
  const dsn = import.meta.env.VITE_SENTRY_DSN as string | undefined
  if (!dsn?.trim()) return false

  if (!sentryInitPromise) {
    sentryInitPromise = (async () => {
      const Sentry = await import('@sentry/react')
      if (!Sentry.getClient()) {
        Sentry.init({
          dsn,
          environment: import.meta.env.MODE,
          tracesSampleRate: 0.05,
          beforeSend(event) {
            if (event.request?.cookies) delete event.request.cookies
            return event
          },
        })
      }
    })()
  }
  await sentryInitPromise
  return true
}

export async function reportError(error: unknown, context?: ErrorContext): Promise<void> {
  const safeContext = context
    ? Object.fromEntries(
        Object.entries(context).filter(
          ([k]) => !/email|password|mobile|aadhaar|token|secret/i.test(k),
        ),
      )
    : undefined

  if (import.meta.env.DEV) {
    console.error('[maktree]', safeContext ?? {}, error)
  }

  try {
    if (await ensureSentry()) {
      const Sentry = await import('@sentry/react')
      Sentry.captureException(error, { extra: safeContext })
    }
  } catch {
    /* monitoring must not break app */
  }
}

export function reportMessage(message: string, context?: ErrorContext): void {
  void reportError(new Error(message), context)
}
