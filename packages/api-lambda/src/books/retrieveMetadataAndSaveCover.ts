import * as fs from 'fs'
import * as path from 'path'
import * as unzipper from 'unzipper'
import { dataSourceFacade } from '@oboku/api-shared/src/dataSources/facade'
import * as parser from 'fast-xml-parser'
import { BookDocType, LinkDocType, OPF, METADATA_EXTRACTOR_SUPPORTED_EXTENSIONS } from '@oboku/shared/src'
import { detectMimeTypeFromContent } from "../utils"
import { PromiseReturnType } from "../types"
import { COVER_MAXIMUM_SIZE_FOR_STORAGE, TMP_DIR } from '../constants'
import { S3 } from 'aws-sdk'
import sharp from 'sharp'
import { Logger } from '../utils/logger'
import { extractMetadataFromName } from '@oboku/shared/src/directives'
import { findByISBN } from './googleBooksApi'
import axios from "axios"

type Context = {
  userEmail: string,
  userId: string,
  credentials?: any,
  book: BookDocType,
  link: LinkDocType
}

const s3 = new S3()

export const retrieveMetadataAndSaveCover = async (ctx: Context) => {
  console.log(`syncMetadata run for user ${ctx.userEmail} with book ${ctx.book._id}`)
  let bookNameForDebug = ''

  let tmpFilePath: string | number = -1

  try {
    bookNameForDebug = ctx.book.title || ''

    console.log(`syncMetadata processing ${ctx.book._id} with resource id ${ctx.link.resourceId}`)

    // try to prefetch metadata before trying to download the file
    // in case some directive are needed to prevent downloading huge file.
    const metadataPrefetch = await dataSourceFacade.getMetadata(ctx.link, ctx.credentials)

    const metadataFromName = extractMetadataFromName(metadataPrefetch.name)

    let normalizedMetadata: Partial<ReturnType<typeof normalizeMetadata>> = {
      title: metadataPrefetch.name
    }
    let fallbackContentType = 'unknown'
    let skipExtract = !!metadataFromName.isbn

    if (skipExtract) {
      console.log(`syncMetadata processing ${ctx.book._id} will skip extract for isbn ${metadataFromName.isbn}`)
    }

    if (!skipExtract) {
      const { filepath, metadata } = await downloadToTmpFolder(ctx, ctx.book, ctx.link)
      tmpFilePath = filepath
      normalizedMetadata.title = metadataPrefetch.name
      fallbackContentType = metadata.contentType || fallbackContentType
    }

    console.log(`syncMetadata processing ${ctx.book._id}`, tmpFilePath, normalizedMetadata)

    let folderBasePath = ''
    let contentLength = 0
    let coverPath: string | undefined

    if (skipExtract && metadataFromName.isbn) {
      try {
        const response = await findByISBN(metadataFromName.isbn)
        if (response.status === 200 && Array.isArray(response.data.items) && response.data.items.length > 0) {
          const item = response.data.items[0]
          normalizedMetadata.creator = item.volumeInfo.authors[0]
          normalizedMetadata.title = item.volumeInfo.title
          normalizedMetadata.date = new Date(item.volumeInfo.publishedDate)
          normalizedMetadata.publisher = item.volumeInfo.publisher
          normalizedMetadata.language = item.volumeInfo.language
          normalizedMetadata.subject = item.volumeInfo.categories
          await saveCoverFromExternalLinkToBucket(ctx, ctx.book, item.volumeInfo.imageLinks.thumbnail.replace('zoom=1', 'zoom=2'))
        }
      } catch (e) {
        console.error(e)
      }
    }

    if (!skipExtract && typeof tmpFilePath === 'string') {
      if (!METADATA_EXTRACTOR_SUPPORTED_EXTENSIONS.includes(fallbackContentType || '')) {
        fallbackContentType = (await detectMimeTypeFromContent(tmpFilePath) || fallbackContentType)
      }

      if (METADATA_EXTRACTOR_SUPPORTED_EXTENSIONS.includes(fallbackContentType)) {
        const files: string[] = []
        const coverAllowedExt = ['.jpg', '.jpeg', '.png']
        let isEpub = false
        let opfAsJson: OPF = {
          package: {
            manifest: {},
            metadata: {
              "dc:title": normalizedMetadata.title
            }
          }
        }

        await fs.createReadStream(tmpFilePath)
          .pipe(unzipper.Parse({
            verbose: false
          }))
          .on('entry', async (entry: unzipper.Entry) => {
            contentLength = contentLength + entry.vars.compressedSize
            const filepath = entry.path

            if (entry.type === 'File') {
              files.push(entry.path)
            }

            if (filepath.endsWith('.opf')) {
              isEpub = true
              const filepathParts = filepath.split('/')
              if (filepathParts.length > 1) {
                folderBasePath = `${filepathParts[0]}/`
              }
              const xml = (await entry.buffer()).toString('utf8')
              opfAsJson = parser.parse(xml, {
                attributeNamePrefix: '',
                ignoreAttributes: false,
              })
              entry.autodrain()
            } else {
              entry.autodrain()
            }
          }).promise()

        coverPath = isEpub
          ? findMissingCover(opfAsJson)
          : files
            .filter(file => coverAllowedExt.includes(path.extname(file).toLowerCase()))
            .sort()[0]

        console.log(opfAsJson, opfAsJson?.package?.metadata)

        normalizedMetadata = normalizeMetadata(opfAsJson)

        if (coverPath) {
          await saveCoverFromArchiveToBucket(ctx, ctx.book, tmpFilePath, folderBasePath, coverPath)
        } else {
          console.log(`No cover path found for ${tmpFilePath}`)
        }

      } else {
        console.log(`retrieveMetadataAndSaveCover format not supported yet`)
      }
    }

    console.log(`metadataDaemon Finished processing book ${ctx.book._id} with resource id ${ctx.link.resourceId}`)

    const bookData = {
      title: normalizedMetadata?.title,
      creator: normalizedMetadata?.creator,
      date: normalizedMetadata?.date?.getTime(),
      publisher: normalizedMetadata?.publisher,
      subject: normalizedMetadata?.subject,
      lang: normalizedMetadata?.language,
      lastMetadataUpdatedAt: new Date().getTime(),
    }

    Object.keys(bookData).forEach(key => (bookData as any)[key] === undefined && delete (bookData as any)[key])

    return {
      book: bookData,
      link: {
        contentLength
      }
    }

  } catch (e) {
    console.log(`Error while processing book ${ctx.book._id} ${bookNameForDebug}`)
    throw e
  } finally {
    try {
      if (typeof tmpFilePath === 'string') {
        await fs.promises.unlink(tmpFilePath)
      }
    } catch (e) { }
  }
}

