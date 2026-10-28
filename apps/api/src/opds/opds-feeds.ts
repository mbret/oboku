import type { OpdsServerPostgresEntity } from "../features/postgres/entities.js"
import { escapeXml } from "../http/escapeXml.js"

// OPDS 1.2 §2.2 and §2.3: the types of links to navigation and acquisition
// feeds, which their responses carry too.
export const OPDS_NAVIGATION_FEED_TYPE =
  "application/atom+xml;profile=opds-catalog;kind=navigation"
export const OPDS_ACQUISITION_FEED_TYPE =
  "application/atom+xml;profile=opds-catalog;kind=acquisition"

type AtomLink = { rel: string; href: string; type: string }

type AtomEntry = { id: string; title: string; links: AtomLink[] }

type CatalogServer = Pick<OpdsServerPostgresEntity, "slug" | "name">

const toLinkXml = ({ rel, href, type }: AtomLink) =>
  `<link rel="${rel}" href="${escapeXml(href)}" type="${type}"/>`

/** With the elements Atom requires of a feed and its entries (RFC 4287 §4.1). */
const buildFeed = ({
  id,
  title,
  updated,
  links,
  entries,
}: {
  id: string
  title: string
  updated: Date
  links: AtomLink[]
  entries: AtomEntry[]
}) => {
  const updatedXml = `<updated>${updated.toISOString()}</updated>`

  return [
    `<?xml version="1.0" encoding="UTF-8"?>`,
    `<feed xmlns="http://www.w3.org/2005/Atom">`,
    `  <id>${escapeXml(id)}</id>`,
    `  <title>${escapeXml(title)}</title>`,
    `  ${updatedXml}`,
    `  <author><name>oboku</name></author>`,
    ...links.map((link) => `  ${toLinkXml(link)}`),
    ...entries.flatMap((entry) => [
      `  <entry>`,
      `    <id>${escapeXml(entry.id)}</id>`,
      `    <title>${escapeXml(entry.title)}</title>`,
      `    ${updatedXml}`,
      ...entry.links.map((link) => `    ${toLinkXml(link)}`),
      `  </entry>`,
    ]),
    `</feed>`,
  ].join("\n")
}

const toCatalog = (slug: string) => {
  const rootPath = `/opds/${encodeURIComponent(slug)}`
  const rootId = `urn:oboku:opds:${slug}`

  return {
    rootLink: { href: rootPath, type: OPDS_NAVIGATION_FEED_TYPE },
    rootId,
    booksLink: { href: `${rootPath}/books`, type: OPDS_ACQUISITION_FEED_TYPE },
    booksId: `${rootId}:books`,
  }
}

const ALL_BOOKS_TITLE = "All books"

/** The catalog's start: an entry for each way to browse it. */
export const buildRootFeed = ({
  server,
  updated,
}: {
  server: CatalogServer
  updated: Date
}) => {
  const catalog = toCatalog(server.slug)

  return buildFeed({
    id: catalog.rootId,
    title: server.name,
    updated,
    links: [
      { rel: "self", ...catalog.rootLink },
      { rel: "start", ...catalog.rootLink },
    ],
    entries: [
      {
        id: catalog.booksId,
        title: ALL_BOOKS_TITLE,
        links: [{ rel: "subsection", ...catalog.booksLink }],
      },
    ],
  })
}

/** Lists no book: no provider serves its books to OPDS readers yet. */
export const buildBooksFeed = ({
  server,
  updated,
}: {
  server: CatalogServer
  updated: Date
}) => {
  const catalog = toCatalog(server.slug)

  return buildFeed({
    id: catalog.booksId,
    title: ALL_BOOKS_TITLE,
    updated,
    links: [
      { rel: "self", ...catalog.booksLink },
      { rel: "start", ...catalog.rootLink },
    ],
    entries: [],
  })
}
