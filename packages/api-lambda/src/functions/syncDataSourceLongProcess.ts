import { getNormalizedHeader, lambda } from "../utils"
import axios from "axios"
import { dataSourceFacade } from "../dataSources/facade"
import { withToken } from "../auth"
import { AWS_API_URI } from "../constants"
import { getNanoDbForUser } from "../db/helpers"
import { GOOGLE_CLIENT_ID, GOOGLE_CLIENT_SECRET } from "../constants"
import { configure as configureGoogleDataSource } from '../dataSources/google'
import { S3 } from 'aws-sdk'
import { getEventBody } from "../utils/getEventBody"

const s3 = new S3()

configureGoogleDataSource({
  client_id: GOOGLE_CLIENT_ID,
  client_secret: GOOGLE_CLIENT_SECRET
})

export const fn = lambda(async (event) => {
  const { email } = await withToken(event)
  const { dataSourceId } = getEventBody(event)
  const credentials = JSON.parse(getNormalizedHeader(event, 'oboku-credentials') || '{}')
  const authorization = getNormalizedHeader(event, 'authorization') || ``

  const refreshBookMetadata = ({ bookId }: { bookId: string }) =>
    axios.post(`${AWS_API_URI}/refresh-metadata`, JSON.stringify({ bookId }), {
      headers: {
        "content-type": "application/json",
        "accept": "application/json",
        'oboku-credentials': JSON.stringify(credentials),
        'authorization': authorization
      }
    })

  const isBookCoverExist = async ({ coverId }: { coverId: string }) => {
    try {
      await s3
        .headObject({ Bucket: 'oboku-covers', Key: `cover-${coverId}` }).promise()
      return true
    } catch (e) {
      if ((e as any).code === 'NotFound') return false
      throw e
    }
  }

  await dataSourceFacade.sync({
    dataSourceId,
    db: await getNanoDbForUser(email),
    refreshBookMetadata,
    isBookCoverExist,
    userEmail: email,
    credentials
  })

  return {
    statusCode: 200,
    body: JSON.stringify({}),
  }
})