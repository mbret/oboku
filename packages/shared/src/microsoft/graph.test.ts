import { afterEach, beforeEach, describe, expect, it, vi } from "vitest"
import { ObokuErrorCode, ObokuSharedError } from "../errors"
import {
  buildDriveItemUrl,
  fetchMicrosoftGraphJson,
  getMicrosoftGraphDriveItem,
  MicrosoftGraphError,
} from "./graph"

describe("Microsoft Graph helpers", () => {
  const originalFetch = global.fetch

  beforeEach(() => {
    global.fetch = vi.fn()
  })

  afterEach(() => {
    global.fetch = originalFetch
    vi.resetAllMocks()
  })

  it("fetches Microsoft Graph JSON with a bearer token", async () => {
    vi.mocked(global.fetch).mockResolvedValueOnce(
      new Response(JSON.stringify({ value: 42 }), {
        headers: {
          "Content-Type": "application/json",
        },
        status: 200,
      }),
    )

    await expect(
      fetchMicrosoftGraphJson<{ value: number }>(
        "graph-token",
        "https://graph.microsoft.com/v1.0/me/drive",
      ),
    ).resolves.toEqual({ value: 42 })

    expect(global.fetch).toHaveBeenCalledWith(
      "https://graph.microsoft.com/v1.0/me/drive",
      {
        headers: {
          Authorization: "Bearer graph-token",
        },
      },
    )
  })

  it("builds and fetches a drive item URL", async () => {
    vi.mocked(global.fetch).mockResolvedValueOnce(
      new Response(
        JSON.stringify({
          name: "Book.epub",
        }),
        {
          headers: {
            "Content-Type": "application/json",
          },
          status: 200,
        },
      ),
    )

    await expect(
      getMicrosoftGraphDriveItem({
        accessToken: "graph-token",
        driveId: "drive-id",
        itemId: "file-id",
      }),
    ).resolves.toEqual({
      name: "Book.epub",
    })

    expect(global.fetch).toHaveBeenCalledWith(
      buildDriveItemUrl("drive-id", "file-id"),
      {
        headers: {
          Authorization: "Bearer graph-token",
        },
      },
    )
  })

  it("maps 404 responses to the shared resource-not-found error", async () => {
    vi.mocked(global.fetch).mockResolvedValueOnce(
      new Response(
        JSON.stringify({
          error: {
            message: "Item not found",
          },
        }),
        {
          headers: {
            "Content-Type": "application/json",
          },
          status: 404,
          statusText: "Not Found",
        },
      ),
    )

    const error = await fetchMicrosoftGraphJson(
      "graph-token",
      "https://graph.microsoft.com/v1.0/me",
    ).catch((error: unknown) => error)

    expect(error).toEqual(
      expect.objectContaining({
        code: ObokuErrorCode.ERROR_RESOURCE_NOT_FOUND,
        previousError: expect.any(MicrosoftGraphError),
      }),
    )

    expect(error).toBeInstanceOf(ObokuSharedError)
  })
})
