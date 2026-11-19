import type { LinkWithCredentials } from "@oboku/shared"
import { dataSource } from "./index.js"

const getFileName = async (url: string) => {
  const link: LinkWithCredentials<"URI"> = { type: "URI", data: { url } }
  const metadata = await dataSource.getFileMetadata({
    link,
    providerCredentials: {},
  })

  return metadata.name
}

describe("URI getFileMetadata", () => {
  it("names the file after the last segment of the URL's path", async () => {
    expect(await getFileName("https://example.com/comics/comic.cbz")).toBe(
      "comic.cbz",
    )
  })

  it("leaves the query and the fragment out of the name", async () => {
    expect(
      await getFileName("https://example.com/comics/comic.cbz?raw=true#page"),
    ).toBe("comic.cbz")
  })

  it("decodes the name", async () => {
    expect(await getFileName("https://example.com/Batman%20%2312.cbz")).toBe(
      "Batman #12.cbz",
    )
  })

  it("names a URL without a file name unknown", async () => {
    expect(await getFileName("https://example.com/?raw=true")).toBe("unknown")
  })
})
