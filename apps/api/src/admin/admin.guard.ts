import {
  CanActivate,
  ExecutionContext,
  Injectable,
  SetMetadata,
  UnauthorizedException,
} from "@nestjs/common"
import { Reflector } from "@nestjs/core"
import { JwtService } from "@nestjs/jwt"
import { SecretsService } from "src/config/SecretsService"

const IS_ADMIN_PUBLIC_KEY = "isAdminPublic"

export const AdminPublic = () => SetMetadata(IS_ADMIN_PUBLIC_KEY, true)

@Injectable()
export class AdminAuthGuard implements CanActivate {
  constructor(
    private jwtService: JwtService,
    private reflector: Reflector,
    private secretsService: SecretsService,
  ) {}

  async canActivate(context: ExecutionContext): Promise<boolean> {
    const isPublic = this.reflector.getAllAndOverride<boolean>(
      IS_ADMIN_PUBLIC_KEY,
      [context.getHandler(), context.getClass()],
    )

    if (isPublic) {
      return true
    }

    const request = context.switchToHttp().getRequest()
    const [type, token] = request.headers.authorization?.split(" ") ?? []

    if (type !== "Bearer" || !token) {
      throw new UnauthorizedException()
    }

    try {
      const payload = await this.jwtService.verifyAsync(token, {
        publicKey: await this.secretsService.getJwtPublicKey(),
        algorithms: ["RS256"],
      })

      if (payload.role !== "admin" || payload.type !== "access") {
        throw new UnauthorizedException()
      }

      request.adminUser = payload
    } catch (error) {
      if (error instanceof UnauthorizedException) {
        throw error
      }

      throw new UnauthorizedException()
    }

    return true
  }
}
