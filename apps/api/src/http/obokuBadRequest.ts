import { BadRequestException } from "@nestjs/common"
import type { ObokuErrorCode } from "@oboku/shared"
import type { ObokuErrorResponseDto } from "../openapi/error-response.dto.js"

/** The body of an answer that carries one of oboku's error codes. */
export const toObokuErrorBody = (
  code: ObokuErrorCode,
): ObokuErrorResponseDto => ({
  errors: [{ code }],
})

/** A 400 with one of oboku's error codes, in the body `ApiObokuErrors` documents. */
export const createObokuBadRequest = (code: ObokuErrorCode) =>
  new BadRequestException(toObokuErrorBody(code))
