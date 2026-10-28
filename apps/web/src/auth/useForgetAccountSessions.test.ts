import { renderHook } from "@testing-library/react"
import { describe, expect, it, vi } from "vitest"

const { clearTemporaryMasterKey, signOutPlugins } = vi.hoisted(() => ({
  clearTemporaryMasterKey: vi.fn(),
  signOutPlugins: vi.fn(),
}))

vi.mock("./AuthorizeActionDialog", () => ({
  AuthorizeActionDialog: () => null,
  authorizeAction: vi.fn(),
  authorizeActionObservable: vi.fn(),
  clearTemporaryMasterKey,
  useWithAuthorization: vi.fn(),
}))

vi.mock("../integrations/plugins/usePluginsSignOut", () => ({
  usePluginsSignOut: () => signOutPlugins,
}))

import { useForgetAccountSessions } from "./useForgetAccountSessions"

describe("useForgetAccountSessions", () => {
  it("clears the temporary master key and signs every plugin out", () => {
    const { result } = renderHook(useForgetAccountSessions)

    result.current()

    expect(clearTemporaryMasterKey).toHaveBeenCalledTimes(1)
    expect(signOutPlugins).toHaveBeenCalledTimes(1)
  })
})
