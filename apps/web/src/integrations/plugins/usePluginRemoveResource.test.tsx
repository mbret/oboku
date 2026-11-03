import { renderHook } from "@testing-library/react"
import { QueryClient, QueryClientProvider } from "@tanstack/react-query"
import type { ReactNode } from "react"
import { describe, expect, it } from "vitest"
import { UnsupportedMethodError } from "../../errors/errors.shared"
import { usePluginRemoveResource } from "./usePluginRemoveResource"

describe("usePluginRemoveResource", () => {
  it("rejects the group of a plugin that cannot remove books", async () => {
    const queryClient = new QueryClient()
    const { result } = renderHook(usePluginRemoveResource, {
      wrapper: function RemoveResourceQueryClientProvider({
        children,
      }: {
        children: ReactNode
      }) {
        return (
          <QueryClientProvider client={queryClient}>
            {children}
          </QueryClientProvider>
        )
      },
    })

    await expect(
      result.current.mutateAsync({ type: "webdav", links: [] }),
    ).rejects.toBeInstanceOf(UnsupportedMethodError)
  })
})
