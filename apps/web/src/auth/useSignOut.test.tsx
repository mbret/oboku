import { renderHook } from "@testing-library/react"
import { beforeEach, describe, expect, it, vi } from "vitest"

const {
  reCreateDb,
  purgeAllDownloads,
  resetSessionQueries,
  patchProfile,
  deleteProofKey,
  clearActiveProfileId,
} = vi.hoisted(() => ({
  reCreateDb: vi.fn(async () => {}),
  purgeAllDownloads: vi.fn(async () => {}),
  resetSessionQueries: vi.fn(async () => {}),
  patchProfile: vi.fn(async () => {}),
  deleteProofKey: vi.fn(async () => {}),
  clearActiveProfileId: vi.fn(),
}))

vi.mock("../queries/resetSessionQueries", () => ({
  useResetSessionQueries: () => resetSessionQueries,
}))
vi.mock("../profiles", () => ({
  clearActiveProfileId,
  getActiveProfileId: () => "reader",
  usePatchProfile: () => ({ mutateAsync: patchProfile }),
}))
vi.mock("./proofKey", () => ({ deleteProofKey }))
vi.mock("../rxdb", () => ({
  useReCreateDb: () => ({ mutateAsync: reCreateDb }),
}))
vi.mock("../download/purgeAllDownloads", () => ({ purgeAllDownloads }))

import { useSignOut } from "./useSignOut"

describe("useSignOut", () => {
  beforeEach(() => {
    vi.clearAllMocks()
  })

  it("wipes the local database and downloaded files so no account data lingers on the device", async () => {
    const { result } = renderHook(() => useSignOut())

    await result.current()

    expect(reCreateDb).toHaveBeenCalledWith({ overwrite: true })
    expect(purgeAllDownloads).toHaveBeenCalledTimes(1)
  })

  it("clears the active profile", async () => {
    const { result } = renderHook(() => useSignOut())

    await result.current()

    expect(clearActiveProfileId).toHaveBeenCalledTimes(1)
  })

  it("still purges downloaded files when the database wipe fails", async () => {
    reCreateDb.mockRejectedValueOnce(new Error("db removal failed"))

    const { result } = renderHook(() => useSignOut())

    await expect(result.current()).resolves.toBeUndefined()

    expect(purgeAllDownloads).toHaveBeenCalledTimes(1)
  })
})
