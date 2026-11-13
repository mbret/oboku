import { type BookDocType, getMetadataFromBook } from "@oboku/shared"
import { BOOK_TITLE_FORMAT } from "../features/metadata/bookTitleFormat.js"
import type { OpdsServerPostgresEntity } from "../features/postgres/entities.js"
import { escapeXml } from "../http/escapeXml.js"
import { toServedFile } from "./opds-library.js"

export const OPDS_CATALOG_ROUTE = "opds"
export const OPDS_BOOKS_ROUTE = "books"
export const OPDS_2_ROUTE = "v2"
export const OPDS_AUTHENTICATION_ROUTE = "authentication"

// OPDS 1.2 §2.2 and §2.3: the type every link to a navigation or an
// acquisition feed must carry.
export const OPDS_NAVIGATION_FEED_TYPE =
  "application/atom+xml;profile=opds-catalog;kind=navigation"
export const OPDS_ACQUISITION_FEED_TYPE =
  "application/atom+xml;profile=opds-catalog;kind=acquisition"
// OPDS 2.0 §1.1
export const OPDS_2_FEED_TYPE = "application/opds+json"
// Authentication for OPDS 1.0 §2.2
export const OPDS_AUTHENTICATION_DOCUMENT_TYPE =
  "application/opds-authentication+json"

const OPDS_1_FEED_TYPES = {
  navigation: OPDS_NAVIGATION_FEED_TYPE,
  acquisition: OPDS_ACQUISITION_FEED_TYPE,
}

type CatalogServer = Pick<OpdsServerPostgresEntity, "slug" | "name">

type CatalogFeedKind = keyof typeof OPDS_1_FEED_TYPES

/** A path inside a catalog, the same in each OPDS version: "" for its root. */
type CatalogPath = string

type CatalogNavigationEntry = {
  id: string
  title: string
  description: string
  path: CatalogPath
  kind: CatalogFeedKind
}

/** A book of an acquisition feed, before an OPDS version writes it. */
type CatalogPublication = {
  id: string
  title: string
  authors: ReadonlyArray<string>
  language: string | undefined
  description: string | undefined
  updated: Date
  acquisition: { href: string; type: string }
}

/** Where a feed's page stands in the list it pages through; `number` is 1-based. */
type CatalogPage = { number: number; size: number; total: number }

/** A feed of a catalog, before an OPDS version writes it. */
type CatalogFeed = {
  id: string
  title: string
  path: CatalogPath
} & (
  | { kind: "navigation"; entries: CatalogNavigationEntry[] }
  | {
      kind: "acquisition"
      publications: CatalogPublication[]
      page: CatalogPage
    }
)

/** The fields of a served book a feed reads. */
type CatalogBook = Pick<
  BookDocType,
  | "_id"
  | "metadata"
  | "metadataSourcePriority"
  | "createdAt"
  | "lastMetadataUpdatedAt"
>

const ALL_BOOKS_TITLE = "All books"

const toCatalogId = (slug: string) => `urn:oboku:opds:${slug}`

const toBooksId = (slug: string) => `${toCatalogId(slug)}:books`

const toCatalogRoot = (slug: string) =>
  `/${OPDS_CATALOG_ROUTE}/${encodeURIComponent(slug)}`

const toOpds2Root = (slug: string) => `${toCatalogRoot(slug)}/${OPDS_2_ROUTE}`

/** The download route of a book's file, the same for both OPDS versions. */
const toBookFileHref = ({
  slug,
  bookId,
  fileName,
}: {
  slug: string
  bookId: string
  fileName: string
}) =>
  `${toCatalogRoot(slug)}/${OPDS_BOOKS_ROUTE}/${encodeURIComponent(bookId)}/${encodeURIComponent(fileName)}`

const toCatalogPublication = (
  slug: string,
  book: CatalogBook,
): CatalogPublication => {
  const metadata = getMetadataFromBook(book, BOOK_TITLE_FORMAT)
  const file = toServedFile(book)

  return {
    id: `${toBooksId(slug)}:${book._id}`,
    title: String(metadata.title ?? "") || file.name,
    // The merge adds up every source's authors, which can name one twice.
    authors: [...new Set(metadata.authors)],
    language: metadata.language,
    description: metadata.description,
    updated: new Date(book.lastMetadataUpdatedAt ?? book.createdAt),
    acquisition: {
      href: toBookFileHref({ slug, bookId: book._id, fileName: file.name }),
      type: file.contentType,
    },
  }
}

