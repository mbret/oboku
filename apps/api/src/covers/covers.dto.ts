import { ApiProperty } from "@nestjs/swagger"
import { COVER_DELIVERY_FORMATS } from "./covers.service.js"

export class CoverQueryDto {
  /** Defaults to `image/webp`, which any other value also falls back to. */
  @ApiProperty({ enum: COVER_DELIVERY_FORMATS })
  format?: string
}
