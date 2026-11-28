import {
  BadGatewayException,
  NotFoundException,
  ServiceUnavailableException,
} from "@nestjs/common"
import {
  assertNever,
  ObokuErrorCode,
  ObokuSharedError,
  type SourceType,
} from "@oboku/shared"
import { toAnsweredStatus } from "../http/answeredStatus.js"
import { toGoogleApiFailure } from "../http/googleApiFailure.js"
import { toObokuErrorBody } from "../http/obokuBadRequest.js"
import {
  throwConnectorHttpException,
  throwWebAddressHttpException,
} from "./toConnectorHttpException.js"

/**
 * The status a source refused a request with. The Dropbox SDK and
 * `MicrosoftGraphError`, for OneDrive, put it on the error. gaxios, for
 * Drive, puts it on the error's `response`.
 */
const toRefusedStatus = (error: unknown) =>
  toAnsweredStatus(error) ?? toGoogleApiFailure(error).status

/** OneDrive's client turns a 404 into this error, which carries no status. */
const isResourceNotFoundError = (error: unknown) =>
  error instanceof ObokuSharedError &&
  error.code === ObokuErrorCode.ERROR_RESOURCE_NOT_FOUND

const toAccountSourceHttpException = (error: unknown) => {
  const refusedStatus = toRefusedStatus(error)

  if (refusedStatus === 404 || isResourceNotFoundError(error)) {
    return new NotFoundException(
      toObokuErrorBody(ObokuErrorCode.ERROR_RESOURCE_NOT_FOUND),
    )
  }

  if (refusedStatus === 429) {
    return new ServiceUnavailableException(
      toObokuErrorBody(ObokuErrorCode.ERROR_DATASOURCE_RATE_LIMIT_EXCEEDED),
    )
  }

  const isAccessRefused = refusedStatus === 401 || refusedStatus === 403

  return new BadGatewayException(
    toObokuErrorBody(
      isAccessRefused
        ? ObokuErrorCode.ERROR_DATASOURCE_UNAUTHORIZED
        : ObokuErrorCode.ERROR_DATASOURCE_UNKNOWN,
    ),
  )
}

/**
 * Throws what a route answers when the source of a link would not send its
 * file. A source that goes through a connector, and a web address, answer as
 * the mappings of `toConnectorHttpException.ts` do.
 */
export const throwSourceHttpException = (
  sourceType: SourceType,
  error: unknown,
): never => {
  switch (sourceType) {
    case "webdav":
    case "synology-drive":
    case "server":
    case "opds":
      return throwConnectorHttpException(error)
    case "URI":
      return throwWebAddressHttpException(error)
    case "DRIVE":
    case "dropbox":
    case "one-drive":
    case "file":
      throw toAccountSourceHttpException(error)
    default:
      return assertNever(sourceType)
  }
}
