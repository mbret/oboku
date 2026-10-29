import type { Readable } from "node:stream"
import { Logger } from "@nestjs/common"
import { isFileSupported, type OpdsBookLinkData } from "@oboku/shared"
import { XMLParser } from "fast-xml-parser"
import type { SynchronizeAbleItem } from "../types.js"
import {
  getFromCatalog,
  type OpdsConnector,
  toCatalogRequestFailure,
} from "./client.js"
import { listEachBookOncePerTopFolder } from "./listings.js"

const logger = new Logger("OpdsFeed")

type Acquisition = OpdsBookLinkData["acquisition"]

type FeedEntry =
  | {
      type: "file"
      id: string
      title: string
      updated: string | undefined
      acquisition: Acquisition
    }
  | {
      type: "folder"
      id: string
      title: string
      updated: string | undefined
      feedUrl: URL
    }

type FileEntry = Extract<FeedEntry, { type: "file" }>
type FolderEntry = Extract<FeedEntry, { type: "folder" }>

type MediaType = {
  essence: string
  parameters: Record<string, string>
}

type FeedLink = {
  rel: string
  url: URL
  mediaType: MediaType
  length: number | undefined
}

type XmlNode = Record<string, unknown>

const FEED_ACCEPT = "application/atom+xml, application/xml;q=0.9, */*;q=0.8"
/**
 * axios's timeout only covers the wait for the response's headers, so feed
 * pages also get a deadline that covers their body.
 */
const FEED_PAGE_DEADLINE_MS = 120_000
const MAX_FEED_PAGE_BYTES = 5 * 1024 * 1024

const MAX_FEED_DEPTH = 10
const MAX_FEED_PAGES = 5000
const MAX_FEED_ENTRIES = 200_000
const MAX_CRAWL_MINUTES = 30

const ACQUISITION_REL = "http://opds-spec.org/acquisition"
/** Buy, borrow, sample and subscribe acquisitions do not give the whole book for free. */
const OPEN_ACQUISITION_RELS = [
  ACQUISITION_REL,
  `${ACQUISITION_REL}/open-access`,
]
/**
 * Lead back up the catalog, to sorted or filtered views of books listed
 * already, or sideways out of the feed.
 */
const NOT_FOLLOWED_RELS = [
  "self",
  "start",
  "up",
  "search",
  "related",
  "http://opds-spec.org/facet",
]
/** RFC 4287, section 4.2.7.2. */
const DEFAULT_LINK_REL = "alternate"

/**
 * RFC 4287 dates carry a time zone (section 3.3). Kavita stamps every entry
 * with the time of the request and no zone, which would read as a change on
 * every sync.
 */
const ZONED_DATE_TIME = /(?:z|[+-]\d{2}:?\d{2})$/i
const UNKNOWN_MODIFIED_AT = new Date(0).toISOString()

const ARRAY_TAGS = ["entry", "link"]

const feedParser = new XMLParser({
  ignoreAttributes: false,
  parseTagValue: false,
  // fast-xml-parser 5.11 decodes character references (&#39;) only with this
  // option, which also decodes HTML's named entities.
  htmlEntities: true,
  isArray: function isRepeatedElement(
    tagName,
    _jPath,
    _isLeafNode,
    isAttribute,
  ) {
    return !isAttribute && ARRAY_TAGS.includes(tagName)
  },
})

const isXmlNode = (value: unknown): value is XmlNode =>
  typeof value === "object" && value !== null && !Array.isArray(value)

const readNodes = (value: unknown) =>
  Array.isArray(value) ? value.filter(isXmlNode) : []

const readText = (value: unknown) => {
  const text = isXmlNode(value) ? value["#text"] : value

  return typeof text === "string" && text !== "" ? text : undefined
}

const readAttribute = (node: XmlNode, name: string) => {
  const value = node[`@_${name}`]

  return typeof value === "string" ? value : undefined
}

/** `type/subtype;name=value` (RFC 9110, section 8.3.1), lowercased to compare. */
const parseMediaType = (value: string): MediaType => {
  const [essence = "", ...parameters] = value.split(";")

  return {
    essence: essence.trim().toLowerCase(),
    parameters: Object.fromEntries(
      parameters.map(function toParameterEntry(parameter) {
        const [name = "", parameterValue = ""] = parameter.split("=")

        return [
          name.trim().toLowerCase(),
          parameterValue
            .trim()
            .replace(/^"(.*)"$/, "$1")
            .toLowerCase(),
        ]
      }),
    ),
  }
}

const parseLength = (value: string | undefined) =>
  value !== undefined && /^\d+$/.test(value) ? Number(value) : undefined

