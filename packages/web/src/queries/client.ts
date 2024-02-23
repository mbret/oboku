import { QueryClient } from "reactjrx"

export const queryClient = new QueryClient({
  defaultOptions: {
    queries: {
      /**
       * @important
       * By default we do not want queries using data from rxdb to use cache when mounting
       * This is because we might result in invalid data for a short period of time.
       * If cache should be used for a specific query, make sure to setData whenever
       * rxdb change with middleware. However since it's harder to maintain we just don't
       * use cache by default.
       */
      gcTime: 0
    }
  }
})