const saveCoverFromExternalLinkToBucket = async (ctx: Context, book: BookDocType, coverUrl: string) => {
  const objectKey = `cover-${ctx.userId}-${book._id}`

  Logger.log(`prepare to save cover ${objectKey}`)

  try {
    const response = await axios.get<ArrayBuffer>(coverUrl, {
      responseType: 'arraybuffer'
    })
    const entryAsBuffer = Buffer.from(response.data)

    const resized = await sharp(entryAsBuffer)
      .resize({
        withoutEnlargement: true,
        width: COVER_MAXIMUM_SIZE_FOR_STORAGE.width,
        height: COVER_MAXIMUM_SIZE_FOR_STORAGE.height,
        fit: 'inside'
      })
      .webp()
      .toBuffer()

    await s3.putObject({
      Bucket: 'oboku-covers',
      Body: resized,
      Key: objectKey,
    }).promise()

    Logger.log(`cover ${objectKey} has been saved/updated`)
  } catch (e) {
    console.error(e)
  }
}


const saveCoverFromArchiveToBucket = async (ctx: Context, book: BookDocType, epubFilepath: string, folderBasePath: string, coverPath: string) => {
  if (coverPath) {
    const objectKey = `cover-${ctx.userId}-${book._id}`

    Logger.log(`prepare to save cover ${objectKey}`)

    const zip = fs.createReadStream(epubFilepath).pipe(unzipper.Parse({ forceStream: true }))
    for await (const entry of zip) {
      if (entry.path === `${folderBasePath}${coverPath}`) {
        const entryAsBuffer = await entry.buffer() as Buffer
        const resized = await sharp(entryAsBuffer)
          .resize({
            withoutEnlargement: true,
            width: COVER_MAXIMUM_SIZE_FOR_STORAGE.width,
            height: COVER_MAXIMUM_SIZE_FOR_STORAGE.height,
            fit: 'inside'
          })
          .webp()
          .toBuffer()

        await s3.putObject({
          Bucket: 'oboku-covers',
          Body: resized,
          Key: objectKey,
        }).promise()

        Logger.log(`cover ${objectKey} has been saved/updated`)
      } else {
        entry.autodrain()
      }
    }
  }
}

