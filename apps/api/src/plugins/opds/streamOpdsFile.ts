import type { OpdsBookLinkData } from "@oboku/shared"
import { UNCOMPRESSED_ANSWER_HEADERS } from "../../http/userAddressRequest.js"
import { toAnswerFile } from "../sourceFile.js"
import { getFromCatalog, type OpdsConnector } from "./client.js"

/**
 * Streams a book's file from its catalog, with the credentials `connector`
 * holds, failing past the length the catalog's answer states, or else the one
 * the feed states.
 *
 * @throws the errors of `getFromCatalog` and `toAnswerFile`.
 */
export const streamOpdsFile = async ({
  connector,
  acquisition,
}: {
  connector: OpdsConnector
  acquisition: OpdsBookLinkData["acquisition"]
}) => {
  const { stream, headers } = await getFromCatalog(
    connector,
    new URL(acquisition.href),
    { headers: UNCOMPRESSED_ANSWER_HEADERS },
  )

  return toAnswerFile({
    stream,
    headers,
    statedSize: acquisition.length,
  })
}
