import Sentry from "@sentry/nestjs"

type SentryIntegrations = NonNullable<
  Parameters<typeof Sentry.init>[0]
>["integrations"]

const integrations: Exclude<SentryIntegrations, undefined> = []

try {
  // `@sentry/profiling-node` loads a native binding at require time and only
  // ships prebuilt binaries for a subset of Node ABIs (none for Node 25 /
  // ABI 141 as of v10.55.0). Guard the load so a missing binary disables
  // profiling instead of crashing API startup.
  const { nodeProfilingIntegration } =
    require("@sentry/profiling-node") as typeof import("@sentry/profiling-node")

  integrations.push(nodeProfilingIntegration())
} catch (error) {
  console.warn(
    "[sentry] CPU profiling disabled: no native module for this Node runtime",
    error,
  )
}

// Ensure to call this before requiring any other modules!
Sentry.init({
  dsn: process.env.SENTRY_DSN,
  integrations,

  // Add Tracing by setting tracesSampleRate
  // We recommend adjusting this value in production
  tracesSampleRate: 1.0,

  // Set sampling rate for profiling
  // This is relative to tracesSampleRate
  profilesSampleRate: 1.0,
})
