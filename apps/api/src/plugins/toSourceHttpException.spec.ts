import { HttpException } from "@nestjs/common"
import {
  ObokuErrorCode,
  ObokuSharedError,
  type SourceType,
} from "@oboku/shared"
import { describe, expect, it } from "vitest"
import { NonPublicAddressError } from "../http/publicAddress.js"
import { throwSourceHttpException } from "./toSourceHttpException.js"

const toAnswer = (sourceType: SourceType, error: unknown) => {
  try {
    return throwSourceHttpException(sourceType, error)
  } catch (thrown) {
    if (!(thrown instanceof HttpException)) throw thrown

    return { status: thrown.getStatus(), body: thrown.getResponse() }
  }
}

const SOURCE_FAILURES: ReadonlyArray<
  [string, SourceType, unknown, number, ObokuErrorCode]
> = [
  [
    "a file Drive does not find with 404",
    "DRIVE",
    { response: { status: 404 } },
    404,
    ObokuErrorCode.ERROR_RESOURCE_NOT_FOUND,
  ],
  [
    "a file OneDrive does not find with 404",
    "one-drive",
    new ObokuSharedError(
      ObokuErrorCode.ERROR_RESOURCE_NOT_FOUND,
      Object.assign(new Error("Item not found"), { status: 404 }),
    ),
    404,
    ObokuErrorCode.ERROR_RESOURCE_NOT_FOUND,
  ],
  [
    "a token Drive refuses with 502",
    "DRIVE",
    { response: { status: 403 } },
    502,
    ObokuErrorCode.ERROR_DATASOURCE_UNAUTHORIZED,
  ],
  [
    "a token OneDrive refuses with 502",
    "one-drive",
    Object.assign(new Error("Access token has expired"), { status: 401 }),
    502,
    ObokuErrorCode.ERROR_DATASOURCE_UNAUTHORIZED,
  ],
  [
    "a rate limit of Dropbox with 503",
    "dropbox",
    { status: 429 },
    503,
    ObokuErrorCode.ERROR_DATASOURCE_RATE_LIMIT_EXCEEDED,
  ],
  [
    "a web address the instance does not reach with 400",
    "URI",
    new NonPublicAddressError("nas.local"),
    400,
    ObokuErrorCode.ERROR_ADDRESS_NOT_ALLOWED,
  ],
  [
    "any other failure of an account's source with 502",
    "dropbox",
    new Error("socket hang up"),
    502,
    ObokuErrorCode.ERROR_DATASOURCE_UNKNOWN,
  ],
  [
    "a password a connector's server refuses with 502",
    "webdav",
    Object.assign(new Error("Invalid response: 401"), { status: 401 }),
    502,
    ObokuErrorCode.ERROR_PROVIDER_CONNECTION_SIGN_IN_REFUSED,
  ],
  [
    "a connector's server it cannot reach with 502",
    "opds",
    Object.assign(new Error("connect ECONNREFUSED"), { code: "ECONNREFUSED" }),
    502,
    ObokuErrorCode.ERROR_PROVIDER_CONNECTION_SERVER_UNREACHABLE,
  ],
]

describe("throwSourceHttpException", () => {
  it.each(SOURCE_FAILURES)(
    "answers %s",
    (_case, sourceType, error, status, code) => {
      expect(toAnswer(sourceType, error)).toEqual({
        status,
        body: { errors: [{ code }] },
      })
    },
  )
})
