import { QueryClient, QueryClientProvider } from "@tanstack/react-query"
import { renderHook } from "@testing-library/react"
import type { ReactNode } from "react"
import { firstValueFrom } from "rxjs"
import { onTestFinished } from "vitest"
import { getLatestDatabase, useReCreateDb } from "./RxDbProvider"

/**
 * Opens an empty app database, the one the app's hooks read, for the running
 * test, and removes it when the test finishes.
 */
export async function openAppTestDatabase() {
  const queryClient = new QueryClient()
  const wrapper = function QueryWrapper({ children }: { children: ReactNode }) {
    return (
      <QueryClientProvider client={queryClient}>{children}</QueryClientProvider>
    )
  }
  const { result, unmount } = renderHook(useReCreateDb, { wrapper })
  onTestFinished(unmount)

  await result.current.mutateAsync({})
  const database = await firstValueFrom(getLatestDatabase())
  onTestFinished(async function removeDatabase() {
    await database.remove()
  })

  return { database, wrapper }
}
