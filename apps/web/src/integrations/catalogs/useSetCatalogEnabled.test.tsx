import { QueryClient, QueryClientProvider } from "@tanstack/react-query"
import { renderHook } from "@testing-library/react"
import type { ReactNode } from "react"
import { firstValueFrom } from "rxjs"
import { describe, expect, it, onTestFinished, vi } from "vitest"

const mocks = vi.hoisted(function createUseSetCatalogEnabledMocks() {
  return { useDatabase: vi.fn() }
})

vi.mock("../../rxdb", function mockRxdb() {
  return { useDatabase: mocks.useDatabase }
})

import { createDatabase } from "../../rxdb/databases.shared"
import { useSetCatalogEnabled } from "./useSetCatalogEnabled"

function QueryClientWrapper({ children }: { children: ReactNode }) {
  return (
    <QueryClientProvider client={new QueryClient()}>
      {children}
    </QueryClientProvider>
  )
}

describe("useSetCatalogEnabled", () => {
  it("stores a catalog's switch and keeps the other catalogs", async () => {
    const database = await firstValueFrom(
      createDatabase({ name: `settings-${crypto.randomUUID()}` }),
    )

    onTestFinished(async function removeDatabase() {
      await database.remove()
    })
    mocks.useDatabase.mockReturnValue({ db: database })

    const { result } = renderHook(() => useSetCatalogEnabled(), {
      wrapper: QueryClientWrapper,
    })

    await result.current.mutateAsync({ id: "openLibrary", isEnabled: false })
    await result.current.mutateAsync({ id: "googleBooks", isEnabled: false })
    await result.current.mutateAsync({ id: "openLibrary", isEnabled: true })

    const settings = await database.settings.findOne("settings").exec()

    expect(settings?.catalogs).toEqual([
      { id: "openLibrary", isEnabled: true },
      { id: "googleBooks", isEnabled: false },
    ])
  })
})
