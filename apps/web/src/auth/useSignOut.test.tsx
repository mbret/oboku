// @vitest-environment jsdom

import { renderHook } from "@testing-library/react"
import { beforeEach, describe, expect, it, vi } from "vitest"

const {
  reCreateDb,
  purgeAllDownloads,
  resetSessionQueries,
  patchProfile,
  deleteProofKey,
} = vi.hoisted(() => ({
  reCreateDb: vi.fn(async () => {}),
  purgeAllDownloads: vi.fn(async () => {}),
  resetSessionQueries: vi.fn(async () => {}),
  patchProfile: vi.fn(async () => {}),
  deleteProofKey: vi.fn(async () => {}),
}))

vi.mock("@sentry/react", () => ({ setUser: vi.fn() }))
vi.mock("./AuthorizeActionDialog", () => ({ clearTemporaryMasterKey: vi.fn() }))
vi.mock("../google/auth", () => ({
  googleAccessTokenSignal: { update: vi.fn() },
}))
vi.mock("../plugins/usePluginsSignOut", () => ({
  usePluginsSignOut: () => vi.fn(),
}))
vi.mock("../queries/resetSessionQueries", () => ({
  useResetSessionQueries: () => resetSessionQueries,
}))
vi.mock("../profiles", () => ({
  clearActiveProfileId: vi.fn(),
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

  it("still purges downloaded files when the database wipe fails", async () => {
    reCreateDb.mockRejectedValueOnce(new Error("db removal failed"))

    const { result } = renderHook(() => useSignOut())

    await expect(result.current()).resolves.toBeUndefined()

    expect(purgeAllDownloads).toHaveBeenCalledTimes(1)
  })
})
