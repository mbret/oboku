import fs from "node:fs"
import os from "node:os"
import path from "node:path"
import { Readable } from "node:stream"
import {
  type BookDocType,
  type LinkDocType,
  ReadingStateState,
} from "@oboku/shared"
import {
  FileDownloadSizeLimitExceededError,
  PluginsService,
} from "./plugins.service"

describe("PluginsService downloadLinkToTmp", () => {
  const createdDirectories: string[] = []

  afterEach(async () => {
    await Promise.all(
      createdDirectories
        .splice(0)
        .map((directory) =>
          fs.promises.rm(directory, { recursive: true, force: true }),
        ),
    )
  })

  const book: BookDocType = {
    _id: "book-1",
    _rev: "1-a",
    rxdbMeta: { lwt: 0 },
    createdAt: 0,
    lastMetadataUpdatedAt: null,
    metadataUpdateStatus: null,
    lastMetadataUpdateError: null,
    readingStateCurrentBookmarkLocation: null,
    readingStateCurrentBookmarkProgressPercent: 0,
    readingStateCurrentBookmarkProgressUpdatedAt: null,
    readingStateCurrentState: ReadingStateState.NotStarted,
    tags: [],
    links: ["link-1"],
    collections: [],
    rx_model: "book",
    modifiedAt: null,
    isAttachedToDataSource: false,
  }

  const link: LinkDocType = {
    _id: "link-1",
    _rev: "1-a",
    rxdbMeta: { lwt: 0 },
    type: "URI",
    data: { url: "https://example.com/book.epub" },
    book: "book-1",
    rx_model: "link",
    modifiedAt: null,
    createdAt: "1970-01-01T00:00:00.000Z",
  }

  const createService = async () => {
    const tmpDirBooks = await fs.promises.mkdtemp(
      path.join(os.tmpdir(), "oboku-plugins-service-"),
    )

    createdDirectories.push(tmpDirBooks)

    const service = new PluginsService({ TMP_DIR_BOOKS: tmpDirBooks })

    return { service, tmpDirBooks }
  }

  const mockDownloadStream = (service: PluginsService, chunks: Buffer[]) => {
    jest
      .spyOn(service, "download")
      .mockResolvedValue({ stream: Readable.from(chunks) })
  }

  it("writes the downloaded stream to a tmp file when under the size limit", async () => {
    const { service, tmpDirBooks } = await createService()

    mockDownloadStream(service, [Buffer.alloc(1024, 1), Buffer.alloc(1024, 2)])

    const { filepath } = await service.downloadLinkToTmp({
      book,
      link,
      providerCredentials: {},
      maxSizeBytes: 4096,
    })

    expect(filepath).toBe(path.join(tmpDirBooks, "book-1"))
    expect((await fs.promises.stat(filepath)).size).toBe(2048)
  })

  it("aborts the download and removes the partial file when the stream exceeds the size limit", async () => {
    const { service, tmpDirBooks } = await createService()

    mockDownloadStream(service, [Buffer.alloc(1024, 1), Buffer.alloc(1024, 2)])

    await expect(
      service.downloadLinkToTmp({
        book,
        link,
        providerCredentials: {},
        maxSizeBytes: 1500,
      }),
    ).rejects.toBeInstanceOf(FileDownloadSizeLimitExceededError)

    expect(fs.existsSync(path.join(tmpDirBooks, "book-1"))).toBe(false)
  })
})
