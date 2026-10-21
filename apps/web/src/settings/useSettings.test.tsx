import type { SettingsDocType } from "@oboku/shared"
import { QueryClient, QueryClientProvider } from "@tanstack/react-query"
import { act, renderHook, waitFor } from "@testing-library/react"
import type { ReactNode } from "react"
import { BehaviorSubject } from "rxjs"
import { describe, expect, it, vi } from "vitest"
import { useSettings } from "./useSettings"

const { observeSettingsEntry } = vi.hoisted(() => ({
  observeSettingsEntry: vi.fn(),
}))

vi.mock("../rxdb/RxDbProvider", async () => {
  const { of } = await import("rxjs")

  return {
    latestDatabase$: of({
      settings: { findOne: () => ({ $: observeSettingsEntry() }) },
    }),
  }
})

type SettingsEntry = { toJSON: () => SettingsDocType }

const settings: SettingsDocType = { _id: "settings", connectors: [] }

function QueryClientWrapper({ children }: { children: ReactNode }) {
  return (
    <QueryClientProvider client={new QueryClient()}>
      {children}
    </QueryClientProvider>
  )
}

describe("useSettings", () => {
  it("reads the settings document as null while it does not exist", async () => {
    const settingsEntry$ = new BehaviorSubject<SettingsEntry | null>(null)

    observeSettingsEntry.mockReturnValue(settingsEntry$)

    const { result } = renderHook(() => useSettings(), {
      wrapper: QueryClientWrapper,
    })

    await waitFor(() => expect(result.current.data).toBeNull())

    act(function insertSettingsDocument() {
      settingsEntry$.next({ toJSON: () => settings })
    })

    await waitFor(() => expect(result.current.data).toEqual(settings))

    act(function removeSettingsDocument() {
      settingsEntry$.next(null)
    })

    await waitFor(() => expect(result.current.data).toBeNull())
    expect(result.current.error).toBeNull()
  })
})
