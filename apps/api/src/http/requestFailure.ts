import type { AxiosError } from "axios"

/**
 * Keeps only the message and code of a failed request. The AxiosError holds
 * the request's URL and headers in its config and request, with whatever
 * credentials they carry: a password in the query, an Authorization header.
 * So can its causes: Node keeps the URL as `base` when a redirect leads to an
 * invalid URL.
 */
export const toRequestFailure = (description: string, error: AxiosError) =>
  Object.assign(new Error(`${description}: ${error.message}`), {
    code: error.code,
  })
