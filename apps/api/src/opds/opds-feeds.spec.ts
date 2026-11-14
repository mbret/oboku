import type { BookMetadata } from "@oboku/shared"
import { toBooksFeed, toOpds1Feed, toOpds2Feed } from "./opds-feeds.js"

const SERVER = { slug: "calm-snails-dream", name: "Kids" }

const ACQUISITION_FEED_TYPE =
  "application/atom+xml;profile=opds-catalog;kind=acquisition"

const DUNE_FILE_ENTRY: BookMetadata = {
  type: "file",
  version: 5,
  contentType: "application/epub+zip",
  metadata: {
    titles: [{ value: "Dune" }],
    contributors: [{ name: "Frank Herbert", roles: ["author"] }],
    languages: ["en"],
    description: "Spice & sand",
  },
}

const DUNE = {
  _id: "book-dune",
  createdAt: Date.parse("2026-01-10T08:00:00.000Z"),
  lastMetadataUpdatedAt: Date.parse("2026-02-01T08:00:00.000Z"),
  metadata: [
    { type: "link", title: "Dune [oboku~isbn~9780441013593].epub" },
    DUNE_FILE_ENTRY,
  ],
} satisfies Parameters<typeof toBooksFeed>[0]["books"][number]

const FIRST_PAGE = { number: 1, size: 50, total: 1 }

const toPageLinks = (feed: ReturnType<typeof toOpds2Feed>) =>
  feed.links.filter(({ rel }) => rel !== "start")

describe("toOpds1Feed of the books", () => {
  it("writes an entry for each book, with its acquisition link", () => {
    const xml = toOpds1Feed({
      slug: SERVER.slug,
      feed: toBooksFeed({ server: SERVER, books: [DUNE], page: FIRST_PAGE }),
      updated: new Date("2026-11-13T10:00:00.000Z"),
    })

    expect(xml).toContain(
      `<feed xmlns="http://www.w3.org/2005/Atom" xmlns:dc="http://purl.org/dc/terms/">`,
    )
    expect(xml).toContain(
      [
        `  <entry>`,
        `    <id>urn:oboku:opds:calm-snails-dream:books:book-dune</id>`,
        `    <title>Dune</title>`,
        `    <updated>2026-02-01T08:00:00.000Z</updated>`,
        `    <author><name>Frank Herbert</name></author>`,
        `    <dc:language>en</dc:language>`,
        `    <content type="text">Spice &amp; sand</content>`,
        `    <link rel="http://opds-spec.org/acquisition" href="/opds/calm-snails-dream/books/book-dune/Dune.epub" type="application/epub+zip"/>`,
        `  </entry>`,
      ].join("\n"),
    )
  })

  it("titles a book as the app does, dated from its creation", () => {
    const xml = toOpds1Feed({
      slug: SERVER.slug,
      feed: toBooksFeed({
        server: SERVER,
        books: [
          {
            _id: "book-untitled",
            createdAt: Date.parse("2026-01-10T08:00:00.000Z"),
            lastMetadataUpdatedAt: null,
            metadata: [{ type: "link", title: "Fate/Zero 01.cbz" }],
          },
        ],
        page: FIRST_PAGE,
      }),
      updated: new Date(),
    })

    expect(xml).toContain(
      [
        `  <entry>`,
        `    <id>urn:oboku:opds:calm-snails-dream:books:book-untitled</id>`,
        `    <title>Fate/Zero 01.cbz</title>`,
        `    <updated>2026-01-10T08:00:00.000Z</updated>`,
        `    <content type="text"></content>`,
        `    <link rel="http://opds-spec.org/acquisition" href="/opds/calm-snails-dream/books/book-untitled/Fate-Zero%2001.cbz" type="application/octet-stream"/>`,
        `  </entry>`,
      ].join("\n"),
    )
  })

  it("titles a book without a title after its file", () => {
    const xml = toOpds1Feed({
      slug: SERVER.slug,
      feed: toBooksFeed({
        server: SERVER,
        books: [
          {
            _id: "book-untitled",
            createdAt: Date.parse("2026-01-10T08:00:00.000Z"),
            lastMetadataUpdatedAt: null,
            metadata: [
              { type: "file", version: 5, contentType: "application/epub+zip" },
            ],
          },
        ],
        page: FIRST_PAGE,
      }),
      updated: new Date(),
    })

    expect(xml).toContain(`    <title>book-untitled.epub</title>`)
  })

  it("names an author the book's sources share once", () => {
    const xml = toOpds1Feed({
      slug: SERVER.slug,
      feed: toBooksFeed({
        server: SERVER,
        books: [
          {
            ...DUNE,
            metadata: [
              ...DUNE.metadata,
              {
                type: "catalog",
                version: 1,
                providerId: "googleBooks",
                score: 1,
                accepted: true,
                signals: [],
                metadata: {
                  titles: [{ value: "Dune" }],
                  contributors: [{ name: "Frank Herbert", roles: ["author"] }],
                },
              },
            ],
          },
        ],
        page: FIRST_PAGE,
      }),
      updated: new Date(),
    })

    expect(xml.match(/<author><name>Frank Herbert<\/name><\/author>/g)).toEqual(
      ["<author><name>Frank Herbert</name></author>"],
    )
  })

  it("links a middle page to the pages around it", () => {
    const xml = toOpds1Feed({
      slug: SERVER.slug,
      feed: toBooksFeed({
        server: SERVER,
        books: [DUNE],
        page: { number: 2, size: 50, total: 120 },
      }),
      updated: new Date(),
    })

    expect(xml).toContain(
      [
        `  <link rel="self" href="/opds/calm-snails-dream/books?page=2" type="${ACQUISITION_FEED_TYPE}"/>`,
        `  <link rel="start" href="/opds/calm-snails-dream" type="application/atom+xml;profile=opds-catalog;kind=navigation"/>`,
        `  <link rel="first" href="/opds/calm-snails-dream/books" type="${ACQUISITION_FEED_TYPE}"/>`,
        `  <link rel="previous" href="/opds/calm-snails-dream/books" type="${ACQUISITION_FEED_TYPE}"/>`,
        `  <link rel="next" href="/opds/calm-snails-dream/books?page=3" type="${ACQUISITION_FEED_TYPE}"/>`,
        `  <link rel="last" href="/opds/calm-snails-dream/books?page=3" type="${ACQUISITION_FEED_TYPE}"/>`,
      ].join("\n"),
    )
  })
})

