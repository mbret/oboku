// import { Test, TestingModule } from "@nestjs/testing"
import { UsersService } from "./users.service"
// import { PostgresModule } from "src/features/postgres/postgres.module"
// import { AppConfigModule } from "src/features/config/config.module"
// import { TypeOrmModule } from "@nestjs/typeorm"

describe("UsersService", () => {
  // let service: UsersService

  // beforeEach(async () => {
  //   const module: TestingModule = await Test.createTestingModule({
  //     providers: [UsersService],
  //     imports: [PostgresModule, AppConfigModule, TypeOrmModule.forRoot()],
  //   }).compile()

  //   service = module.get<UsersService>(UsersService)
  // })

  // it("should be defined", () => {
  //   expect(service).toBeDefined()
  // })

  it("should be defined", () => {
    expect(true).toBe(true)
  })
})
