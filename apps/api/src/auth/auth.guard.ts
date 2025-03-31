import {
  CanActivate,
  createParamDecorator,
  ExecutionContext,
  Injectable,
  SetMetadata,
  UnauthorizedException,
} from "@nestjs/common"
import { Reflector } from "@nestjs/core"
import { JwtService } from "@nestjs/jwt"
import { Request } from "express"
import { AppConfigService } from "../config/AppConfigService"
import { SecretsService } from "src/config/SecretsService"

export const IS_PUBLIC_KEY = "isPublic"
export const Public = () => SetMetadata(IS_PUBLIC_KEY, true)

export type TokenPayload = {
  name: string
  sub: string
  "couchdb.roles": string[]
}

export type AuthUser = TokenPayload & {
  email: string
}

export const AutUser = createParamDecorator((_, req) => {
  return req.switchToHttp().getRequest().user
})

@Injectable()
export class AuthGuard implements CanActivate {
  constructor(
    private jwtService: JwtService,
    private reflector: Reflector,
    private secretsService: SecretsService,
  ) {}

  async canActivate(context: ExecutionContext): Promise<boolean> {
    const isPublic = this.reflector.getAllAndOverride<boolean>(IS_PUBLIC_KEY, [
      context.getHandler(),
      context.getClass(),
    ])

    if (isPublic) {
      return true
    }

    const request = context.switchToHttp().getRequest()
    const token = this.extractTokenFromHeader(request)

    if (!token) {
      throw new UnauthorizedException()
    }

    try {
      const payload = await this.jwtService.verifyAsync<TokenPayload>(token, {
        // @todo use public key.
        publicKey: await this.secretsService.getJwtPublicKey(),
        algorithms: ["RS256"],
      })

      // 💡 We're assigning the payload to the request object here
      // so that we can access it in our route handlers
      request.user = {
        ...payload,
        email: payload.name,
      }
    } catch (error) {
      console.log("error", error)

      throw new UnauthorizedException()
    }

    return true
  }

  private extractTokenFromHeader(request: Request): string | undefined {
    const [type, token] = request.headers.authorization?.split(" ") ?? []
    return type === "Bearer" ? token : undefined
  }
}
