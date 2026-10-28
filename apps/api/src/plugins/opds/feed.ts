import type { Readable } from "node:stream"
import { text } from "node:stream/consumers"
import { Logger } from "@nestjs/common"
import {
  getOpdsCredentialHeaders,
  isFileSupported,
  ObokuErrorCode,
  ObokuSharedError,
  type OpdsLinkData,
  type SettingsResolvedConnectorData,
} from "@oboku/shared"
import axios from "axios"
import { XMLParser } from "fast-xml-parser"
import { toRequestFailure } from "../../http/requestFailure.js"
import { getUserAddressRequestOptions } from "../../http/userAddressAgents.js"
import type { SynchronizeAbleItem } from "../types.js"

const logger = new Logger("OpdsFeed")

export type OpdsConnector = SettingsResolvedConnectorData<"opds">

type Acquisition = NonNullable<OpdsLinkData["acquisition"]>

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

const HTTP_PROTOCOLS = ["http:", "https:"]
const REDIRECT_STATUSES = [301, 302, 303, 307, 308]
const MAX_REDIRECTS = 5
const FEED_ACCEPT = "application/atom+xml, application/xml;q=0.9, */*;q=0.8"

/** A catalog linking to new feeds forever would otherwise never end a crawl. */
const MAX_FEED_DEPTH = 10
const MAX_FEED_URLS = 5000

const ACQUISITION_REL = "http://opds-spec.org/acquisition"
/** Buy, borrow, sample and subscribe acquisitions do not give the whole book for free. */
const OPEN_ACQUISITION_RELS = [
  ACQUISITION_REL,
  `${ACQUISITION_REL}/open-access`,
]
/** Lead back up the catalog, or to sorted or filtered views of books listed already. */
const NOT_FOLLOWED_RELS = [
  "self",
  "start",
  "up",
  "search",
  "http://opds-spec.org/facet",
]
/** RFC 4287, section 4.2.7.2. */
const DEFAULT_LINK_REL = "alternate"

/** Atom requires `<updated>`. An entry without a usable one counts as never modified. */
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

const acceptEveryStatus = () => true

/**
 * GETs `url` from the connector's catalog. Redirects are followed here rather
 * than by axios, so that each request carries the connector's credentials only
 * when it goes to the connector's origin.
 */
export async function getFromCatalog(
  connector: OpdsConnector,
  url: URL,
  headers: Record<string, string> = {},
  redirectsLeft = MAX_REDIRECTS,
): Promise<{ stream: Readable; url: URL }> {
  if (!HTTP_PROTOCOLS.includes(url.protocol)) {
    throw new Error(`OPDS URLs must be http(s), not ${url.protocol}`)
  }

  const response = await axios
    .get<Readable>(url.href, {
      headers: { ...headers, ...getOpdsCredentialHeaders(url.href, connector) },
      maxRedirects: 0,
      responseType: "stream",
      validateStatus: acceptEveryStatus,
      ...getUserAddressRequestOptions({
        allowSelfSigned: connector.allowSelfSigned,
      }),
    })
    .catch(function toCatalogRequestFailure(error: unknown) {
      throw axios.isAxiosError(error)
        ? toRequestFailure(`OPDS request to ${url.origin} failed`, error)
        : error
    })
  const isSuccess = response.status >= 200 && response.status < 300

  if (isSuccess) return { stream: response.data, url }

  response.data.destroy()

  const { location } = response.headers
  const isRedirect =
    REDIRECT_STATUSES.includes(response.status) && typeof location === "string"

  if (isRedirect && redirectsLeft > 0) {
    return getFromCatalog(
      connector,
      new URL(location, url),
      headers,
      redirectsLeft - 1,
    )
  }

  if (response.status === 401) {
    throw new ObokuSharedError(ObokuErrorCode.ERROR_DATASOURCE_UNAUTHORIZED)
  }

  throw new Error(
    `OPDS request to ${url.origin} failed with status ${response.status}`,
  )
}

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

/**
 * An entry with acquisition links is a publication, a book when one of them
 * is free and readable. One with only links to other feeds is navigation.
 */
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

const fetchFeedPage = async (connector: OpdsConnector, url: URL) => {
  const { stream, url: servedUrl } = await getFromCatalog(connector, url, {
    Accept: FEED_ACCEPT,
  })

  return { servedUrl, ...parseFeedPage(await text(stream), servedUrl) }
}

