import { BadGatewayException, NotFoundException } from "@nestjs/common"
import { ObokuErrorCode } from "@oboku/shared"
import {
  createObokuBadRequest,
  toObokuErrorBody,
} from "../../http/obokuBadRequest.js"
import { isNonPublicAddressError } from "../../http/publicAddress.js"
import {
  WebdavConnectorNotConfiguredError,
  WebdavConnectorNotFoundError,
  isSignInRefused,
  toAnsweredStatus,
} from "./index.js"
import { FileSizeUnstatedError } from "./streamWebdavFile.js"

const toWebdavHttpException = (error: unknown) => {
  if (error instanceof WebdavConnectorNotConfiguredError) {
    return createObokuBadRequest(ObokuErrorCode.ERROR_CONNECTOR_NOT_CONFIGURED)
  }

  if (error instanceof WebdavConnectorNotFoundError) {
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

export const throwWebdavHttpException = (error: unknown): never => {
  throw toWebdavHttpException(error)
}
