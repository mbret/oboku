import * as fs from 'fs'
import * as unzipper from 'unzipper'
import { BookDocType } from '@oboku/shared/src'
import { COVER_MAXIMUM_SIZE_FOR_STORAGE } from '../constants'
import { S3 } from 'aws-sdk'
import sharp from 'sharp'
import { Logger } from '../Logger'
import { asError } from '../utils/asError'

const logger = Logger.namespace('saveCoverFromArchiveToBucket')

type Context = {
  userId: string,
}

const s3 = new S3()

export const saveCoverFromArchiveToBucket = async (ctx: Context, book: BookDocType, epubFilepath: string, folderBasePath: string, coverPath: string) => {
  if (coverPath === ``) {
    logger.error(`coverPath is empty string, ignoring process`, book._id)
    return
  }

  const coverAbsolutePath = folderBasePath === `` ? coverPath : `${folderBasePath}/${coverPath}`
  const objectKey = `cover-${ctx.userId}-${book._id}`

  logger.log(`prepare to save cover ${objectKey}`)

  const zip = fs.createReadStream(epubFilepath).pipe(unzipper.Parse({ forceStream: true }))

  try {
    for await (const entry of zip) {
      if (entry.path === coverAbsolutePath) {
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

        logger.log(`cover ${objectKey} has been saved/updated`)
      } else {
        entry.autodrain()
      }
    }
  } catch (e) {
    const { message } = asError(e)
    if (message === `Input buffer contains unsupported image format`) {
      return logger.error(`It seems input is not a valid image. This can happens when for example the file is encrypted or something else went wrong during archive extraction`, e)
    } else {
      logger.error(e)
    }
  }
}