import { QueryClient, QueryClientProvider } from "@tanstack/react-query"
import { renderHook } from "@testing-library/react"
import type { ReactNode } from "react"
import { firstValueFrom } from "rxjs"
import { describe, expect, it, onTestFinished, vi } from "vitest"
import { getLatestDatabase, useReCreateDb } from "../rxdb/RxDbProvider"
import { useUpdateMasterKey } from "./useUpdateMasterKey"

const ENCRYPTED_MASTER_KEY = { salt: "salt", iv: "iv", data: "data" }

const { encryptMasterKey } = vi.hoisted(function createMasterKeySpies() {
  return {
    encryptMasterKey:
      vi.fn<
        (
          dataKey: string,
          masterPassword: string,
        ) => Promise<typeof ENCRYPTED_MASTER_KEY>
      >(),
  }
})

vi.mock("./masterKeyUtils", function mockMasterKeyUtils() {
  return {
    generateMasterKey: async function generateFakeMasterKey() {
      return "master-key"
    },
    encryptMasterKey,
    decryptMasterKey: vi.fn(),
  }
})

async function renderUpdateMasterKeyWithDatabase() {
  const queryClient = new QueryClient()
  const { result, unmount } = renderHook(
    function renderUseReCreateDbAndUseUpdateMasterKey() {
      return {
        reCreateDb: useReCreateDb(),
        updateMasterKey: useUpdateMasterKey(),
      }
    },
    {
      wrapper: function QueryWrapper({ children }: { children: ReactNode }) {
        return (
          <QueryClientProvider client={queryClient}>
            {children}
          </QueryClientProvider>
        )
      },
    },
  )
  onTestFinished(unmount)

  await result.current.reCreateDb.mutateAsync({})

  return {
    reCreateDb: result.current.reCreateDb.mutateAsync,
    updateMasterKey: result.current.updateMasterKey.mutateAsync,
  }
}

describe("useUpdateMasterKey", () => {
  it("leaves a database recreated during the update without the master key", async () => {
    const { reCreateDb, updateMasterKey } =
      await renderUpdateMasterKeyWithDatabase()
    const heldEncryption = Promise.withResolvers<typeof ENCRYPTED_MASTER_KEY>()
    encryptMasterKey.mockResolvedValue(ENCRYPTED_MASTER_KEY)
    encryptMasterKey.mockReturnValueOnce(heldEncryption.promise)

    const update = updateMasterKey({ newPassword: "new", oldPassword: "" })
    await vi.waitFor(function expectEncryptionStarted() {
      expect(encryptMasterKey).toHaveBeenCalledOnce()
    })
    await reCreateDb({ overwrite: true })
    const recreatedDb = await firstValueFrom(getLatestDatabase())
    onTestFinished(async function removeRecreatedDatabase() {
      await recreatedDb.remove()
    })
    heldEncryption.resolve(ENCRYPTED_MASTER_KEY)
    await Promise.allSettled([update])

    const settings = await recreatedDb.settings.findOne().exec()

    expect(settings?.masterEncryptionKey).toBeUndefined()
    expect(encryptMasterKey).toHaveBeenCalledOnce()
  })
})
