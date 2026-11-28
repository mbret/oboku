import { QueryClient, QueryClientProvider } from "@tanstack/react-query"
import { renderHook } from "@testing-library/react"
import type { ReactNode } from "react"
import { describe, expect, it, vi } from "vitest"

const mocks = vi.hoisted(function createUseSetKindleEmailMocks() {
  return { useDatabase: vi.fn() }
})

vi.mock("../../rxdb", async function mockRxdb() {
  const { ensureDatabase } = await import("../../rxdb/RxDbProvider")

  return { useDatabase: mocks.useDatabase, ensureDatabase }
})

import { openTestDatabase } from "../../rxdb/databases.fixture"
import { useSetKindleEmail } from "./useSetKindleEmail"

function QueryClientWrapper({ children }: { children: ReactNode }) {
  return (
    <QueryClientProvider client={new QueryClient()}>
      {children}
    </QueryClientProvider>
  )
}

const renderUseSetKindleEmail = async () => {
  const database = await openTestDatabase()
  mocks.useDatabase.mockReturnValue({ db: database })

  const { result } = renderHook(() => useSetKindleEmail(), {
    wrapper: QueryClientWrapper,
  })

  return { database, result }
}

describe("useSetKindleEmail", () => {
  it("stores the address in the settings, and keeps what the settings hold", async () => {
    const { database, result } = await renderUseSetKindleEmail()
    await database.settings.postConnector({
      type: "webdav",
      url: "https://nas.example.com/dav",
      username: "reader",
      passwordAsSecretId: "password-secret",
    })

    await result.current.mutateAsync("reader@kindle.com")

    const settings = await database.settings.findOne("settings").exec()

    expect(settings?.kindleEmail).toBe("reader@kindle.com")
    expect(settings?.connectors).toHaveLength(1)
  })

  it("replaces the address, then removes it", async () => {
    const { database, result } = await renderUseSetKindleEmail()

    await result.current.mutateAsync("reader@kindle.com")
    await result.current.mutateAsync("second_kindle@kindle.com")

    expect(
      (await database.settings.findOne("settings").exec())?.kindleEmail,
    ).toBe("second_kindle@kindle.com")

    await result.current.mutateAsync(null)

    expect(
      (await database.settings.findOne("settings").exec())?.kindleEmail,
    ).toBeNull()
  })
})
