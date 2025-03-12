import { Module } from "@nestjs/common"
import { AppController } from "./app.controller"
import { AppService } from "./app.service"
import { CoversController } from "./covers.controller"
import { ConfigModule } from "@nestjs/config"
import * as path from "node:path"

const ROOT_PATH = path.join(__dirname, "..", "..", "..")

@Module({
  imports: [
    ConfigModule.forRoot({
      envFilePath: path.join(ROOT_PATH, ".env"),
      cache: true,
    }),
  ],
  controllers: [AppController, CoversController],
  providers: [AppService],
})
export class AppModule {}
