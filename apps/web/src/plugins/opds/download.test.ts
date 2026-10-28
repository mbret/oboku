import type { SettingsResolvedConnectorData } from "@oboku/shared"
import { describe, expect, it, vi } from "vitest"
import type { Download } from "../../http/useDownload"
import { downloadOpdsBook } from "./download"

const connector: SettingsResolvedConnectorData<"opds"> = {
  id: "connector",
  type: "opds",
  url: "https://catalog.example.com/opds",
  username: "reader",
  password: "catalog-password",
}

const downloadAnswering = (headers: Record<string, string> = {}) =>
  vi.fn<Download>().mockResolvedValue({
    data: new Blob(["book"], { type: "application/epub+zip" }),
    headers,
    status: 200,
    statusText: "OK",
  })

const downloadBook = ({
  href,
  type = "application/epub+zip",
  download,
}: {
  href: string
  type?: string
  download: Download
}) =>
  downloadOpdsBook({
    acquisition: { href, type },
    title: "Book 1",
    connector,
    download,
    onDownloadProgress: vi.fn(),
    signal: new AbortController().signal,
  })

describe("downloadOpdsBook", () => {
  it("sends the connector's credentials to the connector's origin", async () => {
    const download = downloadAnswering()

    await downloadBook({
      href: "https://catalog.example.com/opds/books/1/file",
      download,
    })

    expect(download).toHaveBeenCalledWith(
      expect.objectContaining({
        url: "https://catalog.example.com/opds/books/1/file",
        headers: { Authorization: `Basic ${btoa("reader:catalog-password")}` },
      }),
    )
  })

  it("sends no credentials to another origin", async () => {
    const download = downloadAnswering()

    await downloadBook({ href: "https://cdn.example.com/1.epub", download })

    expect(download).toHaveBeenCalledWith(
      expect.objectContaining({
        url: "https://cdn.example.com/1.epub",
        headers: {},
      }),
    )
  })

  it("names the file after the Content-Disposition the catalog sends", async () => {
    const { fileName } = await downloadBook({
      href: "https://catalog.example.com/opds/books/1/file",
      download: downloadAnswering({
        "content-disposition": 'attachment; filename="Book One.epub"',
      }),
    })

    expect(fileName).toBe("Book One.epub")
  })

  it.each([
    { type: "application/epub+zip", fileName: "Book 1.epub" },
    { type: "application/zip", fileName: "Book 1.zip" },
    { type: "application/pdf", fileName: "Book 1.pdf" },
  ])(
    "names an $type file after its title otherwise",
    async ({ type, fileName }) => {
      await expect(
        downloadBook({
          href: "https://catalog.example.com/opds/books/1/file",
          type,
          download: downloadAnswering(),
        }),
      ).resolves.toMatchObject({ fileName })
    },
  )
})
