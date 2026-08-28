const UNSUBSTITUTED_PLACEHOLDER = /^__[A-Z0-9_]+__$/

/**
 * Reads a configuration value that the container entrypoint substitutes into
 * the built bundle at startup (see `scripts/docker/env.sh`), so one prebuilt
 * image can be pointed at different backends without rebuilding.
 *
 * Call it with the placeholder literal itself, e.g.
 * `readInjectedEnv("__VITE_API_URL__")`: that literal is what the entrypoint
 * rewrites. A placeholder that still reads as one means nothing was injected,
 * and `undefined` is returned so callers fall back to their own default.
 */
export function readInjectedEnv(placeholder: string): string | undefined {
  return UNSUBSTITUTED_PLACEHOLDER.test(placeholder) ? undefined : placeholder
}
