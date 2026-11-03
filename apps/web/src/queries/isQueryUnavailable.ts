import type { UseQueryResult } from "@tanstack/react-query"

/**
 * A query with no data that is not fetching either: disabled, or paused
 * while the browser is offline.
 */
export const isQueryUnavailable = ({
  isPending,
  fetchStatus,
}: Pick<UseQueryResult, "isPending" | "fetchStatus">) =>
  isPending && fetchStatus !== "fetching"
