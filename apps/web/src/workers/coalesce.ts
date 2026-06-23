export const coalesce = <Args extends unknown[], Result>(
  fn: (...args: Args) => Promise<Result>,
) => {
  let inFlight: Promise<Result> | null = null

  return (...args: Args): Promise<Result> => {
    if (!inFlight) {
      inFlight = fn(...args).finally(() => {
        inFlight = null
      })
    }

    return inFlight
  }
}
