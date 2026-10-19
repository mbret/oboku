import { ApiProperty } from "@nestjs/swagger"
import { ObokuErrorCode } from "@oboku/shared"

export class HttpErrorResponseDto {
  statusCode!: number

  /** Every failed constraint when the request does not validate. */
  @ApiProperty({
    oneOf: [{ type: "string" }, { type: "array", items: { type: "string" } }],
  })
  message!: string | string[]

  /** The status's name, such as `Bad Request`. */
  error?: string
}

export class ObokuErrorDto {
  @ApiProperty({ enum: ObokuErrorCode })
  code!: ObokuErrorCode
}

export class ObokuErrorResponseDto {
  errors!: ObokuErrorDto[]
}
