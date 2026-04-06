import { beforeEach, describe, expect, it, vi } from "vitest"
import { NotifyAuthMessage } from "../workers/communication/types.shared"

const { askClientAuth, refreshClientAuth } = vi.hoisted(() => ({
  askClientAuth: vi.fn(),
  refreshClientAuth: vi.fn(),
}))

vi.mock("../workers/communication/communication.sw", () => ({
  serviceWorkerCommunication: {
    askClientAuth,
    refreshClientAuth,
  },
}))

import { httpClientApi } from "./httpClientApi.sw"

describe("httpClientApi service worker auth refresh", () => {
  beforeEach(() => {
    askClientAuth.mockReset()
    refreshClientAuth.mockReset()
  })

  it("refreshes expired cover requests and retries them with the fresh token", async () => {
    askClientAuth.mockResolvedValueOnce(
      new NotifyAuthMessage({
        accessToken: "expired-access-token",
        refreshToken: "refresh-token",
        email: "reader@example.com",
        nameHex: "reader",
        dbName: "reader-db",
      }),
    )
    refreshClientAuth.mockResolvedValueOnce(
      new NotifyAuthMessage({
        accessToken: "fresh-access-token",
        refreshToken: "refresh-token",
        email: "reader@example.com",
        nameHex: "reader",
        dbName: "reader-db",
      }),
    )

    const fetchMock = vi
      .fn<typeof fetch>()
      .mockResolvedValueOnce(new Response(null, { status: 401 }))
      .mockResolvedValueOnce(new Response("cover", { status: 200 }))

    vi.stubGlobal("fetch", fetchMock)

    const { status } = await httpClientApi.fetch(
      "https://api.example.com/covers/1",
      {
        clientId: "tab-1",
      },
    )

    expect(status).toBe(200)
    expect(fetchMock).toHaveBeenCalledTimes(2)
    expect(
      new Headers(fetchMock.mock.calls[0]?.[1]?.headers).get("Authorization"),
    ).toBe("Bearer expired-access-token")
    expect(
      new Headers(fetchMock.mock.calls[1]?.[1]?.headers).get("Authorization"),
    ).toBe("Bearer fresh-access-token")
    expect(askClientAuth).toHaveBeenCalledWith("tab-1")
    expect(refreshClientAuth).toHaveBeenCalledWith("tab-1")
  })
})
