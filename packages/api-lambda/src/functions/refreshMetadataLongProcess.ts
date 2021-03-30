/**
 * @todo handle error code ENOSPC
 * @see https://console.aws.amazon.com/cloudwatch/home?region=us-east-1#logsV2:log-groups/log-group/$252Faws$252Flambda$252Foboku-api-RefreshMetadataLongProcessFunction-1FN5C0L9PKJAY/log-events/2021$252F02$252F17$252F$255B$2524LATEST$255D3bc34158bfa44f278d8fd4aeb86e9202$3Fstart$3DPT3H
 */
import { getNormalizedHeader, lambda } from "../utils"
import { atomicUpdate, findOne } from "../db/helpers"
import { withToken } from "../auth"
import { retrieveMetadataAndSaveCover } from "../books/retrieveMetadataAndSaveCover"
import { getNanoDbForUser } from "../db/helpers"
import * as fs from 'fs'
import * as path from 'path'
import { GOOGLE_CLIENT_ID, GOOGLE_CLIENT_SECRET, TMP_DIR } from "../constants"
import { configure as configureGoogleDataSource } from '../dataSources/google'
import { PromiseReturnType } from "../types"
import { getEventBody } from "../utils/getEventBody"

configureGoogleDataSource({
  client_id: GOOGLE_CLIENT_ID,
  client_secret: GOOGLE_CLIENT_SECRET
})

export const fn = lambda(async (event) => {
  const files = await fs.promises.readdir(TMP_DIR)
  await Promise.all(files.map(file => {
    return fs.promises.unlink(path.join(TMP_DIR, file));
  }))

  const { userId, email } = await withToken(event)

  let bookId: string | undefined = undefined

  try {
    bookId = getEventBody(event).bookId
  } catch (e) {
    throw new Error(`Unable to parse event.body -> ${event.body}`)
  }

  const db = await getNanoDbForUser(email)

  const book = await findOne(db, 'book', { selector: { _id: bookId } })
  if (!book) throw new Error(`Unable to find book ${bookId}`)

  if (book.metadataUpdateStatus !== 'fetching') {
    await atomicUpdate(db, 'book', book._id, old => ({
      ...old,
      metadataUpdateStatus: 'fetching' as const,
    }))
  }

  const firstLinkId = (book.links || [])[0] || '-1'

  const link = await findOne(db, 'link', { selector: { _id: firstLinkId } })

  if (!link) throw new Error(`Unable to find link ${firstLinkId}`)

  let data: PromiseReturnType<typeof retrieveMetadataAndSaveCover>
  try {
    data = await retrieveMetadataAndSaveCover({
      userId,
      userEmail: email,
      credentials: JSON.parse(getNormalizedHeader(event, 'oboku-credentials') || '{}'),
      book,
      link
    })
  } catch (e) {
    await atomicUpdate(db, 'book', book._id, old => ({
      ...old,
      metadataUpdateStatus: null,
      lastMetadataUpdateError: 'unknown',
    }))
    throw e
  }

  await atomicUpdate(db, 'book', book._id, old => ({
    ...old,
    title: data.book?.title || old.title,
    creator: data.book?.creator || old.creator,
    date: data.book?.date || old.date,
    publisher: data.book?.publisher || old.publisher,
    subject: data.book?.subject || old.subject,
    lang: data.book?.lang || old.lang,
    lastMetadataUpdatedAt: new Date().getTime(),
    metadataUpdateStatus: null,
    lastMetadataUpdateError: null,
  }))
  await atomicUpdate(db, 'link', link._id, old => ({ ...old, contentLength: data.link.contentLength }))

  return {
    statusCode: 200,
    body: JSON.stringify({}),
  }
})