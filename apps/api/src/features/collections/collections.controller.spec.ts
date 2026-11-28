import { type INestApplication, ValidationPipe } from "@nestjs/common"
import { Test } from "@nestjs/testing"
import type { NextFunction, Request, Response } from "express"
import request from "supertest"
import type { App } from "supertest/types.js"
import type { AuthUser } from "../../auth/auth.guard.js"
import { AppConfigService } from "../../config/AppConfigService.js"
import { InMemoryTaskQueueService } from "../../queue/in-memory-task-queue.service.js"
import { CollectionMetadataService } from "./CollectionMetadataService.js"
import { CollectionsController } from "./collections.controller.js"

const READER: AuthUser = {
  name: "reader@example.com",
  sub: "reader@example.com",
  userId: 1,
  email: "reader@example.com",
  "couchdb.roles": [],
}

describe("CollectionsController", () => {
  let app: INestApplication<App>
  const taskQueueService = { createQueue: vi.fn(), enqueue: vi.fn() }

  beforeEach(async () => {
    taskQueueService.enqueue.mockClear()

    const module = await Test.createTestingModule({
      controllers: [CollectionsController],
      providers: [
        { provide: CollectionMetadataService, useValue: {} },
        { provide: InMemoryTaskQueueService, useValue: taskQueueService },
        {
          provide: AppConfigService,
          useValue: { QUEUE_COLLECTIONS_METADATA_REFRESH_MAX_CONCURRENT: 1 },
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

  it("queues the metadata refresh of a valid request behind the collection's other refreshes", async () => {
    await request(app.getHttpServer())
      .post("/collections/metadata/refresh")
      .send({ collectionId: "collection-1", providerCredentials: {} })
      .expect(201, {})

    expect(taskQueueService.enqueue).toHaveBeenCalledWith(
      "collections.metadata.refresh",
      expect.any(Function),
      { id: "collection-1", sequentialKey: "collection-1" },
    )
  })

  it.each([
    ["without a collection id", { providerCredentials: {} }],
    ["without provider credentials", { collectionId: "collection-1" }],
  ])("rejects a request %s", async (_case, body) => {
    await request(app.getHttpServer())
      .post("/collections/metadata/refresh")
      .send(body)
      .expect(400)

    expect(taskQueueService.enqueue).not.toHaveBeenCalled()
  })
})
