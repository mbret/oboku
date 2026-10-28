import { isLinkDataOutdated } from "./linkData.js"

const storedLinkData = {
  connectorId: "connector",
  fileId: "file-1",
  download: { url: "https://files.example.com/file-1.epub", type: "epub" },
}

describe("isLinkDataOutdated", () => {
  it("is false when the sync reports what is stored, in any order", () => {
    expect(
      isLinkDataOutdated(storedLinkData, {
        download: {
          type: "epub",
          url: "https://files.example.com/file-1.epub",
        },
        fileId: "file-1",
        connectorId: "connector",
      }),
    ).toBe(false)
  })

  it("is false when the sync reports part of what is stored", () => {
    expect(
      isLinkDataOutdated(storedLinkData, {
        connectorId: "connector",
        fileId: "file-1",
      }),
    ).toBe(false)
  })

  it("is true when a nested field the sync reports changed", () => {
    expect(
      isLinkDataOutdated(storedLinkData, {
        ...storedLinkData,
        download: {
          url: "https://files.example.com/file-2.epub",
          type: "epub",
        },
      }),
    ).toBe(true)
  })

  it("is true when the sync reports a field the stored copy lacks", () => {
    expect(
      isLinkDataOutdated(
        { connectorId: "connector", fileId: "file-1" },
        storedLinkData,
      ),
    ).toBe(true)
  })
})
