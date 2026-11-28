/**
 * `Promise.all` that settles only when every step is settled. It rejects with
 * the failure of the first failed step, in the order of the steps.
 *
 * A library sync has the user's database to itself while it runs. With
 * `Promise.all`, it would fail while some of its steps still write, and the
 * queue would start the user's next library sync at the same time as them.
 */
export const waitForAll = async <Steps extends readonly unknown[] | []>(
  steps: Steps,
) => {
  await Promise.allSettled(steps)

  return Promise.all(steps)
}
