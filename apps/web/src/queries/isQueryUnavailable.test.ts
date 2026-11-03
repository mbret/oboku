import type { FetchStatus } from "@tanstack/react-query"
import { describe, expect, it } from "vitest"
import { isQueryUnavailable } from "./isQueryUnavailable"

const QUERY_STATES: {
  name: string
  isPending: boolean
  fetchStatus: FetchStatus
  isUnavailable: boolean
}[] = [
  {
    name: "a disabled query",
    isPending: true,
    fetchStatus: "idle",
    isUnavailable: true,
  },
  {
    name: "a query paused while offline",
    isPending: true,
    fetchStatus: "paused",
    isUnavailable: true,
  },
  {
    name: "a query loading for the first time",
    isPending: true,
    fetchStatus: "fetching",
    isUnavailable: false,
  },
  {
    name: "a loaded query",
    isPending: false,
    fetchStatus: "idle",
    isUnavailable: false,
  },
]

describe("isQueryUnavailable", () => {
  it.each(QUERY_STATES)(
    "says whether $name is unavailable",
    ({ isPending, fetchStatus, isUnavailable }) => {
      expect(isQueryUnavailable({ isPending, fetchStatus })).toBe(isUnavailable)
    },
  )
})
