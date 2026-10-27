import { afterEach, beforeEach, describe, expect, it, vi } from "vitest"
import type { Download } from "../../../http/useDownload"
import type { SynologyDriveSession } from "../client"
import { downloadSynologyDriveBlob } from "./client"

const session: SynologyDriveSession = {
  auth: { baseUrl: "https://nas.example.com", username: "alice" },
  sid: "dsm-session-id",
}

const downloadAnsweringJson = (body: unknown) =>
  vi.fn<Download>().mockResolvedValue({
    data: new Blob([JSON.stringify(body)], { type: "application/json" }),
    headers: { "content-type": "application/json; charset=utf-8" },
    status: 200,
    statusText: "OK",
  })

const downloadBook = (download: Download) =>
  downloadSynologyDriveBlob({
    download,
    fileId: "42",
    onDownloadProgress: vi.fn(),
    session,
    signal: new AbortController().signal,
  })

describe("downloadSynologyDriveBlob", () => {
  beforeEach(function answerItemRequests() {
    vi.stubGlobal(
      "fetch",
      vi.fn<typeof fetch>(async function answerWithBookItem() {
        return Response.json({ data: { name: "Book.cbz" }, success: true })
      }),
    )
  })

  afterEach(function restoreFetch() {
    vi.unstubAllGlobals()
  })

  it("reports the error code of a download Synology Drive refused", async () => {
    await expect(
      downloadBook(
        downloadAnsweringJson({ error: { code: 1002 }, success: false }),
      ),
    ).rejects.toThrow("Synology Drive download failed (1002).")
  })

  it("reports a download Synology Drive refused without an error code", async () => {
    await expect(
      downloadBook(downloadAnsweringJson({ success: false })),
    ).rejects.toThrow("Synology Drive download failed.")
  })

  it.each([{ body: null }, { body: [] }, { body: { success: "false" } }])(
    "reports $body, which the schema rejects, as JSON instead of file data",
    async ({ body }) => {
      await expect(downloadBook(downloadAnsweringJson(body))).rejects.toThrow(
        "Synology Drive returned JSON instead of file data.",
      )
    },
  )
})
