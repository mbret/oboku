import { Module } from "@nestjs/common"
import { AuthService } from "./auth.service.js"
import { UsersModule } from "../users/users.module.js"
import { JwtService } from "@nestjs/jwt"
import { PostgresModule } from "../features/postgres/postgres.module.js"
import { AuthGuard } from "./auth.guard.js"
import { APP_GUARD } from "@nestjs/core"
import { AuthController } from "./auth.controller.js"
import { CouchService } from "../couch/couch.service.js"
import { EmailModule } from "../email/email.module.js"
import { AuthCookiesService } from "./auth-cookies.js"
import { RefreshProofService } from "./refresh-proof.service.js"

@Module({
  imports: [UsersModule, PostgresModule, EmailModule],
  providers: [
    AuthService,
    JwtService,
    CouchService,
    AuthCookiesService,
    RefreshProofService,
    /**
     * AuthGuard is used to protect all routes by default
     */
    {
      provide: APP_GUARD,
      useClass: AuthGuard,
    },
  ],
  controllers: [AuthController],
  exports: [AuthService],
})
export class AuthModule {}
