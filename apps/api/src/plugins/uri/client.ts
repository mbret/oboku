import {
  createAnsweredStatusError,
  isSuccessStatus,
  requestUserAddress,
} from "../../http/userAddressRequest.js"

/**
 * GETs the file at `url`.
 *
 * @throws the errors of `requestUserAddress`, and an error with the `status`
 * the server answered with, the answer closed, when it answered no success.
 */
export async function getFromWebAddress({
  url,
  allowSelfSigned,
  headers,
}: {
  url: string
  allowSelfSigned?: boolean
  headers?: Record<string, string>
}) {
  const address = new URL(url)
  const request = `Request to ${address.origin}`
  const answer = await requestUserAddress({
    url: address,
    request,
    headers,
    allowSelfSigned,
  })

  if (!isSuccessStatus(answer.status)) {
    answer.stream.destroy()

    throw createAnsweredStatusError(request, answer.status)
  }

  return answer
}
