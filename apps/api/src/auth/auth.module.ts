import { Module } from "@nestjs/common"
import { AuthService } from "./auth.service"
import { UsersModule } from "../users/users.module"
import { JwtService } from "@nestjs/jwt"
import { PostgresModule } from "src/features/postgres/postgres.module"
import { AuthGuard } from "./auth.guard"
import { APP_GUARD } from "@nestjs/core"
import { AuthController } from "./auth.controller"

@Module({
  imports: [UsersModule, PostgresModule],
  providers: [
    AuthService,
    JwtService,
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
