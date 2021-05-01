import xmldoc from 'xmldoc'
import { parseTocFromNavPath } from '../parsers/nav'
import { getArchiveOpfInfo } from '../archiveHelpers'
import { Archive, Manifest } from '../types'
import { extractKoboInformationFromArchive } from '../parsers/kobo'

type SpineItemProperties = 'rendition:layout-reflowable' | 'page-spread-left' | 'page-spread-right'

export const generateManifestFromEpub = async (archive: Archive, baseUrl: string): Promise<Manifest> => {
  const { data: opsFile, basePath: opfBasePath } = getArchiveOpfInfo(archive)
  const koboInformation = await extractKoboInformationFromArchive(archive)

  if (!opsFile) {
    throw new Error('No opf content')
  }

  const data = await opsFile.string()

  console.log(data)

  const opfXmlDoc = new xmldoc.XmlDocument(data)

  // Try to detect if there is a nav item
  const navItem = opfXmlDoc.childNamed('manifest')?.childrenNamed('item')
    .find((child) => child.attr.properties === 'nav');

  let toc = []

  if (navItem) {
    const tocFile = Object.values(archive.files).find(item => item.name.endsWith(navItem.attr.href || ''))
    if (tocFile) {
      toc = parseTocFromNavPath(await tocFile.string())
    }
  }

  const metadataElm = opfXmlDoc.childNamed('metadata')
  const manifestElm = opfXmlDoc.childNamed('manifest')
  const spineElm = opfXmlDoc.childNamed('spine')
  const titleElm = metadataElm?.childNamed(`dc:title`)
  const metaElmChildren = metadataElm?.childrenNamed(`meta`) || []
  const metaElmWithRendition = metaElmChildren.find(meta => meta.attr['property'] === `rendition:layout`)

  const defaultRenditionLayout = metaElmWithRendition?.val as 'reflowable' | 'pre-paginated' | undefined
  const title = titleElm?.val || ''
  const pageProgressionDirection = spineElm?.attr['page-progression-direction'] as `ltr` | `rtl` | undefined

  const spineItemIds = spineElm?.childrenNamed(`itemref`).map((item) => item.attr['idref']) as string[]
  const manifestItemsFromSpine = manifestElm?.childrenNamed(`item`).filter((item) => spineItemIds.includes(item.attr['id'] || ``)) || []
  const archiveSpineItems = archive.files.filter(file => {
    return manifestItemsFromSpine.find(item => {
      if (!opfBasePath) return `${item.attr['href']}` === file.name
      return `${opfBasePath}/${item.attr['href']}` === file.name
    })
  })

  const totalSize = archiveSpineItems.reduce((size, file) => file.size + size, 1)

  return {
    filename: archive.filename,
    nav: {
      toc,
    },
    renditionLayout: defaultRenditionLayout || koboInformation.renditionLayout || 'reflowable',
    title,
    readingDirection: pageProgressionDirection || 'ltr',
    readingOrder: spineElm?.childrenNamed(`itemref`).map((itemrefElm) => {
      const manifestItem = manifestElm?.childrenNamed(`item`).find((item) => item.attr['id'] === itemrefElm?.attr['idref'])
      const href = manifestItem?.attr['href'] || ``
      const properties = (itemrefElm?.attr['properties']?.split(` `) || []) as SpineItemProperties[]
      const itemSize = archive.files.find(file => file.name.endsWith(href))?.size || 0

      return {
        id: manifestItem?.attr['id'] || ``,
        path: opfBasePath ? `${opfBasePath}/${manifestItem?.attr['href']}` : `${manifestItem?.attr['href']}`,
        href: opfBasePath ? `${baseUrl}/${opfBasePath}/${manifestItem?.attr['href']}` : `${baseUrl}/${manifestItem?.attr['href']}`,
        renditionLayout: defaultRenditionLayout || `reflowable`,
        ...properties.find(property => property === 'rendition:layout-reflowable') && {
          renditionLayout: `reflowable`,
        },
        progressionWeight: itemSize / totalSize,
        size: itemSize
      }
    }) || []
  }
}

export const generateManifestFromArchive = async (archive: Archive, baseUrl: string): Promise<Manifest> => {
  const files = Object.values(archive.files).filter(file => !file.dir)

  return {
    filename: archive.filename,
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
