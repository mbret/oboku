import { Controller, Get } from "@nestjs/common"
import { CommunicationPostgresService } from "../postgres/CommunicationPostgresService"

@Controller("communications")
export class CommunicationController {
  constructor(
    private readonly communicationPostgresService: CommunicationPostgresService,
  ) {}

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
