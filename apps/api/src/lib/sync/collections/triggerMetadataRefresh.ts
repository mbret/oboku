import axios from "axios"
import type { Context } from "../types"
import { Logger } from "@nestjs/common"
import { EnvironmentVariables } from "src/types"
import { ConfigService } from "@nestjs/config"

const logger = new Logger("sync/triggerMetadataRefresh")

/**
 * @todo
 * - trigger if we detect changes that require metadata refresh only
 */
export const triggerMetadataRefresh = async ({
  ctx,
  collectionId,
  config,
}: {
  ctx: Context
  collectionId: string
  config: ConfigService<EnvironmentVariables>
}) => {
  logger.log(`triggering refresh metadata for ${collectionId}`)

  axios({
    method: `post`,
    url: `${config.get("AWS_API_URI", { infer: true })}/refresh-metadata-collection`,
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