/** The catalog root: an entry for each way to browse the catalog. */
export const toRootFeed = (server: CatalogServer): CatalogFeed => ({
  kind: "navigation",
  id: toCatalogId(server.slug),
  title: server.name,
  path: "",
  entries: [
    {
      id: toBooksId(server.slug),
      title: ALL_BOOKS_TITLE,
      description: "Every book in this catalog",
      path: OPDS_BOOKS_ROUTE,
      kind: "acquisition",
    },
  ],
})

/** A page of every book the catalog serves. */
export const toBooksFeed = ({
  server,
  books,
  page,
}: {
  server: CatalogServer
  books: ReadonlyArray<CatalogBook>
  page: CatalogPage
}): CatalogFeed => ({
  kind: "acquisition",
  id: toBooksId(server.slug),
  title: ALL_BOOKS_TITLE,
  path: OPDS_BOOKS_ROUTE,
  publications: books.map((book) => toCatalogPublication(server.slug, book)),
  page,
})

const toHref = (root: string, path: CatalogPath) =>
  path ? `${root}/${path}` : root

const toPageHref = (feedHref: string, pageNumber: number) =>
  pageNumber > 1 ? `${feedHref}?page=${pageNumber}` : feedHref

/** The pages a page links to (RFC 5005 §3), by relation. */
const toPageRelations = ({ number, size, total }: CatalogPage) => {
  const lastPageNumber = Math.max(1, Math.ceil(total / size))
  const hasPreviousPage = number > 1
  const hasNextPage = number < lastPageNumber

  return [
    ...(hasPreviousPage
      ? [
          { rel: "first", pageNumber: 1 },
          { rel: "previous", pageNumber: number - 1 },
        ]
      : []),
    ...(hasNextPage
      ? [
          { rel: "next", pageNumber: number + 1 },
          { rel: "last", pageNumber: lastPageNumber },
        ]
      : []),
  ]
}

const toFeedHref = (root: string, feed: CatalogFeed) => {
  const href = toHref(root, feed.path)

  return feed.kind === "acquisition" ? toPageHref(href, feed.page.number) : href
}

// OPDS 1.2 §5.4 and OPDS 2.0 §5.1: the relation of a link that gets the
// book's file.
const ACQUISITION_RELATION = "http://opds-spec.org/acquisition"

type AtomLink = { rel: string; href: string; type: string }

const toLinkXml = ({ rel, href, type }: AtomLink) =>
  `<link rel="${rel}" href="${escapeXml(href)}" type="${escapeXml(type)}"/>`

const toPublicationEntryXml = (publication: CatalogPublication) => [
  `  <entry>`,
  `    <id>${escapeXml(publication.id)}</id>`,
  `    <title>${escapeXml(publication.title)}</title>`,
  `    <updated>${publication.updated.toISOString()}</updated>`,
  ...publication.authors.map(
    (author) => `    <author><name>${escapeXml(author)}</name></author>`,
  ),
  ...(publication.language
    ? [`    <dc:language>${escapeXml(publication.language)}</dc:language>`]
    : []),
  // RFC 4287 §4.1.2: an entry without an alternate link needs a content.
  `    <content type="text">${escapeXml(publication.description ?? "")}</content>`,
  `    ${toLinkXml({ rel: ACQUISITION_RELATION, ...publication.acquisition })}`,
  `  </entry>`,
]

/**
 * An OPDS 1.2 feed, with the elements Atom requires of a feed and its entries
 * (RFC 4287 §4.1.1, §4.1.2).
 */
