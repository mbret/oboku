import { BadGatewayException, NotFoundException } from "@nestjs/common"
import { ObokuErrorCode } from "@oboku/shared"
import { isSignInRefused, toAnsweredStatus } from "../http/answeredStatus.js"
import {
  createObokuBadRequest,
  toObokuErrorBody,
} from "../http/obokuBadRequest.js"
import { isNonPublicAddressError } from "../http/publicAddress.js"
import {
  ConnectorNotConfiguredError,
  ConnectorNotFoundError,
} from "./connectorHelpers.js"
import { FileSizeUnstatedError } from "./plugins.service.js"

const toConnectorHttpException = (error: unknown) => {
  if (error instanceof ConnectorNotConfiguredError) {
    return createObokuBadRequest(ObokuErrorCode.ERROR_CONNECTOR_NOT_CONFIGURED)
  }

  if (error instanceof ConnectorNotFoundError) {
    return createObokuBadRequest(
      ObokuErrorCode.ERROR_PROVIDER_CONNECTION_CONNECTOR_NOT_FOUND,
    )
  }

  if (isNonPublicAddressError(error)) {
    return createObokuBadRequest(ObokuErrorCode.ERROR_ADDRESS_NOT_ALLOWED)
  }

  if (error instanceof FileSizeUnstatedError) {
    return new BadGatewayException(
      toObokuErrorBody(ObokuErrorCode.ERROR_PROXIED_DOWNLOAD_SIZE_UNKNOWN),
    )
  }

  if (toAnsweredStatus(error) === 404) {
    return new NotFoundException(
      toObokuErrorBody(ObokuErrorCode.ERROR_RESOURCE_NOT_FOUND),
    )
  }

  if (isSignInRefused(error)) {
    return new BadGatewayException(
      toObokuErrorBody(
        ObokuErrorCode.ERROR_PROVIDER_CONNECTION_SIGN_IN_REFUSED,
      ),
    )
  }

  return new BadGatewayException(
    toObokuErrorBody(
      ObokuErrorCode.ERROR_PROVIDER_CONNECTION_SERVER_UNREACHABLE,
    ),
  )
}

/** Answers the failure of a request to a connector's server. */
export const throwConnectorHttpException = (error: unknown): never => {
  throw toConnectorHttpException(error)
}