type Crawl = {
  connector: OpdsConnector
  /** The feed URLs fetched, or claimed by a navigation entry to be. */
  visitedFeedUrls: Set<string>
}

const toVisitedFeedUrl = (url: URL) => url.href.replace(/#.*$/, "")

const isVisited = (crawl: Crawl, url: URL) =>
  crawl.visitedFeedUrls.has(toVisitedFeedUrl(url))

const visit = (crawl: Crawl, url: URL) =>
  crawl.visitedFeedUrls.add(toVisitedFeedUrl(url))

const isCrawlExhausted = (crawl: Crawl) =>
  crawl.visitedFeedUrls.size >= MAX_FEED_URLS

/** The entries of every page of a feed, following its `next` links. */
async function readFeedEntries(crawl: Crawl, url: URL): Promise<FeedEntry[]> {
  const { servedUrl, entries, nextUrl } = await fetchFeedPage(
    crawl.connector,
    url,
  )

  visit(crawl, servedUrl)

  if (!nextUrl || isVisited(crawl, nextUrl)) return entries

  if (isCrawlExhausted(crawl)) {
    logger.warn(`Not reading past ${url.origin}${url.pathname}: too many feeds`)

    return entries
  }

  visit(crawl, nextUrl)

  return [...entries, ...(await readFeedEntries(crawl, nextUrl))]
}

/** Pages can shift while they are read, and list an entry twice. */
const withoutRepeatedEntries = (entries: FeedEntry[]) =>
  Array.from(new Map(entries.map((entry) => [entry.id, entry])).values())

/**
 * Claims the feeds of every navigation entry before following any, so that a
 * feed the catalog links to from several places becomes the folder of the
 * entry closest to the top. A feed already visited, the one linking back up
 * for instance, is not followed again.
 */
function claimFeedsToFollow(crawl: Crawl, entries: FolderEntry[]) {
  const claimedEntries = new Set<FolderEntry>()

  for (const entry of entries) {
    if (isVisited(crawl, entry.feedUrl)) continue

    if (isCrawlExhausted(crawl)) {
      logger.warn(`Not following ${entry.feedUrl.origin}: too many feeds`)

      break
    }

    visit(crawl, entry.feedUrl)
    claimedEntries.add(entry)
  }

  return claimedEntries
}

const toModifiedAt = (updated: string | undefined) => {
  const time = updated === undefined ? Number.NaN : Date.parse(updated)

  return Number.isNaN(time) ? UNKNOWN_MODIFIED_AT : new Date(time).toISOString()
}

async function crawlFeed(
  crawl: Crawl,
  url: URL,
  depth: number,
): Promise<SynchronizeAbleItem<"opds">[]> {
  const entries = withoutRepeatedEntries(await readFeedEntries(crawl, url))
  const folderEntries = entries.filter(
    (entry): entry is FolderEntry => entry.type === "folder",
  )
  const isDeepestFeed = depth >= MAX_FEED_DEPTH

  if (isDeepestFeed && folderEntries.length > 0) {
    logger.warn(
      `Not following the navigation of ${url.origin}${url.pathname}: deeper than ${MAX_FEED_DEPTH} feeds`,
    )
  }

  const followedEntries = isDeepestFeed
    ? new Set<FolderEntry>()
    : claimFeedsToFollow(crawl, folderEntries)
  const items: SynchronizeAbleItem<"opds">[] = []

  for (const entry of entries) {
    const entryLinkData = {
      connectorId: crawl.connector.id,
      entryId: entry.id,
      title: entry.title,
    }
    const modifiedAt = toModifiedAt(entry.updated)

    if (entry.type === "file") {
      items.push({
        type: "file",
        name: entry.title,
        modifiedAt,
        linkData: { ...entryLinkData, acquisition: entry.acquisition },
      })
    } else if (followedEntries.has(entry)) {
      const folderItems = await crawlFeed(crawl, entry.feedUrl, depth + 1)

      if (folderItems.length > 0) {
        items.push({
          type: "folder",
          name: entry.title,
          modifiedAt,
          linkData: entryLinkData,
          items: folderItems,
        })
      }
    }
  }

  return items
}

/**
 * The books and folders a feed leads to: navigation entries become folders of
 * what their feed holds, free and readable publications become files.
 */
export const crawlOpdsFeed = (connector: OpdsConnector, feedUrl: URL) =>
  crawlFeed(
    { connector, visitedFeedUrls: new Set([toVisitedFeedUrl(feedUrl)]) },
    feedUrl,
    0,
  )
