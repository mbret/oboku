import { Module } from "@nestjs/common"
import { EmailService } from "./EmailService.js"

@Module({
  providers: [EmailService],
  exports: [EmailService],
})
export class EmailModule {}
