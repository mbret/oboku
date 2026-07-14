import { describe, expect, it } from "vitest"
import { inboxNotificationsQueryKey, unreadCountQueryKey } from "./queryKeys"

describe("notification query keys", () => {
  it("scopes the keys to the given profile so caches never mix across sessions", () => {
    expect(inboxNotificationsQueryKey("reader-a")).not.toEqual(
      inboxNotificationsQueryKey("reader-b"),
    )
    expect(unreadCountQueryKey("reader-a")).not.toEqual(
      unreadCountQueryKey("reader-b"),
    )
    expect(inboxNotificationsQueryKey("reader-a")).toContain("reader-a")
    expect(unreadCountQueryKey("reader-b")).toContain("reader-b")
  })
})
