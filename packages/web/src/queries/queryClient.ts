import { MutationCache, QueryCache, QueryClient } from "reactjrx"
import { Report } from "../debug/report.shared"
import { isDebugEnabled } from "../debug/isDebugEnabled.shared"
import { CancelError } from "../errors/errors.shared"

export const queryClient = new QueryClient({
  mutationCache: new MutationCache({
    onError: (error) => {
      if (error instanceof CancelError) return

      if (isDebugEnabled() && !import.meta.env.DEV) {
        alert(String(error))
      }

      Report.error(error)
    }
  }),
  queryCache: new QueryCache({
    onError: (error) => {
      if (error instanceof CancelError) return

      Report.error(error)
    }
  }),
  defaultOptions: {
    mutations: {
      /**
       * @important
       * Same as for queries, most of mutations are offline by default.
       * Don't forget to change it when needed
       */
      networkMode: "always"
    },
    queries: {
      /**
       * @important
       * By default we do not want queries using data from rxdb to use cache when mounting
       * This is because we might result in invalid data for a short period of time.
       * If cache should be used for a specific query, make sure to setData whenever
       * rxdb change with middleware. However since it's harder to maintain we just don't
       * use cache by default.
       */
      gcTime: 0,
      /**
       * @important
       * offline PWA.
       * Don't forget to set it back to default when making online queries
       */
      networkMode: "always"
    }
  }
})
