import type { UriLinkData } from "@oboku/shared"
import { UNCOMPRESSED_ANSWER_HEADERS } from "../../http/userAddressRequest.js"
import { toAnswerFile } from "../sourceFile.js"
import { getFromWebAddress } from "./client.js"
import { extractNameFromUrl } from "./index.js"

/**
 * Streams the file at a web address, failing past the length its answer
 * states.
 *
 * @throws the errors of `getFromWebAddress` and `toAnswerFile`.
 */
export const streamUriFile = async ({ url, allowSelfSigned }: UriLinkData) => {
  const { stream, headers } = await getFromWebAddress({
    url,
    allowSelfSigned,
    headers: UNCOMPRESSED_ANSWER_HEADERS,
  })

  return toAnswerFile({
    stream,
    headers,
    fallbackName: extractNameFromUrl(url),
  })
}
