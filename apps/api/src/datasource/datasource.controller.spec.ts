import { type INestApplication, ValidationPipe } from "@nestjs/common"
import { Test } from "@nestjs/testing"
import type { NextFunction, Request, Response } from "express"
import request from "supertest"
import type { App } from "supertest/types.js"
import type { AuthUser } from "../auth/auth.guard.js"
import { AppConfigService } from "../config/AppConfigService.js"
import { SyncReportPostgresService } from "../features/postgres/SyncReportPostgresService.js"
import { InMemoryTaskQueueService } from "../queue/in-memory-task-queue.service.js"
import { DataSourcesController } from "./datasource.controller.js"
import { DataSourceService } from "./datasource.service.js"

const READER: AuthUser = {
  name: "reader@example.com",
  sub: "reader@example.com",
  userId: 1,
  email: "reader@example.com",
  "couchdb.roles": [],
}

describe("DataSourcesController", () => {
  let app: INestApplication<App>
  const taskQueueService = { createQueue: vi.fn(), enqueue: vi.fn() }
  const syncReportPostgresService = { getAllSyncReportsByUser: vi.fn() }

  beforeEach(async () => {
    taskQueueService.enqueue.mockClear()

    const module = await Test.createTestingModule({
      controllers: [DataSourcesController],
      providers: [
        { provide: InMemoryTaskQueueService, useValue: taskQueueService },
        {
          provide: SyncReportPostgresService,
          useValue: syncReportPostgresService,
        },
        { provide: DataSourceService, useValue: {} },
        {
          provide: AppConfigService,
          useValue: { QUEUE_DATASOURCES_SYNC_MAX_CONCURRENT: 1 },
        },
      ],
    }).compile()

    app = module.createNestApplication()
    app.use(function signInReader(
      incoming: Request,
      _response: Response,
      next: NextFunction,
    ) {
      Object.assign(incoming, { user: READER })
      next()
    })
    app.useGlobalPipes(new ValidationPipe())
    await app.init()
  })

  afterEach(async () => {
    await app.close()
  })

  it("queues the sync of a valid request", async () => {
    await request(app.getHttpServer())
      .post("/datasources/sync")
      .send({ dataSourceId: "data-source-1", providerCredentials: {} })
      .expect(201, {})

    expect(taskQueueService.enqueue).toHaveBeenCalledWith(
      "datasources.sync",
      expect.any(Function),
      { id: "data-source-1" },
    )
  })

  it.each([
    ["without a data source id", { providerCredentials: {} }],
    ["without provider credentials", { dataSourceId: "data-source-1" }],
  ])("rejects a sync request %s", async (_case, body) => {
    await request(app.getHttpServer())
      .post("/datasources/sync")
      .send(body)
      .expect(400)

    expect(taskQueueService.enqueue).not.toHaveBeenCalled()
  })

  it("lists the reader's sync reports with ISO dates", async () => {
    syncReportPostgresService.getAllSyncReportsByUser.mockResolvedValue([
      {
        id: 1,
        created_at: new Date("2026-10-18T10:00:00.000Z"),
        ended_at: new Date("2026-10-18T10:01:00.000Z"),
        state: "success",
        report: [{ rx_model: "book", id: "book-1", added: true }],
        datasource_id: "data-source-1",
        user_name: READER.email,
        has_different_provider_credentials: null,
      },
    ])

    await request(app.getHttpServer())
      .get("/datasources/sync-reports")
      .expect(200, [
        {
          id: 1,
          created_at: "2026-10-18T10:00:00.000Z",
          ended_at: "2026-10-18T10:01:00.000Z",
          state: "success",
          report: [{ rx_model: "book", id: "book-1", added: true }],
          datasource_id: "data-source-1",
          user_name: READER.email,
          has_different_provider_credentials: null,
        },
      ])

    expect(
      syncReportPostgresService.getAllSyncReportsByUser,
    ).toHaveBeenCalledWith({ userName: READER.email })
  })
})
