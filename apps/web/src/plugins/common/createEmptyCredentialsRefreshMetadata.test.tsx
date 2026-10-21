import { QueryClient, QueryClientProvider } from "@tanstack/react-query"
import { act, renderHook } from "@testing-library/react"
import type { ReactNode } from "react"
import { describe, expect, it } from "vitest"
import { createEmptyCredentialsRefreshMetadata } from "./createEmptyCredentialsRefreshMetadata"

const useRefreshUriMetadata = createEmptyCredentialsRefreshMetadata<"URI">()

describe("createEmptyCredentialsRefreshMetadata", function testCreateEmptyCredentialsRefreshMetadata() {
  it("resolves empty credentials from a mutation carrying the caller's meta", async function resolveEmptyCredentials() {
    const queryClient = new QueryClient()
    const meta = { suppressGlobalErrorToast: true }
    const { result } = renderHook(
      function renderRefreshUriMetadata() {
        return useRefreshUriMetadata({ meta })
      },
      {
        wrapper: function RefreshQueryClientProvider({
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
      },
    )

    await act(async function refreshUriMetadata() {
      await expect(
        result.current.mutateAsync({
          linkType: "URI",
          linkData: { url: "https://example.com/book.epub" },
        }),
      ).resolves.toEqual({ providerCredentials: {} })
    })

    expect(queryClient.getMutationCache().getAll()[0]?.meta).toBe(meta)
  })
})
