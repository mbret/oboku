/**
 * Collapses a burst of concurrent calls into a single running execution, plus
 * one trailing execution with the most recent arguments if any calls arrived
 * while it was running. Only the latest arguments are kept (a single slot, not
 * a queue), so intermediate calls never spawn their own execution and at most
 * two executions ever overlap in time.
 *
 * A call whose arguments change behaviour (a different active profile, or
 * sign-out) is therefore never dropped, which would otherwise leave state
 * reconciled against a stale argument until the next trigger. Calls made while
 * an execution is running resolve with the trailing execution's outcome.
 */
export const coalesce = <Args extends unknown[], Result>(
  fn: (...args: Args) => Promise<Result>,
) => {
  let inFlight: Promise<Result> | null = null
  let trailing: Promise<Result> | null = null
  let trailingArgs: Args | null = null

  const start = (args: Args): Promise<Result> => {
    inFlight = fn(...args).finally(function clearInFlight() {
      inFlight = null
    })

    return inFlight
  }

  const startTrailing = (): Promise<Result> => {
    const args = trailingArgs
    trailing = null
    trailingArgs = null

    // Set by every call made while a run was in flight, and only read/cleared
    // here, so it is always populated by the time this runs.
    if (!args) throw new Error("coalesce: missing trailing arguments")

    return start(args)
  }

  return (...args: Args): Promise<Result> => {
    if (!inFlight) return start(args)

    trailingArgs = args
    trailing =
      trailing ??
      inFlight.catch(function ignoreRunningOutcome() {}).then(startTrailing)

    return trailing
  }
}
