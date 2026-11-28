/**
 * `Promise.all` that settles only when every step is settled. It rejects with
 * the failure of the first failed step, in the order of the steps.
 *
 * A library sync has the user's database to itself while it writes. With
 * `Promise.all`, its writing would fail while some of its steps still write,
 * and the user's next library sync would start to write at the same time as
 * them.
 */
export const waitForAll = async <Steps extends readonly unknown[] | []>(
  steps: Steps,
) => {
  await Promise.allSettled(steps)

  return Promise.all(steps)
}
