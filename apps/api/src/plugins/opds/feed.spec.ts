import {
  ACQUISITION_FEED_TYPE,
  ACQUISITION_REL,
  allowServers,
  bookEntry,
  entry,
  feed,
  forgetAllowedServers,
  link,
  navigationEntry,
  nextPageLink,
  startServer,
  syncFeed,
} from "./catalog.fixture.js"

const UNKNOWN_MODIFIED_AT = "1970-01-01T00:00:00.000Z"

describe("OPDS crawl", () => {
  afterEach(forgetAllowedServers)

  it("turns navigation entries into folders of the books their feeds hold", async () => {
    const catalog = await startServer({
      "/opds/series": {
        body: feed(
          navigationEntry({
            id: "urn:series:a",
            title: "Series A",
            href: "/opds/series/a",
          }),
        ),
      },
      "/opds/series/a": {
        body: feed(
          entry({
            id: "urn:book:1",
            title: "Book 1",
            updated: "2026-03-01T10:00:00+02:00",
            links: [
              link({
                rel: ACQUISITION_REL,
                href: "/opds/books/1.epub",
                type: "application/epub+zip",
                length: 1024,
              }),
            ],
          }),
        ),
      },
    })
    allowServers(catalog)

    const { items } = await syncFeed({
      feedUrl: `${catalog.origin}/opds/series`,
      connectorUrl: catalog.origin,
    })

    expect(items).toEqual([
      {
        type: "folder",
        name: "Series A",
        modifiedAt: "2026-02-01T00:00:00.000Z",
        linkData: {
          connectorId: "connector",
          feedUrl: `${catalog.origin}/opds/series/a`,
          title: "Series A",
        },
        items: [
          {
            type: "file",
            name: "Book 1",
            modifiedAt: "2026-03-01T08:00:00.000Z",
            linkData: {
              connectorId: "connector",
              entryId: "urn:book:1",
              title: "Book 1",
              acquisition: {
                href: `${catalog.origin}/opds/books/1.epub`,
                type: "application/epub+zip",
                length: 1024,
              },
            },
          },
        ],
      },
    ])
  })

  it("reads every page of a feed once", async () => {
    const catalog = await startServer({
      "/opds/books": {
        body: feed(
          nextPageLink("/opds/books?page=2"),
          bookEntry({ id: "urn:book:1", title: "Book 1", href: "/1.epub" }),
          bookEntry({ id: "urn:book:2", title: "Book 2", href: "/2.epub" }),
        ),
      },
      "/opds/books?page=2": {
        body: feed(
          nextPageLink("/opds/books"),
          bookEntry({ id: "urn:book:2", title: "Book 2", href: "/2.epub" }),
          bookEntry({ id: "urn:book:3", title: "Book 3", href: "/3.epub" }),
        ),
      },
    })
    allowServers(catalog)

    const { items } = await syncFeed({
      feedUrl: `${catalog.origin}/opds/books`,
      connectorUrl: catalog.origin,
    })

    expect(items.map(({ name }) => name)).toEqual([
      "Book 1",
      "Book 2",
      "Book 3",
    ])
    expect(catalog.onRequest).toHaveBeenCalledTimes(2)
  })

  it("tells folders apart by their feed, as entry ids can repeat across feeds", async () => {
    const catalog = await startServer({
      "/opds/libraries": {
        body: feed(
          navigationEntry({
            id: "1",
            title: "Library",
            href: "/opds/libraries/1",
          }),
        ),
      },
      "/opds/libraries/1": {
        body: feed(
          navigationEntry({ id: "1", title: "Series", href: "/opds/series/1" }),
        ),
      },
      "/opds/series/1": {
        body: feed(bookEntry({ id: "1", title: "Book", href: "/1.epub" })),
      },
    })
    allowServers(catalog)

    const { items } = await syncFeed({
      feedUrl: `${catalog.origin}/opds/libraries`,
      connectorUrl: catalog.origin,
    })

    expect(items).toMatchObject([
      {
        linkData: { feedUrl: `${catalog.origin}/opds/libraries/1` },
        items: [
          {
            linkData: { feedUrl: `${catalog.origin}/opds/series/1` },
            items: [{ linkData: { entryId: "1" } }],
          },
        ],
      },
    ])
  })

  it("follows a feed under each top-level folder that leads to it, and reads it once", async () => {
    const catalog = await startServer({
      "/opds/collections": {
        body: feed(
          navigationEntry({
            id: "urn:collection:1",
            title: "Collection 1",
            href: "/opds/collections/1",
          }),
          navigationEntry({
            id: "urn:collection:2",
            title: "Collection 2",
            href: "/opds/collections/2",
          }),
        ),
      },
      "/opds/collections/1": {
        body: feed(
          navigationEntry({
            id: "urn:series:1",
            title: "Series 1",
            href: "/opds/series/1",
          }),
          navigationEntry({
            id: "urn:series:2",
            title: "Series 2",
            href: "/opds/series/2",
          }),
        ),
      },
      "/opds/collections/2": {
        body: feed(
          navigationEntry({
            id: "urn:series:2",
            title: "Series 2",
            href: "/opds/series/2",
          }),
        ),
      },
      "/opds/series/1": {
        body: feed(
          bookEntry({ id: "urn:book:1", title: "Book 1", href: "/1" }),
        ),
      },
      "/opds/series/2": {
        body: feed(
          bookEntry({ id: "urn:book:2", title: "Book 2", href: "/2" }),
        ),
      },
    })
    allowServers(catalog)

    const { items } = await syncFeed({
      feedUrl: `${catalog.origin}/opds/collections`,
      connectorUrl: catalog.origin,
    })

    expect(items).toMatchObject([
      {
        name: "Collection 1",
        items: [
          { name: "Series 1", items: [{ name: "Book 1" }] },
          { name: "Series 2", items: [{ name: "Book 2" }] },
        ],
      },
      {
        name: "Collection 2",
        items: [{ name: "Series 2", items: [{ name: "Book 2" }] }],
      },
    ])
    expect(catalog.onRequest).toHaveBeenCalledTimes(5)
  })

  it("follows a feed under each top-level folder, however deep it sits", async () => {
    const catalog = await startServer({
      "/opds": {
        body: feed(
          navigationEntry({ id: "urn:a", title: "A", href: "/opds/a" }),
          navigationEntry({ id: "urn:b", title: "B", href: "/opds/b" }),
        ),
      },
      "/opds/a": {
        body: feed(
          navigationEntry({ id: "urn:a1", title: "A1", href: "/opds/a1" }),
        ),
      },
      "/opds/a1": {
        body: feed(navigationEntry({ id: "urn:x", title: "X", href: "/x" })),
      },
      "/opds/b": {
        body: feed(navigationEntry({ id: "urn:x", title: "X", href: "/x" })),
      },
      "/x": {
        body: feed(
          bookEntry({ id: "urn:book:1", title: "Book 1", href: "/1" }),
        ),
      },
    })
    allowServers(catalog)

    const { items } = await syncFeed({
      feedUrl: `${catalog.origin}/opds`,
      connectorUrl: catalog.origin,
    })

    expect(items).toMatchObject([
      {
        name: "A",
        items: [
          { name: "A1", items: [{ name: "X", items: [{ name: "Book 1" }] }] },
        ],
      },
      { name: "B", items: [{ name: "X", items: [{ name: "Book 1" }] }] },
    ])
  })

  it("follows a feed once under a top-level folder, and never back to one", async () => {
    const catalog = await startServer({
      "/opds": {
        body: feed(
          navigationEntry({ id: "urn:a", title: "A", href: "/opds/a" }),
          navigationEntry({ id: "urn:b", title: "B", href: "/opds/b" }),
        ),
      },
      "/opds/a": {
        body: feed(
          navigationEntry({ id: "urn:x", title: "X", href: "/opds/x" }),
          navigationEntry({ id: "urn:y", title: "Y", href: "/opds/y" }),
        ),
      },
      "/opds/x": {
        body: feed(
          navigationEntry({ id: "urn:y", title: "Y", href: "/opds/y" }),
          navigationEntry({ id: "urn:x", title: "X", href: "/opds/x" }),
          navigationEntry({ id: "urn:b", title: "B", href: "/opds/b" }),
          bookEntry({ id: "urn:book:x", title: "Book X", href: "/x" }),
        ),
      },
      "/opds/y": {
        body: feed(
          bookEntry({ id: "urn:book:y", title: "Book Y", href: "/y" }),
        ),
      },
      "/opds/b": {
        body: feed(
          bookEntry({ id: "urn:book:b", title: "Book B", href: "/b" }),
        ),
      },
    })
    allowServers(catalog)

    const { items } = await syncFeed({
      feedUrl: `${catalog.origin}/opds`,
      connectorUrl: catalog.origin,
    })

    expect(items).toMatchObject([
      {
        name: "A",
        items: [
          { name: "X", items: [{ name: "Book X" }] },
          { name: "Y", items: [{ name: "Book Y" }] },
        ],
      },
      { name: "B", items: [{ name: "Book B" }] },
    ])
  })

  it("describes a book listed in several feeds the way it was first listed", async () => {
    const catalog = await startServer({
      "/opds": {
        body: feed(
          navigationEntry({
            id: "urn:series",
            title: "Series",
            href: "/opds/series",
          }),
          navigationEntry({
            id: "urn:latest",
            title: "Latest",
            href: "/opds/latest",
          }),
        ),
      },
      "/opds/series": {
        body: feed(
          bookEntry({
            id: "urn:book:1",
            title: "Book 1",
            href: "/books/1/file",
          }),
        ),
      },
      "/opds/latest": {
        body: feed(
          bookEntry({
            id: "urn:book:1",
            title: "Series 1: Book 1",
            href: "/books/1/file?latest",
          }),
        ),
      },
    })
    allowServers(catalog)

    const { items } = await syncFeed({
      feedUrl: `${catalog.origin}/opds`,
      connectorUrl: catalog.origin,
    })
    const [seriesListing, latestListing] = items.flatMap(
      (folder) => folder.items ?? [],
    )

    expect(seriesListing).toMatchObject({
      name: "Book 1",
      linkData: { acquisition: { href: `${catalog.origin}/books/1/file` } },
    })
    expect(latestListing).toEqual(seriesListing)
  })

  it("lists a book once in each top-level folder", async () => {
    const catalog = await startServer({
      "/opds/authors": {
        body: feed(
          navigationEntry({ id: "urn:letter:a", title: "A", href: "/opds/a" }),
        ),
      },
      "/opds/a": {
        body: feed(
          navigationEntry({ id: "urn:ada", title: "Ada", href: "/opds/ada" }),
          navigationEntry({
            id: "urn:alan",
            title: "Alan",
            href: "/opds/alan",
          }),
        ),
      },
      "/opds/ada": {
        body: feed(
          bookEntry({ id: "urn:book:1", title: "Co-written", href: "/1.epub" }),
        ),
      },
      "/opds/alan": {
        body: feed(
          bookEntry({ id: "urn:book:1", title: "Co-written", href: "/1.epub" }),
          bookEntry({ id: "urn:book:2", title: "Alone", href: "/2.epub" }),
        ),
      },
    })
    allowServers(catalog)

    const { items } = await syncFeed({
      feedUrl: `${catalog.origin}/opds/authors`,
      connectorUrl: catalog.origin,
    })

    expect(items).toMatchObject([
      {
        name: "A",
        items: [
          { name: "Ada", items: [{ name: "Co-written" }] },
          { name: "Alan", items: [{ name: "Alone" }] },
        ],
      },
    ])
  })

  it("does not follow facets, searches, related feeds or links back up the catalog", async () => {
    const catalog = await startServer({
      "/opds": {
        body: feed(
          link({
            rel: "http://opds-spec.org/facet",
            href: "/opds/facet",
            type: ACQUISITION_FEED_TYPE,
          }),
          navigationEntry({
            id: "urn:start",
            title: "Start",
            href: "/opds/start",
            rel: "start",
          }),
          navigationEntry({
            id: "urn:up",
            title: "Up",
            href: "/opds/up",
            rel: "up",
          }),
          navigationEntry({
            id: "urn:search",
            title: "Search",
            href: "/opds/search",
            rel: "search",
          }),
          navigationEntry({
            id: "urn:sorted",
            title: "Sorted",
            href: "/opds/sorted",
            rel: "http://opds-spec.org/facet",
          }),
          navigationEntry({
            id: "urn:related",
            title: "Related",
            href: "/opds/related",
            rel: "related",
          }),
          navigationEntry({
            id: "urn:series:a",
            title: "Series A",
            href: "/opds/series/a",
          }),
        ),
      },
      "/opds/series/a": {
        body: feed(
          navigationEntry({ id: "urn:root", title: "Root", href: "/opds" }),
          bookEntry({ id: "urn:book:1", title: "Book 1", href: "/1.epub" }),
        ),
      },
    })
    allowServers(catalog)

    const { items } = await syncFeed({
      feedUrl: `${catalog.origin}/opds`,
      connectorUrl: catalog.origin,
    })

    expect(items).toMatchObject([
      { name: "Series A", items: [{ type: "file", name: "Book 1" }] },
    ])
    expect(
      catalog.onRequest.mock.calls.map(([request]) => request.path),
    ).toEqual(["/opds", "/opds/series/a"])
  })

  it("resolves links against the URL a feed was served from", async () => {
    const catalog = await startServer({
      "/catalog": {
        status: 301,
        headers: { location: "/opds/v1/" },
      },
      "/opds/v1/": {
        body: feed(
          entry({
            id: "urn:series:a",
            title: "A",
            links: [
              '<link href="series/a" type="application/atom+xml;profile=opds-catalog"/>',
            ],
          }),
        ),
      },
      "/opds/v1/series/a": {
        body: feed(
          bookEntry({
            id: "urn:book:1",
            title: "Book 1",
            href: "../books/1.epub",
          }),
        ),
      },
    })
    allowServers(catalog)

    const { items } = await syncFeed({
      feedUrl: `${catalog.origin}/catalog`,
      connectorUrl: catalog.origin,
    })

    expect(items).toMatchObject([
      {
        items: [
          {
            linkData: {
              acquisition: { href: `${catalog.origin}/opds/v1/books/1.epub` },
            },
          },
        ],
      },
    ])
  })

  it("decodes the entities of titles and links", async () => {
    const catalog = await startServer({
      "/opds/books": {
        body: feed(
          nextPageLink("/opds/books?page=2&amp;sort=title"),
          bookEntry({ id: "urn:book:1", title: "Rock &amp; Roll", href: "/1" }),
        ),
      },
      "/opds/books?page=2&sort=title": {
        body: feed(
          bookEntry({ id: "urn:book:2", title: "It&#39;s Here", href: "/2" }),
        ),
      },
    })
    allowServers(catalog)

    const { items } = await syncFeed({
      feedUrl: `${catalog.origin}/opds/books`,
      connectorUrl: catalog.origin,
    })

    expect(items.map(({ name }) => name)).toEqual(["Rock & Roll", "It's Here"])
  })

  it("skips entries without an id", async () => {
    const catalog = await startServer({
      "/opds": {
        body: feed(
          `<entry>
    <title>Anonymous</title>
    ${link({ rel: ACQUISITION_REL, href: "/anonymous.epub", type: "application/epub+zip" })}
  </entry>`,
          bookEntry({ id: "urn:book:1", title: "Book 1", href: "/1.epub" }),
        ),
      },
    })
    allowServers(catalog)

    const { items } = await syncFeed({
      feedUrl: `${catalog.origin}/opds`,
      connectorUrl: catalog.origin,
    })

    expect(items.map(({ name }) => name)).toEqual(["Book 1"])
  })

  it("dates an entry only from an update time with a time zone", async () => {
    const catalog = await startServer({
      "/opds": {
        body: feed(
          bookEntry({
            id: "urn:book:kavita",
            title: "Kavita",
            href: "/kavita.epub",
            updated: "2026-10-28T23:31:27",
          }),
          `<entry>
    <title>Undated</title>
    <id>urn:book:undated</id>
    ${link({ rel: ACQUISITION_REL, href: "/undated.epub", type: "application/epub+zip" })}
  </entry>`,
        ),
      },
    })
    allowServers(catalog)

    const { items } = await syncFeed({
      feedUrl: `${catalog.origin}/opds`,
      connectorUrl: catalog.origin,
    })

    expect(items.map(({ modifiedAt }) => modifiedAt)).toEqual([
      UNKNOWN_MODIFIED_AT,
      UNKNOWN_MODIFIED_AT,
    ])
  })

  it("takes the first format of a book it can read", async () => {
    const catalog = await startServer({
      "/opds": {
        body: feed(
          entry({
            id: "urn:book:1",
            title: "Book 1",
            links: [
              link({
                rel: ACQUISITION_REL,
                href: "/1.mobi",
                type: "application/x-mobipocket-ebook",
              }),
              link({
                rel: ACQUISITION_REL,
                href: "/1.epub",
                type: "application/epub+zip",
              }),
              link({
                rel: ACQUISITION_REL,
                href: "/1.pdf",
                type: "application/pdf",
              }),
            ],
          }),
        ),
      },
    })
    allowServers(catalog)

    const { items } = await syncFeed({
      feedUrl: `${catalog.origin}/opds`,
      connectorUrl: catalog.origin,
    })

    expect(items).toMatchObject([
      {
        linkData: {
          acquisition: {
            href: `${catalog.origin}/1.epub`,
            type: "application/epub+zip",
          },
        },
      },
    ])
  })

  it("only takes books that are free", async () => {
    const catalog = await startServer({
      "/opds": {
        body: feed(
          bookEntry({
            id: "urn:buy",
            title: "Bought",
            href: "/buy",
            rel: `${ACQUISITION_REL}/buy`,
          }),
          bookEntry({
            id: "urn:borrow",
            title: "Borrowed",
            href: "/borrow",
            rel: `${ACQUISITION_REL}/borrow`,
          }),
          bookEntry({
            id: "urn:sample",
            title: "Sampled",
            href: "/sample",
            rel: `${ACQUISITION_REL}/sample`,
          }),
          bookEntry({
            id: "urn:subscribe",
            title: "Subscribed",
            href: "/subscribe",
            rel: `${ACQUISITION_REL}/subscribe`,
          }),
          bookEntry({
            id: "urn:open-access",
            title: "Free",
            href: "/free.epub",
            rel: `${ACQUISITION_REL}/open-access`,
          }),
        ),
      },
    })
    allowServers(catalog)

    const { items } = await syncFeed({
      feedUrl: `${catalog.origin}/opds`,
      connectorUrl: catalog.origin,
    })

    expect(items.map(({ name }) => name)).toEqual(["Free"])
  })

  it("refuses an answer that is not a feed", async () => {
    const catalog = await startServer({
      "/opds": {
        headers: { "content-type": "text/html" },
        body: "<!doctype html><html><body>Sign in</body></html>",
      },
    })
    allowServers(catalog)

    await expect(
      syncFeed({
        feedUrl: `${catalog.origin}/opds`,
        connectorUrl: catalog.origin,
      }),
    ).rejects.toThrow("did not answer with an OPDS feed")
  })

  it("stops following navigation ten feeds deep", async () => {
    const depths = Array.from({ length: 12 }, (_, depth) => depth)
    const catalog = await startServer(
      Object.fromEntries(
        depths.map(function toFeedLinkingDeeper(depth) {
          return [
            `/opds/${depth}`,
            {
              body: feed(
                bookEntry({
                  id: `urn:book:${depth}`,
                  title: `Book ${depth}`,
                  href: `/${depth}.epub`,
                }),
                navigationEntry({
                  id: `urn:level:${depth + 1}`,
                  title: `Level ${depth + 1}`,
                  href: `/opds/${depth + 1}`,
                }),
              ),
            },
          ]
        }),
      ),
    )
    allowServers(catalog)

    await syncFeed({
      feedUrl: `${catalog.origin}/opds/0`,
      connectorUrl: catalog.origin,
    })

    expect(catalog.onRequest).toHaveBeenCalledTimes(11)
    expect(catalog.onRequest).toHaveBeenLastCalledWith(
      expect.objectContaining({ path: "/opds/10" }),
    )
  })

  it("stops reading feeds after 5,000 pages", async () => {
    const feedNumbers = Array.from({ length: 5001 }, (_, number) => number)
    const catalog = await startServer({
      "/opds": {
        body: feed(
          ...feedNumbers.map(function toNavigationEntry(number) {
            return navigationEntry({
              id: `urn:feed:${number}`,
              title: `Feed ${number}`,
              href: `/opds/${number}`,
            })
          }),
        ),
      },
      ...Object.fromEntries(
        feedNumbers.map(function toEmptyFeedRoute(number) {
          return [`/opds/${number}`, { body: feed() }]
        }),
      ),
    })
    allowServers(catalog)

    await syncFeed({
      feedUrl: `${catalog.origin}/opds`,
      connectorUrl: catalog.origin,
    })

    expect(catalog.onRequest).toHaveBeenCalledTimes(5000)
  }, 60_000)

  it("stops reading feeds after 200,000 entries", async () => {
    const pageNumbers = Array.from({ length: 11 }, (_, number) => number)
    const catalog = await startServer(
      Object.fromEntries(
        pageNumbers.map(function toPageOfBooks(page) {
          const bookNumbers = Array.from(
            { length: 20_000 },
            (_, book) => page * 20_000 + book,
          )

          return [
            `/opds?page=${page}`,
            {
              body: feed(
                nextPageLink(`/opds?page=${page + 1}`),
                ...bookNumbers.map(function toBookEntry(number) {
                  return bookEntry({
                    id: `urn:book:${number}`,
                    title: `Book ${number}`,
                    href: `/${number}`,
                  })
                }),
              ),
            },
          ]
        }),
      ),
    )
    allowServers(catalog)

    await syncFeed({
      feedUrl: `${catalog.origin}/opds?page=0`,
      connectorUrl: catalog.origin,
    })

    expect(catalog.onRequest).toHaveBeenCalledTimes(10)
  }, 60_000)

  it("stops reading feeds after half an hour", async () => {
    vi.useFakeTimers({ toFake: ["Date"] })
    onTestFinished(function restoreClock() {
      vi.useRealTimers()
    })

    const catalog = await startServer({
      "/opds": {
        body: feed(
          navigationEntry({ id: "urn:a", title: "A", href: "/opds/a" }),
          navigationEntry({ id: "urn:b", title: "B", href: "/opds/b" }),
        ),
      },
      "/opds/a": {
        body: feed(
          bookEntry({ id: "urn:book:a", title: "Book A", href: "/a" }),
        ),
      },
      "/opds/b": {
        body: feed(
          bookEntry({ id: "urn:book:b", title: "Book B", href: "/b" }),
        ),
      },
    })
    catalog.onRequest.mockImplementation(function passHalfAnHourOnA({ path }) {
      if (path === "/opds/a") vi.setSystemTime(Date.now() + 31 * 60_000)
    })
    allowServers(catalog)

    const { items } = await syncFeed({
      feedUrl: `${catalog.origin}/opds`,
      connectorUrl: catalog.origin,
    })

    expect(items).toMatchObject([{ name: "A", items: [{ name: "Book A" }] }])
    expect(
      catalog.onRequest.mock.calls.map(([request]) => request.path),
    ).toEqual(["/opds", "/opds/a"])
  })
})