export const toOpds1Feed = ({
  slug,
  feed,
  updated,
}: {
  slug: string
  feed: CatalogFeed
  updated: Date
}) => {
  const root = toCatalogRoot(slug)
  const feedType = OPDS_1_FEED_TYPES[feed.kind]
  const updatedXml = `<updated>${updated.toISOString()}</updated>`
  const pageLinks: AtomLink[] =
    feed.kind === "acquisition"
      ? toPageRelations(feed.page).map(({ rel, pageNumber }) => ({
          rel,
          href: toPageHref(toHref(root, feed.path), pageNumber),
          type: feedType,
        }))
      : []
  const links: AtomLink[] = [
    { rel: "self", href: toFeedHref(root, feed), type: feedType },
    { rel: "start", href: root, type: OPDS_NAVIGATION_FEED_TYPE },
    ...pageLinks,
  ]
  const navigationEntries = feed.kind === "navigation" ? feed.entries : []
  const publications = feed.kind === "acquisition" ? feed.publications : []

  return [
    `<?xml version="1.0" encoding="UTF-8"?>`,
    `<feed xmlns="http://www.w3.org/2005/Atom" xmlns:dc="http://purl.org/dc/terms/">`,
    `  <id>${escapeXml(feed.id)}</id>`,
    `  <title>${escapeXml(feed.title)}</title>`,
    `  ${updatedXml}`,
    `  <author><name>oboku</name></author>`,
    ...links.map((link) => `  ${toLinkXml(link)}`),
    ...navigationEntries.flatMap((entry) => [
      `  <entry>`,
      `    <id>${escapeXml(entry.id)}</id>`,
      `    <title>${escapeXml(entry.title)}</title>`,
      `    ${updatedXml}`,
      `    <content type="text">${escapeXml(entry.description)}</content>`,
      `    ${toLinkXml({
        rel: "subsection",
        href: toHref(root, entry.path),
        type: OPDS_1_FEED_TYPES[entry.kind],
      })}`,
      `  </entry>`,
    ]),
    ...publications.flatMap(toPublicationEntryXml),
    `</feed>`,
  ].join("\n")
}

const toOpds2Publication = (publication: CatalogPublication) => ({
  metadata: {
    "@type": "http://schema.org/Book",
    identifier: publication.id,
    title: publication.title,
    ...(publication.authors.length > 0 && { author: publication.authors }),
    ...(publication.language && { language: publication.language }),
    ...(publication.description && { description: publication.description }),
    modified: publication.updated.toISOString(),
  },
  links: [{ rel: ACQUISITION_RELATION, ...publication.acquisition }],
})

/**
 * An OPDS 2.0 feed (OPDS 2.0 §1.1). An empty `publications` collection breaks
 * the schema's `minItems`, but a feed has no other way to list no books.
 */
export const toOpds2Feed = ({
  slug,
  feed,
}: {
  slug: string
  feed: CatalogFeed
}) => {
  const root = toOpds2Root(slug)
  const startLink = { rel: "start", href: root, type: OPDS_2_FEED_TYPE }
  const selfLink = {
    rel: "self",
    href: toFeedHref(root, feed),
    type: OPDS_2_FEED_TYPE,
  }

  if (feed.kind === "acquisition") {
    const { page } = feed

    return {
      metadata: {
        title: feed.title,
        numberOfItems: page.total,
        itemsPerPage: page.size,
        currentPage: page.number,
      },
      links: [
        selfLink,
        startLink,
        ...toPageRelations(page).map(({ rel, pageNumber }) => ({
          rel,
          href: toPageHref(toHref(root, feed.path), pageNumber),
          type: OPDS_2_FEED_TYPE,
        })),
      ],
      publications: feed.publications.map(toOpds2Publication),
    }
  }

  return {
    metadata: { title: feed.title },
    links: [selfLink, startLink],
    navigation: feed.entries.map((entry) => ({
      rel: "subsection",
      href: toHref(root, entry.path),
      type: OPDS_2_FEED_TYPE,
      title: entry.title,
    })),
  }
}

/**
 * How a reading app signs in to a catalog (Authentication for OPDS 1.0 §2.3),
 * with the absolute URL the document's schema asks of `id`. Built from the
 * request alone, never from a stored server, so it cannot tell a reader which
 * servers exist.
 */
export const toAuthenticationDocument = ({
  origin,
  slug,
}: {
  origin: string
  slug: string
}) => ({
  id: `${origin}${toCatalogRoot(slug)}/${OPDS_AUTHENTICATION_ROUTE}`,
  title: "oboku",
  description:
    "Sign in with the email of your oboku account and the password of this OPDS server.",
  authentication: [
    {
      type: "http://opds-spec.org/auth/basic",
      labels: { login: "Email", password: "Server password" },
    },
  ],
})
