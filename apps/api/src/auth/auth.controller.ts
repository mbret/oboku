import { Body, Controller, Post } from "@nestjs/common"
import { AuthService } from "src/auth/auth.service"
import { Public } from "src/auth/auth.guard"

@Controller("auth")
export class AuthController {
  constructor(private readonly authService: AuthService) {}

  @Public()
  @Post("signin")
  async signin(@Body() { token }: { token: string }) {
    return this.authService.signIn({ token })
  }
}
