import { getNormalizedHeader, lambda } from "../utils"
import axios from "axios"
import { dataSourceFacade } from "@oboku/api-shared/src/dataSources/facade"
import { withToken } from "../auth"
import { AWS_API_URI } from "../constants"
import { getNanoDbForUser } from "../db/helpers"
import { GOOGLE_CLIENT_ID, GOOGLE_CLIENT_SECRET } from "../constants"
import { configure as configureGoogleDataSource } from '@oboku/api-shared/src/dataSources/google'
import { S3 } from 'aws-sdk'

const s3 = new S3()

configureGoogleDataSource({
  client_id: GOOGLE_CLIENT_ID,
  client_secret: GOOGLE_CLIENT_SECRET
})

export const fn = lambda(async (event) => {
  const { email } = await withToken(event)
  const { dataSourceId } = JSON.parse(event.isBase64Encoded ? (Buffer.from(event.body, 'base64')).toString() : event.body)
  const credentials = JSON.parse(getNormalizedHeader(event, 'oboku-credentials') || '{}')
  const authorization = getNormalizedHeader(event, 'authorization')

  const refreshBookMetadata = ({ bookId }: { bookId: string }) =>
    axios.post(`${AWS_API_URI}/refresh-metadata`, JSON.stringify({ bookId }), {
      headers: {
        "content-type": "application/json",
        "accept": "application/json",
        'oboku-credentials': JSON.stringify(credentials),
        'authorization': authorization
      }
    })

  // const refreshBookMetadata = async ({ bookId }: { bookId: string }) =>{
  // }

  const isBookCoverExist = async ({ coverId }: { coverId: string }) => {
    try {
      await s3
        .headObject({ Bucket: 'oboku-covers', Key: `cover-${coverId}` }).promise()
      return true
    } catch (e) {
      if (e.code === 'NotFound') return false
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