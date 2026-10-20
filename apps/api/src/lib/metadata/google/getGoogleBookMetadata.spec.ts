import { ConfigService } from "@nestjs/config"
import { AppConfigService } from "../../../config/AppConfigService.js"
import {
  findByISBN,
  findByTitle,
  type GoogleBooksApiVolumesResponseData,
} from "../../google/googleBooksApi.js"
import { getGoogleBookMetadata } from "./getGoogleBookMetadata.js"

vi.mock("../../google/googleBooksApi.js", function mockGoogleBooksApi() {
  return {
    findByISBN: vi.fn(),
    findByTitle: vi.fn(),
    findByVolumeId: vi.fn(),
  }
})

const config = new AppConfigService(new ConfigService())

const noMatch: GoogleBooksApiVolumesResponseData = {
  kind: "books#volumes",
  totalItems: 0,
}

const match: GoogleBooksApiVolumesResponseData = {
  kind: "books#volumes",
  totalItems: 1,
  items: [
    {
      kind: "books#volume",
      id: "volume-id",
      etag: "",
      selfLink: "",
      volumeInfo: {
        title: "Blame! Vol. 2",
        authors: ["Tsutomu Nihei"],
        publisher: "Glénat",
        language: "fr",
      },
    },
  ],
}

afterEach(function resetGoogleBooksApiMocks() {
  vi.resetAllMocks()
})

describe("getGoogleBookMetadata", () => {
  it("refines the title one level at a time until Google finds a match", async () => {
    vi.mocked(findByISBN).mockResolvedValue(noMatch)
    vi.mocked(findByTitle).mockImplementation(
      async function matchOnlyTheBareTitle(title) {
        return title === "Blame vol 2" ? match : noMatch
      },
    )

    const metadata = await getGoogleBookMetadata(
      { title: "Blame v02 [Nihei] (Glenat)", isbn: "9782723428262" },
      "api-key",
      config,
    )

    expect(vi.mocked(findByTitle).mock.calls.map(([title]) => title)).toEqual([
      "Blame vol 02 [Nihei] (Glenat)",
      "Blame vol 2 [Nihei] (Glenat)",
      "Blame vol 2",
    ])
    expect(metadata).toMatchObject({
      type: "googleBookApi",
      title: "Blame! Vol. 2",
    })
  })
})
