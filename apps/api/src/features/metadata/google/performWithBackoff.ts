export async function performWithBackoff<T>({
  asyncFunction,
  retry,
  attempt = 1,
  maxAttempts = 5,
  minDelay = 1000,
  maxDelay = 10000,
}: {
  asyncFunction: () => Promise<T>
  retry: (error: unknown) => boolean
  attempt?: number
  maxAttempts?: number
  minDelay?: number
  maxDelay?: number
}): Promise<T> {
  try {
    const result = await asyncFunction()

    return result
  } catch (error) {
    if (attempt < maxAttempts && retry(error)) {
      const delay = Math.random() * (maxDelay - minDelay) + minDelay

      await new Promise((resolve) => setTimeout(resolve, delay))

      return performWithBackoff({
        asyncFunction,
        attempt: attempt + 1,
        retry,
        maxAttempts,
        minDelay,
        maxDelay,
      })
    }
    throw error
  }
}
