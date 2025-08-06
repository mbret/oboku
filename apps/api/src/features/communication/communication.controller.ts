import { Controller, Get } from "@nestjs/common"
import { CommunicationPostgresService } from "../postgres/CommunicationPostgresService"
import { Public } from "src/auth/auth.guard"

@Controller("communications")
export class CommunicationController {
  constructor(
    private readonly communicationPostgresService: CommunicationPostgresService,
  ) {}

  @Public()
  @Get("/")
  async all() {
    return await this.communicationPostgresService.repository.find({
      order: {
        created_at: "DESC",
      },
      take: 1,
    })
  }
}
