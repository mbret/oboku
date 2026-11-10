import type { OpdsServerPostgresEntity } from "../features/postgres/entities.js"
import { escapeXml } from "../http/escapeXml.js"

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

/** A feed of a catalog, before an OPDS version writes it. */
type CatalogFeed = {
  id: string
  title: string
  path: CatalogPath
} & (
  | { kind: "navigation"; entries: CatalogNavigationEntry[] }
  | { kind: "acquisition" }
)

const ALL_BOOKS_TITLE = "All books"

const toCatalogId = (slug: string) => `urn:oboku:opds:${slug}`

const toBooksId = (slug: string) => `${toCatalogId(slug)}:books`

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

/** Lists no books: no provider serves its books to OPDS readers yet. */
export const toBooksFeed = (server: CatalogServer): CatalogFeed => ({
  kind: "acquisition",
  id: toBooksId(server.slug),
  title: ALL_BOOKS_TITLE,
  path: OPDS_BOOKS_ROUTE,
})

const toCatalogRoot = (slug: string) =>
  `/${OPDS_CATALOG_ROUTE}/${encodeURIComponent(slug)}`

const toOpds2Root = (slug: string) => `${toCatalogRoot(slug)}/${OPDS_2_ROUTE}`

const toHref = (root: string, path: CatalogPath) =>
  path ? `${root}/${path}` : root

type AtomLink = { rel: string; href: string; type: string }

const toLinkXml = ({ rel, href, type }: AtomLink) =>
  `<link rel="${rel}" href="${escapeXml(href)}" type="${type}"/>`

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
  const updatedXml = `<updated>${updated.toISOString()}</updated>`
  const links: AtomLink[] = [
    {
      rel: "self",
      href: toHref(root, feed.path),
      type: OPDS_1_FEED_TYPES[feed.kind],
    },
    { rel: "start", href: root, type: OPDS_NAVIGATION_FEED_TYPE },
  ]
  const entries = feed.kind === "navigation" ? feed.entries : []

  return [
    `<?xml version="1.0" encoding="UTF-8"?>`,
    `<feed xmlns="http://www.w3.org/2005/Atom">`,
    `  <id>${escapeXml(feed.id)}</id>`,
    `  <title>${escapeXml(feed.title)}</title>`,
    `  ${updatedXml}`,
    `  <author><name>oboku</name></author>`,
    ...links.map((link) => `  ${toLinkXml(link)}`),
    ...entries.flatMap((entry) => [
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
    `</feed>`,
  ].join("\n")
}

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
  const metadata = { title: feed.title }
  const links = [
    { rel: "self", href: toHref(root, feed.path), type: OPDS_2_FEED_TYPE },
    { rel: "start", href: root, type: OPDS_2_FEED_TYPE },
  ]

  if (feed.kind === "acquisition") {
    return { metadata, links, publications: [] }
  }

  return {
    metadata,
    links,
    navigation: feed.entries.map((entry) => ({
      rel: "subsection",
      href: toHref(root, entry.path),
      type: OPDS_2_FEED_TYPE,
      title: entry.title,
    })),
  }
}

const toAuthenticationDocumentHref = (slug: string) =>
  `${toCatalogRoot(slug)}/${OPDS_AUTHENTICATION_ROUTE}`

/**
 * How a reading app signs in to a catalog (Authentication for OPDS 1.0 §2.3).
 * Built from the requested slug alone, never from a stored server, so it
 * cannot tell a reader which servers exist.
 */
export const toAuthenticationDocument = (slug: string) => ({
  id: toAuthenticationDocumentHref(slug),
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