const findMissingCover = (opf: OPF) => {
  const manifest = opf.package?.manifest
  const meta = opf.package?.metadata?.meta
  const normalizedMeta = Array.isArray(meta) ? meta : meta ? [meta] : []
  const coverInMeta = normalizedMeta.find((item) => item?.name === 'cover' && (item?.content?.length || 0) > 0)
  let href = ''

  const isImage = (item: NonNullable<NonNullable<typeof manifest>['item']>[number]) =>
    item['media-type'] && (item['media-type'].indexOf('image/') > -1 || item['media-type'].indexOf('page/jpeg') > -1 || item['media-type'].indexOf('page/png') > -1)

  if (coverInMeta) {
    const item = manifest?.item?.find((item) => item.id === coverInMeta?.content && isImage(item))

    if (item) {
      return item?.href
    }
  }

  manifest?.item?.find((item) => {
    const indexOfCover = item?.id?.toLowerCase().indexOf('cover')
    if (
      indexOfCover !== undefined && indexOfCover > -1 && isImage(item)) {
      href = item.href || ''
    }
    return ''
  })

  return href
}

const normalizeMetadata = (opf: OPF) => {
  const metadata = opf.package?.metadata || {}
  const creator = metadata['dc:creator']

  return {
    title: typeof metadata['dc:title'] === 'object'
      ? metadata['dc:title']['#text']
      : metadata['title'] || metadata['dc:title'],
    publisher: typeof metadata['dc:publisher'] === 'string'
      ? metadata['dc:publisher']
      : typeof metadata['dc:publisher'] === 'object'
        ? metadata['dc:publisher']['#text']
        : undefined,
    rights: metadata['dc:rights'] as string | undefined,
    language: extractLanguage(metadata['dc:language']),
    date: metadata['dc:date']
      ? new Date(metadata['dc:date'])
      : undefined,
    subject: Array.isArray(metadata['dc:subject'])
      ? metadata['dc:subject'] as string[]
      : typeof metadata['dc:subject'] === 'string' ? [metadata['dc:subject']] as string[] : null,
    creator: Array.isArray(creator)
      ? creator[0]['#text']
      : typeof creator === 'object'
        ? creator['#text']
        : creator,
  }
}

const extractLanguage = (metadata?: undefined | null | string | { ['#text']?: string }): string | null => {
  if (!metadata) return null

  if (typeof metadata === 'string') return metadata

  if (metadata['#text']) return metadata['#text']

  return null
}

const downloadToTmpFolder = (ctx: Context, book: BookDocType, link: LinkDocType) => new Promise<{
  filepath: string,
  metadata: PromiseReturnType<typeof dataSourceFacade.dowload>['metadata']
}>(async (resolve, reject) => {
  try {
    const { stream, metadata } = await dataSourceFacade.dowload(link, ctx.credentials)

    let filename = `${book._id}`

    switch (metadata.contentType) {
      case 'application/x-cbz': {
        filename = `${book._id}.cbz`
        break
      }
      case 'application/epub+zip': {
        filename = `${book._id}.epub`
        break
      }
      default:
    }

    const filepath = path.join(TMP_DIR, filename)
    const fileWriteStream = fs.createWriteStream(filepath, { flags: 'w' })

    stream
      .on('error', reject)
      .pipe(fileWriteStream)
      .on('finish', () => resolve({
        filepath,
        metadata,
      }))
      .on('error', reject)
  } catch (e) {
    reject(e)
  }
})