const readLinks = (node: XmlNode, servedUrl: URL): FeedLink[] =>
  readNodes(node.link).flatMap(function toFeedLinks(link) {
    const href = readAttribute(link, "href")

    if (href === undefined || !URL.canParse(href, servedUrl)) return []

    return [
      {
        rel: readAttribute(link, "rel") ?? DEFAULT_LINK_REL,
        url: new URL(href, servedUrl),
        mediaType: parseMediaType(readAttribute(link, "type") ?? ""),
        length: parseLength(readAttribute(link, "length")),
      },
    ]
  })

const isAcquisitionLink = ({ rel }: FeedLink) =>
  rel === ACQUISITION_REL || rel.startsWith(`${ACQUISITION_REL}/`)

const isReadableOpenAcquisitionLink = ({ rel, mediaType }: FeedLink) =>
  OPEN_ACQUISITION_RELS.includes(rel) &&
  isFileSupported({ mimeType: mediaType.essence })

/** A link to another catalog feed, rather than to the full entry of a publication. */
const isNavigationLink = ({ rel, mediaType }: FeedLink) =>
  mediaType.essence === "application/atom+xml" &&
  mediaType.parameters.type !== "entry" &&
  !NOT_FOLLOWED_RELS.includes(rel)

const toAcquisition = ({ url, mediaType, length }: FeedLink): Acquisition => ({
  href: url.href,
  type: mediaType.essence,
  ...(length !== undefined && { length }),
})

const toFeedEntries = (entry: XmlNode, servedUrl: URL): FeedEntry[] => {
  const id = readText(entry.id)

  if (id === undefined) return []

  const title = readText(entry.title) ?? id
  const updated = readText(entry.updated)
  const links = readLinks(entry, servedUrl)
  const isPublication = links.some(isAcquisitionLink)

  if (isPublication) {
    const acquisitionLink = links.find(isReadableOpenAcquisitionLink)

    if (!acquisitionLink) return []

    return [
      {
        type: "file",
        id,
        title,
        updated,
        acquisition: toAcquisition(acquisitionLink),
      },
    ]
  }

  const navigationLink = links.find(isNavigationLink)

  if (!navigationLink) return []

  return [{ type: "folder", id, title, updated, feedUrl: navigationLink.url }]
}

const parseFeedPage = (xml: string, servedUrl: URL) => {
  const document: unknown = feedParser.parse(xml)
  const feed =
    isXmlNode(document) && isXmlNode(document.feed) ? document.feed : undefined

  if (!feed) {
    throw new Error(`${servedUrl.origin} did not answer with an OPDS feed`)
  }

  return {
    entries: readNodes(feed.entry).flatMap((entry) =>
      toFeedEntries(entry, servedUrl),
    ),
    nextUrl: readLinks(feed, servedUrl).find(({ rel }) => rel === "next")?.url,
  }
}

async function readFeedPage(stream: Readable, servedUrl: URL) {
  const chunks: Buffer[] = []
  let byteCount = 0

  try {
    for await (const chunk of stream) {
      byteCount += chunk.byteLength

      if (byteCount > MAX_FEED_PAGE_BYTES) {
        throw new Error(
          `${servedUrl.origin} answered with more than a feed page`,
        )
      }

      chunks.push(chunk)
    }
  } catch (error) {
    throw toCatalogRequestFailure(servedUrl, error)
  }

  return Buffer.concat(chunks).toString("utf8")
}

const fetchFeedPage = async (connector: OpdsConnector, url: URL) => {
  const { stream, url: servedUrl } = await getFromCatalog(connector, url, {
    headers: { Accept: FEED_ACCEPT },
    signal: AbortSignal.timeout(FEED_PAGE_DEADLINE_MS),
  })
  const xml = await readFeedPage(stream, servedUrl)

  return { servedUrl, ...parseFeedPage(xml, servedUrl) }
}

type Crawl = {
  connector: OpdsConnector
  deadline: number
  /** Each feed's entries, read once however many folders lead to it. */
  feedEntries: Map<string, FeedEntry[]>
  pageCount: number
  entryCount: number
}

