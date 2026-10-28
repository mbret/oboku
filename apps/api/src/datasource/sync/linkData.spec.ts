import { isLinkDataOutdated } from "./linkData.js"

const storedLinkData = {
  connectorId: "connector",
  entryId: "urn:book:1",
  title: "Book 1",
  acquisition: { href: "https://catalog.example.com/1.epub", type: "epub" },
}

describe("isLinkDataOutdated", () => {
  it("is false when the sync reports what is stored, in any order", () => {
    expect(
      isLinkDataOutdated(storedLinkData, {
        acquisition: {
          type: "epub",
          href: "https://catalog.example.com/1.epub",
        },
        title: "Book 1",
        entryId: "urn:book:1",
        connectorId: "connector",
      }),
    ).toBe(false)
  })

  it("is false when the sync reports part of what is stored", () => {
    expect(
      isLinkDataOutdated(storedLinkData, {
        connectorId: "connector",
        entryId: "urn:book:1",
      }),
    ).toBe(false)
  })

  it("is true when a nested field the sync reports changed", () => {
    expect(
      isLinkDataOutdated(storedLinkData, {
        ...storedLinkData,
        acquisition: {
          href: "https://catalog.example.com/2.epub",
          type: "epub",
        },
      }),
    ).toBe(true)
  })

  it("is true when the sync reports a field the stored copy lacks", () => {
    expect(
      isLinkDataOutdated(
        { connectorId: "connector", entryId: "urn:book:1" },
        storedLinkData,
      ),
    ).toBe(true)
  })
})
