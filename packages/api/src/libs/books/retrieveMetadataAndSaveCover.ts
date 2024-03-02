import fs from "fs"
import path from "path"
import unzipper from "unzipper"
import { dataSourceFacade } from "../plugins/facade"
import { BookDocType, LinkDocType, OPF } from "@oboku/shared"
import { detectMimeTypeFromContent } from "../utils"
import { Logger } from "@libs/logger"
import { saveCoverFromArchiveToBucket } from "./saveCoverFromArchiveToBucket"
import { parseOpfMetadata } from "../metadata/opf/parseOpfMetadata"
import { saveCoverFromExternalLinkToBucket } from "./saveCoverFromExternalLinkToBucket"
import { METADATA_EXTRACTOR_SUPPORTED_EXTENSIONS } from "../../constants"
import { parseXmlAsJson } from "./parseXmlAsJson"
import { getBookSourcesMetadata } from "@libs/metadata/getBookSourcesMetadata"
import { reduceMetadata } from "@libs/metadata/reduceMetadata"
import { downloadToTmpFolder } from "@libs/download/downloadToTmpFolder"

const logger = Logger.namespace("retrieveMetadataAndSaveCover")

export type Context = {
  userName: string
  userNameHex: string
  credentials?: any
  book: BookDocType
  link: LinkDocType
}

export const retrieveMetadataAndSaveCover = async (ctx: Context) => {
  console.log(
    `syncMetadata run for user ${ctx.userName} with book ${ctx.book._id}`
  )
  let bookNameForDebug = ""

  let fileToUnlink: string | undefined

  try {
    bookNameForDebug = reduceMetadata(ctx.book.metadata).title || ""

    console.log(
      `syncMetadata processing ${ctx.book._id} with resource id ${ctx.link.resourceId}`
    )

    // try to pre-fetch metadata before trying to download the file
    // in case some directive are needed to prevent downloading huge file.
    const { shouldDownload, metadata: linkMetadata } =
      await dataSourceFacade.getMetadata(ctx.link, ctx.credentials)

    let contentType = linkMetadata.contentType

    const sourcesMetadata = await getBookSourcesMetadata({
      ...linkMetadata,
      // some plugins returns filename and not title
      title: path.parse(linkMetadata.title ?? "").name
    })

    const metadataList = [linkMetadata, ...sourcesMetadata]

    const { filepath: tmpFilePath, metadata: downloadMetadata } = shouldDownload
      ? await downloadToTmpFolder(ctx, ctx.book, ctx.link)
      : { filepath: undefined, metadata: {} }

    fileToUnlink = tmpFilePath
    contentType = downloadMetadata.contentType || contentType

    console.log(
      `syncMetadata processing ${ctx.book._id}`,
      tmpFilePath,
      {
        linkMetadata
      },
      contentType
    )

    if (!shouldDownload) {
      // @todo prioritize which cover we take
      const coverLink = metadataList.find(
        (metadata) => metadata.coverLink
      )?.coverLink

      if (coverLink) {
        await saveCoverFromExternalLinkToBucket(ctx, ctx.book, coverLink)
      }
    }

    let opfBasePath = ""
    let contentLength = 0
    let coverRelativePath: string | undefined

    if (typeof tmpFilePath === "string" && tmpFilePath) {
      // before starting the extraction and if we still don't have a content type, we will try to get it from the file itself.
      if (!contentType) {
        contentType =
          (await detectMimeTypeFromContent(tmpFilePath)) || contentType
      }

      if (
        contentType &&
        METADATA_EXTRACTOR_SUPPORTED_EXTENSIONS.includes(contentType)
      ) {
        const files: string[] = []
        const coverAllowedExt = [".jpg", ".jpeg", ".png"]
        let isEpub = false
        let opfAsJson: OPF = {
          package: {
            manifest: {},
            metadata: {}
          }
        }

        await fs
          .createReadStream(tmpFilePath)
          .pipe(
            unzipper.Parse({
              verbose: false
            })
          )
          .on("entry", async (entry: unzipper.Entry) => {
            contentLength = contentLength + entry.vars.compressedSize
            const filepath = entry.path

            if (entry.type === "File") {
              files.push(entry.path)
            }

            if (filepath.endsWith(".opf")) {
              isEpub = true
              opfBasePath = `${filepath.substring(
                0,
                filepath.lastIndexOf("/")
              )}`
              const xml = (await entry.buffer()).toString("utf8")
              opfAsJson = parseXmlAsJson(xml)
              entry.autodrain()
            } else {
              entry.autodrain()
            }
          })
          .promise()

        coverRelativePath = isEpub
          ? findCoverPathFromOpf(opfAsJson)
          : files
              .filter((file) =>
                coverAllowedExt.includes(path.extname(file).toLowerCase())
              )
              .sort()[0]

        Logger.log(`coverRelativePath`, coverRelativePath)
        Logger.log(`opfBasePath`, opfBasePath)

        metadataList.push({
          type: "file",
          ...parseOpfMetadata(opfAsJson),
          contentType
        })

        if (coverRelativePath) {
          await saveCoverFromArchiveToBucket(
            ctx,
            ctx.book,
            tmpFilePath,
            opfBasePath,
            coverRelativePath
          )
        } else {
          console.log(`No cover path found for ${tmpFilePath}`)
        }
      } else {
        logger.log(
          `${contentType} cannot be extracted to retrieve information (cover, etc)`
        )
      }
    }

    console.log(
      `metadataDaemon Finished processing book ${ctx.book._id} with resource id ${ctx.link.resourceId}`
    )

    const bookData = {
      metadata: metadataList
    }

    return {
      book: bookData,
      link: {
        contentLength
      }
    }
  } catch (e) {
    console.log(
      `Error while processing book ${ctx.book._id} ${bookNameForDebug}`
    )
    throw e
  } finally {
    try {
      /**
       * Make sure to remove temporary file in case of crash
       */
      if (typeof fileToUnlink === "string") {
        await fs.promises.unlink(fileToUnlink)
      }
    } catch (e) {
      console.error(e)
    }
  }
}

const findCoverPathFromOpf = (opf: OPF) => {
  const manifest = opf.package?.manifest
  const meta = opf.package?.metadata?.meta
  const normalizedMeta = Array.isArray(meta) ? meta : meta ? [meta] : []
  const coverInMeta = normalizedMeta.find(
    (item) => item?.name === "cover" && (item?.content?.length || 0) > 0
  )
  let href = ""

  const isImage = (
    item: NonNullable<NonNullable<typeof manifest>["item"]>[number]
  ) =>
    item["media-type"] &&
    (item["media-type"].indexOf("image/") > -1 ||
      item["media-type"].indexOf("page/jpeg") > -1 ||
      item["media-type"].indexOf("page/png") > -1)

  if (coverInMeta) {
    const item = manifest?.item?.find(
      (item) => item.id === coverInMeta?.content && isImage(item)
    )

    if (item) {
      return item?.href
    }
  }

  manifest?.item?.find((item) => {
    const indexOfCover = item?.id?.toLowerCase().indexOf("cover")
    if (indexOfCover !== undefined && indexOfCover > -1 && isImage(item)) {
      href = item.href || ""
    }
    return ""
  })

  return href
}
