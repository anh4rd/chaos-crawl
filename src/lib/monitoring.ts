import * as Sentry from "@sentry/react";

export function initMonitoring() {
  const dsn = import.meta.env.VITE_SENTRY_DSN;
  if (!dsn || import.meta.env.MODE === "test") return;

  Sentry.init({
    dsn,
    environment:
      import.meta.env.VITE_SENTRY_ENVIRONMENT || import.meta.env.MODE,
    release: import.meta.env.VITE_SENTRY_RELEASE || undefined,
    dataCollection: {
      userInfo: false,
      cookies: false,
      httpHeaders: false,
      httpBodies: [],
      urlQueryParams: false,
      databaseQueryData: false,
    },
    tracesSampleRate: import.meta.env.PROD ? 0.1 : 1.0,
    // Supabase is a separate service; avoid adding tracing headers to its calls.
    tracePropagationTargets: [],
    integrations: [
      Sentry.browserTracingIntegration(),
      Sentry.captureConsoleIntegration({ levels: ["error"] }),
      Sentry.consoleLoggingIntegration({ levels: ["error"] }),
      ...(import.meta.env.DEV ? [Sentry.contextLinesIntegration()] : []),
    ],
  });
}

// Report failures handled by the UI as well as uncaught browser exceptions.
// Keep operation context to static labels; never attach form or session data.
export function reportError(cause: unknown, operation: string) {
  if (!Sentry.isInitialized()) return;
  const error =
    cause instanceof Error
      ? cause
      : new Error(
          typeof cause === "object" && cause !== null && "message" in cause
            ? String(cause.message)
            : String(cause),
        );
  Sentry.captureException(error, { tags: { operation } });
  Sentry.logger.error(error.message, { operation });
}
