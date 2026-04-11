import { isDebugEnabled } from "../debug/isDebugEnabled.shared"
import { CancelError } from "../errors/errors.shared"
import {
  MutationCache,
  QueryCache,
  QueryClient,
  type UseQueryOptions,
} from "@tanstack/react-query"
import { SwitchMutationCancelError } from "reactjrx"
import { notifyError } from "../notifications/toasts"

export const API_QUERY_KEY_PREFIX = "api" as const
export const RXDB_QUERY_KEY_PREFIX = "rxdb" as const

export const queryClient = new QueryClient({
  mutationCache: new MutationCache({
    onError: (error, _variables, _context, mutation) => {
      if (
        error instanceof CancelError ||
        error instanceof SwitchMutationCancelError
      )
        return

      if (isDebugEnabled() && !import.meta.env.DEV) {
        alert(String(error))
      }

      console.error(error)

      if (!mutation.options.meta?.suppressGlobalErrorToast) {
        notifyError(error)
      }
    },
  }),
  queryCache: new QueryCache({
    onError: (error) => {
      if (error instanceof CancelError) return

      console.error(error)
    },
  }),
  defaultOptions: {
    mutations: {
      /**
       * @important
       * Same as for queries, most of mutations are offline by default.
       * Don't forget to change it when needed
       */
      networkMode: "always",
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
    },
  },
})

export const createRxdbQueryDefaultOptions = (): Pick<
  UseQueryOptions,
  "networkMode"
> => ({
  // they run on local database, never on network so they have no network constraints.
  networkMode: "always",
})
