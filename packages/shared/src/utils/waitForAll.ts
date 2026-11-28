/**
 * `Promise.all` that settles only when every step is settled. It rejects with
 * the failure of the first failed step, in the order of the steps.
 *
 * With `Promise.all`, the steps that are still pending when one fails keep
 * running after the caller has moved on.
 */
export const waitForAll = async <Steps extends readonly unknown[] | []>(
  steps: Steps,
) => {
  await Promise.allSettled(steps)

  return Promise.all(steps)
}
