import { Logger } from "@libs/logger"
import axios from "axios"
import { AWS_API_URI } from "src/constants"
import { Context } from "../types"

const logger = Logger.child({ module: "sync/triggerMetadataRefresh" })

/**
 * @todo
 * - trigger if we detect changes that require metadata refresh only
 */
export const triggerMetadataRefresh = async ({
  ctx,
  collectionId,
}: {
  ctx: Context
  collectionId: string
}) => {
  logger.info(`triggering refresh metadata for ${collectionId}`)

  axios({
    method: `post`,
    url: `${AWS_API_URI}/refresh-metadata-collection`,
    data: {
      collectionId,
      soft: true,
    },
    headers: {
      "content-type": "application/json",
      accept: "application/json",
      "oboku-credentials": JSON.stringify(ctx.credentials),
      authorization: ctx.authorization,
    },
  }).catch(logger.error)
}
