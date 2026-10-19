import { applyDecorators } from "@nestjs/common"
import {
  ApiBadRequestResponse,
  ApiExtraModels,
  getSchemaPath,
} from "@nestjs/swagger"
import {
  HttpErrorResponseDto,
  ObokuErrorResponseDto,
} from "./error-response.dto.js"

/**
 * Documents a route whose 400 can carry one of oboku's error codes. Its
 * request validation also answers 400, with NestJS's body.
 */
// Not `Api…Response`: the swagger plugin reads a decorator named so as the
// route's success response, and stops documenting the one it infers.
export const ApiObokuErrors = () =>
  applyDecorators(
    ApiExtraModels(ObokuErrorResponseDto, HttpErrorResponseDto),
    ApiBadRequestResponse({
      schema: {
        oneOf: [
          { $ref: getSchemaPath(ObokuErrorResponseDto) },
          { $ref: getSchemaPath(HttpErrorResponseDto) },
        ],
      },
    }),
  )