const withoutFragment = (url: URL) => url.href.replace(/#.*$/, "")

const isOverBudget = (crawl: Crawl) =>
  crawl.pageCount >= MAX_FEED_PAGES ||
  crawl.entryCount >= MAX_FEED_ENTRIES ||
  Date.now() >= crawl.deadline

/** Pages can shift while they are read, and list an entry twice. */
const withoutRepeatedEntries = (entries: FeedEntry[]) =>
  Array.from(new Map(entries.map((entry) => [entry.id, entry])).values())

async function readFeedPages(crawl: Crawl, url: URL) {
  const pages: FeedEntry[][] = []
  const pageUrls = new Set<string>()
  let pageUrl: URL | undefined = url

  while (
    pageUrl &&
    !pageUrls.has(withoutFragment(pageUrl)) &&
    !isOverBudget(crawl)
  ) {
    pageUrls.add(withoutFragment(pageUrl))
    crawl.pageCount++

    const page = await fetchFeedPage(crawl.connector, pageUrl)

    pageUrls.add(withoutFragment(page.servedUrl))
    pages.push(page.entries)
    crawl.entryCount += page.entries.length
    pageUrl = page.nextUrl
  }

  return withoutRepeatedEntries(pages.flat())
}

async function readFeed(crawl: Crawl, url: URL) {
  if (isOverBudget(crawl)) return []

  const feedUrl = withoutFragment(url)
  const cachedEntries = crawl.feedEntries.get(feedUrl)

  if (cachedEntries) {
    crawl.entryCount += cachedEntries.length

    return cachedEntries
  }

  const entries = await readFeedPages(crawl, url)

  crawl.feedEntries.set(feedUrl, entries)

  return entries
}

/**
 * Claims the feeds of every navigation entry before following any, so that a
 * feed several of them lead to is followed once, from the first.
 */
function claimFeedsToFollow(
  entries: FolderEntry[],
  followedFeeds: Set<string>,
) {
  const claimedEntries = new Set<FolderEntry>()

  for (const entry of entries) {
    const feedUrl = withoutFragment(entry.feedUrl)

    if (followedFeeds.has(feedUrl)) continue

    followedFeeds.add(feedUrl)
    claimedEntries.add(entry)
  }

  return claimedEntries
}

const toModifiedAt = (updated: string | undefined) => {
  const time =
    updated !== undefined && ZONED_DATE_TIME.test(updated)
      ? Date.parse(updated)
      : Number.NaN

  return Number.isNaN(time) ? UNKNOWN_MODIFIED_AT : new Date(time).toISOString()
}

const toBookItem = (
  connectorId: string,
  entry: FileEntry,
): SynchronizeAbleItem<"opds"> => ({
  type: "file",
  name: entry.title,
  modifiedAt: toModifiedAt(entry.updated),
  linkData: {
    connectorId,
    entryId: entry.id,
    title: entry.title,
    acquisition: entry.acquisition,
  },
})

const toFolderItem = (
  connectorId: string,
  entry: FolderEntry,
  items: SynchronizeAbleItem<"opds">[],
): SynchronizeAbleItem<"opds"> => ({
  type: "folder",
  name: entry.title,
  modifiedAt: toModifiedAt(entry.updated),
  linkData: {
    connectorId,
    feedUrl: withoutFragment(entry.feedUrl),
    title: entry.title,
  },
  items,
})

/**
 * @param followedFeeds The feeds followed at the top level, or under the
 * top-level folder being crawled. Each top-level folder becomes a collection,
 * so a feed two of them lead to is followed under each.
 */
async function crawlFeed(
  crawl: Crawl,
  url: URL,
  depth: number,
  followedFeeds: Set<string>,
): Promise<SynchronizeAbleItem<"opds">[]> {
  const entries = await readFeed(crawl, url)
  const folderEntries = entries.filter(
    (entry): entry is FolderEntry => entry.type === "folder",
  )
  const isDeepestFeed = depth >= MAX_FEED_DEPTH

  if (isDeepestFeed && folderEntries.length > 0) {
    logger.warn(
      `Not following the navigation of a feed of ${url.origin}: deeper than ${MAX_FEED_DEPTH} feeds`,
    )
  }

  const followedEntries = isDeepestFeed
    ? new Set<FolderEntry>()
    : claimFeedsToFollow(folderEntries, followedFeeds)
  const isTopLevel = depth === 0
  const { id: connectorId } = crawl.connector
  const items: SynchronizeAbleItem<"opds">[] = []

  for (const entry of entries) {
    if (entry.type === "file") {
      items.push(toBookItem(connectorId, entry))
    } else if (followedEntries.has(entry)) {
      const folderItems = await crawlFeed(
        crawl,
        entry.feedUrl,
        depth + 1,
        isTopLevel ? new Set(followedFeeds) : followedFeeds,
      )

      items.push(toFolderItem(connectorId, entry, folderItems))
    }
  }

  return items
}

/**
 * The books and folders a feed leads to: navigation entries become folders of
 * what their feed holds, free and readable publications become files.
 */
export async function crawlOpdsFeed(connector: OpdsConnector, feedUrl: URL) {
  const crawl: Crawl = {
    connector,
    deadline: Date.now() + MAX_CRAWL_MINUTES * 60_000,
    feedEntries: new Map(),
    pageCount: 0,
    entryCount: 0,
  }
  const items = await crawlFeed(
    crawl,
    feedUrl,
    0,
    new Set([withoutFragment(feedUrl)]),
  )

  if (isOverBudget(crawl)) {
    logger.warn(
      `Stopped crawling ${feedUrl.origin} early: a crawl reads up to ${MAX_FEED_PAGES} pages and ${MAX_FEED_ENTRIES} entries, for ${MAX_CRAWL_MINUTES} minutes`,
    )
  }

  return listEachBookOncePerTopFolder(items)
}
