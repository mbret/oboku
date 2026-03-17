import { Module } from "@nestjs/common"
import { EmailService } from "./EmailService"

@Module({
  providers: [EmailService],
  exports: [EmailService],
})
export class EmailModule {}
