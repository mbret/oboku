import { parse } from 'fast-xml-parser'
import xmldoc from 'xmldoc'
import { parseTocFromNavPath } from '../parsers/nav'
import { getArchiveOpfInfo } from '../archiveHelpers'
import { Archive } from '../types'
import { Manifest } from '../../types'

type SpineItemProperties = 'rendition:layout-reflowable' | 'page-spread-left' | 'page-spread-right'
type Metadata = { meta: any, 'dc:title'?: { '#text': string } } | undefined
type Meta = { '#text': string, '@_property': string } | { '#text': string, '@_property': string }[]
type Spine = {
  '@_page-progression-direction'?: 'rtl' | 'ltr',
  itemref: any[]
}
type SpineItemRef = {
  '@_idref': string
  '@_properties'?: string
}

export const generateManifestFromEpub = async (archive: Archive, baseUrl: string): Promise<Manifest> => {
  const { data: opsFile, basePath: opfBasePath } = getArchiveOpfInfo(archive)

  if (!opsFile) {
    throw new Error('No opf content')
  }

  const data = await opsFile.async('string')

  const parsedData = parse(data, {
    attributeNamePrefix: "@_",
    // attrNodeName: "attr", //default is 'false'
    // textNodeName: "#text",
    ignoreAttributes: false,
    // ignoreNameSpace: false,
    // allowBooleanAttributes: false,
    parseNodeValue: true,
    parseAttributeValue: true,
    trimValues: false,
    // cdataTagName: "__cdata", //default is 'false'
    // cdataPositionChar: "\\c",
    // parseTrueNumberOnly: false,
    arrayMode: false, //"strict"
    // attrValueProcessor: (val, attrName) => {
    //   return val
    // },

    //default is a=>a
    // tagValueProcessor: (val, tagName) => he.decode(val), //default is a=>a
    // stopNodes: ["parse-me-as-string"]
  })

  const opfXmlDoc = new xmldoc.XmlDocument(data)

  // Try to detect if there is a nav item
  const navItem = opfXmlDoc.childNamed('manifest')?.childrenNamed('item')
    .find((child) => child.attr.properties === 'nav');

  let toc = []

  if (navItem) {
    const tocFile = Object.values(archive.files).find(item => item.name.endsWith(navItem.attr.href || ''))
    if (tocFile) {
      toc = parseTocFromNavPath(await tocFile.async('string'))
    }
  }

  const metadata = parsedData.package.metadata as Metadata
  const meta = (metadata?.meta || []) as Meta
  const metaAsArray = Array.isArray(meta) ? meta : [meta]
  const defaultRenditionLayout = (metaAsArray.find((item) => item['@_property'] === `rendition:layout`)?.['#text']) as 'reflowable' | 'pre-paginated' | undefined
  const spine = parsedData.package.spine as Spine

  console.log(archive.files)

  const spineItemIds: string[] = parsedData.package.spine.itemref.map((item: any) => item['@_idref'])
  const manifestItemsFromSpine: any[] = parsedData.package.manifest.item.filter((item: any) => spineItemIds.includes(item['@_id']))
  const archiveSpineItems = archive.files.filter(file => manifestItemsFromSpine.find(item => `${opfBasePath}/${item['@_href']}` === file.name))
  const totalSize = archiveSpineItems.reduce((size, file) => file.size + size, 1)

  console.log(data, manifestItemsFromSpine, archiveSpineItems)

  return {
    nav: {
      toc,
    },
    renditionLayout: defaultRenditionLayout,
    title: metadata?.['dc:title']?.['#text'] || '',
    readingDirection: spine['@_page-progression-direction'] || 'ltr',
    readingOrder: spine.itemref.map((spineItem: SpineItemRef) => {
      const item = parsedData.package.manifest.item.find((item: any) => item['@_id'] === spineItem['@_idref'])
      const href = item['@_href']
      const properties = (spineItem[`@_properties`]?.split(` `) || []) as SpineItemProperties[]
      const itemSize = archive.files.find(file => file.name.endsWith(href))?.size || 0
      // console.log(item, spine, properties)

      return {
        id: item['@_id'],
        // href: `${event.request.url}/${item['@_href']}`,
        path: opfBasePath ? `${opfBasePath}/${item['@_href']}` : `${item['@_href']}`,
        href: opfBasePath ? `${baseUrl}/${opfBasePath}/${item['@_href']}` : `${baseUrl}/${item['@_href']}`,
        renditionLayout: defaultRenditionLayout || `reflowable`,
        ...properties.find(property => property === 'rendition:layout-reflowable') && {
          renditionLayout: `reflowable`,
        },
        // progressionWeight: Math.floor((1 / spine.itemref.length) * 1000) / 1000,
        progressionWeight: itemSize / totalSize,
        size: itemSize
      }
    })
  }
}

export const generateManifestFromArchive = async (archive: Archive, baseUrl: string): Promise<Manifest> => {
  const files = Object.values(archive.files).filter(file => !file.dir)

  return {
    nav: {
      toc: []
    },
    title: ``,
    renditionLayout: `pre-paginated`,
    readingDirection: 'ltr',
    readingOrder: files.map((file) => {
      const filenameWithoutExtension = file.name.substring(0, file.name.lastIndexOf(`.`))

      return {
        id: file.name,
        // path: `${file.name}.xhtml`,
        path: `${file.name}`,
        // href: `${baseUrl}/${file.name}.xhtml`,
        href: `${baseUrl}/${file.name}`,
        renditionLayout: `pre-paginated`,
        progressionWeight: (1 / files.length)
      }
    })
  }
}

export const generateManifestResponse = async (archive: Archive, { baseUrl }: {
  baseUrl: string
}) => {
  const { data: opsFile, basePath: opfBasePath } = getArchiveOpfInfo(archive)

  if (!!opsFile) {
    const manifest = await generateManifestFromEpub(archive, baseUrl)
    const data = JSON.stringify(manifest)

    return new Response(data, { status: 200 })
  }

  const manifest = await generateManifestFromArchive(archive, baseUrl)
  const data = JSON.stringify(manifest)

  return new Response(data, { status: 200 })
}
