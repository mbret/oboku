import { cleanup, render } from "@testing-library/react"
import {
  ObokuErrorCode,
  ObokuSharedError,
  type LinkDocTypeForProvider,
} from "@oboku/shared"
import { afterEach, describe, expect, it, vi } from "vitest"
import { PluginDownloadBook } from "./PluginDownloadBook"

const fileLink: LinkDocTypeForProvider<"file"> = {
  _id: "link-1",
  _rev: "1",
  rxdbMeta: { lwt: 0 },
  type: "file",
  data: { filename: "book.epub" },
  book: "book-1",
  rx_model: "link",
  modifiedAt: null,
  createdAt: "2026-11-03T00:00:00.000Z",
}

describe("PluginDownloadBook", () => {
  afterEach(() => {
    cleanup()
  })

  it("downloads through the plugin of the link's type", async () => {
    const onError = vi.fn()

    render(
      <PluginDownloadBook
        link={fileLink}
        onDownloadProgress={vi.fn()}
        onError={onError}
        onResolve={vi.fn()}
        signal={new AbortController().signal}
      />,
    )

    await vi.waitFor(function expectLocalFilePluginRejection() {
      expect(onError).toHaveBeenCalledWith(
        new ObokuSharedError(
          ObokuErrorCode.ERROR_DATASOURCE_DOWNLOAD_DIFFERENT_DEVICE,
        ),
      )
    })
  })
})
