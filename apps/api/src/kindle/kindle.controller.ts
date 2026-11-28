import { Body, Controller, HttpCode, HttpStatus, Post } from "@nestjs/common"
import {
  ApiBadGatewayResponse,
  ApiNotFoundResponse,
  ApiPayloadTooLargeResponse,
  ApiServiceUnavailableResponse,
  ApiTooManyRequestsResponse,
} from "@nestjs/swagger"
import { type AuthUser, WithAuthUser } from "../auth/auth.guard.js"
import { ApiObokuErrors } from "../openapi/api-oboku-errors.decorator.js"
import { EmptyResponseDto } from "../openapi/empty-response.dto.js"
import { ObokuErrorResponseDto } from "../openapi/error-response.dto.js"
import { SendBookToKindleDto } from "./kindle.dto.js"
import { KindleService } from "./kindle.service.js"

@Controller("kindle")
export class KindleController {
  constructor(private readonly kindleService: KindleService) {}

  /**
   * Emails the file of a book to the Send to Kindle address in the user's
   * settings. The API reads the file from the book's source, so its bytes
   * count towards the monthly proxied download quotas. The answer comes once
   * the SMTP server accepted the message.
   */
  @Post("send")
  @HttpCode(HttpStatus.OK)
  @ApiObokuErrors()
  @ApiNotFoundResponse({ type: ObokuErrorResponseDto })
  @ApiPayloadTooLargeResponse({ type: ObokuErrorResponseDto })
  @ApiTooManyRequestsResponse({ type: ObokuErrorResponseDto })
  @ApiBadGatewayResponse({ type: ObokuErrorResponseDto })
  @ApiServiceUnavailableResponse({ type: ObokuErrorResponseDto })
  async send(
    @Body() { bookId, providerCredentials }: SendBookToKindleDto,
    @WithAuthUser() user: AuthUser,
  ): Promise<EmptyResponseDto> {
    await this.kindleService.sendBook({ user, bookId, providerCredentials })

    return {}
  }
}
