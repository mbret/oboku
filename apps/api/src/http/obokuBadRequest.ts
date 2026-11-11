import { BadRequestException } from "@nestjs/common"
import type { ObokuErrorCode } from "@oboku/shared"
import type { ObokuErrorResponseDto } from "../openapi/error-response.dto.js"

/** A 400 with one of oboku's error codes, in the body `ApiObokuErrors` documents. */
export const createObokuBadRequest = (code: ObokuErrorCode) => {
  const body: ObokuErrorResponseDto = { errors: [{ code }] }

  return new BadRequestException(body)
}
