// @vitest-environment jsdom

import { QueryClient, QueryClientProvider } from "@tanstack/react-query"
import {
  cleanup,
  fireEvent,
  render,
  screen,
  waitFor,
} from "@testing-library/react"
import type { ReactNode } from "react"
import { afterEach, describe, expect, it, vi } from "vitest"
import { links } from "@oboku/shared"
import { StoragePersistenceListItem } from "./StoragePersistenceListItem"

const stubStorage = ({
  persisted,
  persist,
}: {
  persisted: () => Promise<boolean>
  persist: () => Promise<boolean>
}) => {
  Object.defineProperty(navigator, "storage", {
    configurable: true,
    value: { persisted, persist },
  })
}

const renderListItem = () => {
  const queryClient = new QueryClient({
    defaultOptions: { queries: { retry: false } },
  })

  return render(<StoragePersistenceListItem />, {
    wrapper: function withQueryClient({ children }: { children: ReactNode }) {
      return (
        <QueryClientProvider client={queryClient}>
          {children}
        </QueryClientProvider>
      )
    },
  })
}

afterEach(() => {
  cleanup()
  vi.restoreAllMocks()
})

describe("StoragePersistenceListItem", () => {
  it("reports protected storage without offering an action", async () => {
    stubStorage({
      persisted: async () => true,
      persist: async () => true,
    })

    renderListItem()

    expect(await screen.findByText("Storage is protected")).toBeDefined()
    expect(screen.queryByRole("button")).toBeNull()
  })

  it("offers to request protection when storage is evictable", async () => {
    stubStorage({
      persisted: async () => false,
      persist: async () => true,
    })

    renderListItem()

    expect(
      await screen.findByText("Protect storage from deletion"),
    ).toBeDefined()
    expect(screen.getByRole("button")).toBeDefined()
  })

  it("switches to protected once the browser grants the request", async () => {
    let isPersisted = false
    const persist = vi.fn(async function grantPersistence() {
      isPersisted = true

      return true
    })
    stubStorage({ persisted: async () => isPersisted, persist })

    renderListItem()
    fireEvent.click(await screen.findByRole("button"))

    expect(await screen.findByText("Storage is protected")).toBeDefined()
    expect(persist).toHaveBeenCalledTimes(1)
  })

  it.each([true, false])(
    "always offers the documentation link (persisted: %s)",
    async (persisted) => {
      stubStorage({
        persisted: async () => persisted,
        persist: async () => persisted,
      })

      renderListItem()

      const readMore = await screen.findByRole("link", { name: "Read more" })

      expect(readMore.getAttribute("href")).toBe(links.documentationStorage)
      expect(readMore.getAttribute("target")).toBe("_blank")
    },
  )

  it("explains the refusal when the browser declines", async () => {
    stubStorage({
      persisted: async () => false,
      persist: async () => false,
    })

    renderListItem()
    fireEvent.click(await screen.findByRole("button"))

    await waitFor(() => {
      expect(
        screen.getByText(
          "Refused by the browser. Installing oboku as an app usually helps.",
        ),
      ).toBeDefined()
    })
  })
})