describe("toOpds2Feed of the books", () => {
  it("writes a publication for each book, with the page's place in the list", () => {
    const feed = toOpds2Feed({
      slug: SERVER.slug,
      feed: toBooksFeed({
        server: SERVER,
        books: [DUNE],
        page: { number: 1, size: 50, total: 51 },
      }),
    })

    expect(feed).toEqual({
      metadata: {
        title: "All books",
        numberOfItems: 51,
        itemsPerPage: 50,
        currentPage: 1,
      },
      links: [
        {
          rel: "self",
          href: "/opds/calm-snails-dream/v2/books",
          type: "application/opds+json",
        },
        {
          rel: "start",
          href: "/opds/calm-snails-dream/v2",
          type: "application/opds+json",
        },
        {
          rel: "next",
          href: "/opds/calm-snails-dream/v2/books?page=2",
          type: "application/opds+json",
        },
        {
          rel: "last",
          href: "/opds/calm-snails-dream/v2/books?page=2",
          type: "application/opds+json",
        },
      ],
      publications: [
        {
          metadata: {
            "@type": "http://schema.org/Book",
            identifier: "urn:oboku:opds:calm-snails-dream:books:book-dune",
            title: "Dune",
            author: ["Frank Herbert"],
            language: "en",
            description: "Spice & sand",
            modified: "2026-02-01T08:00:00.000Z",
          },
          links: [
            {
              rel: "http://opds-spec.org/acquisition",
              href: "/opds/calm-snails-dream/books/book-dune/Dune.epub",
              type: "application/epub+zip",
            },
          ],
        },
      ],
    })
  })

  it("links the last page back only", () => {
    const feed = toOpds2Feed({
      slug: SERVER.slug,
      feed: toBooksFeed({
        server: SERVER,
        books: [DUNE],
        page: { number: 2, size: 50, total: 51 },
      }),
    })

    expect(toPageLinks(feed)).toEqual([
      {
        rel: "self",
        href: "/opds/calm-snails-dream/v2/books?page=2",
        type: "application/opds+json",
      },
      {
        rel: "first",
        href: "/opds/calm-snails-dream/v2/books",
        type: "application/opds+json",
      },
      {
        rel: "previous",
        href: "/opds/calm-snails-dream/v2/books",
        type: "application/opds+json",
      },
    ])
  })

  it("links a single page to no other", () => {
    const feed = toOpds2Feed({
      slug: SERVER.slug,
      feed: toBooksFeed({ server: SERVER, books: [], page: FIRST_PAGE }),
    })

    expect(toPageLinks(feed).map(({ rel }) => rel)).toEqual(["self"])
  })
})
