import type { INestApplication } from "@nestjs/common"
import { ValidationPipe } from "@nestjs/common"
import { Test } from "@nestjs/testing"
import type { NextFunction, Request, Response } from "express"
import type { Observable } from "rxjs"
import sharp from "sharp"
import request from "supertest"
import type { App } from "supertest/types.js"
import type { AuthUser } from "../auth/auth.guard.js"
import { AppConfigService } from "../config/AppConfigService.js"
import { InMemoryTaskQueueService } from "../queue/in-memory-task-queue.service.js"
import { CoversFsService } from "./covers-fs.service.js"
import { CoversS3Service } from "./covers-s3.service.js"
import { CoversController } from "./covers.controller.js"
import { CoversService } from "./covers.service.js"

const READER: AuthUser = {
  name: "reader@example.com",
  sub: "reader@example.com",
  userId: 1,
  email: "reader@example.com",
  "couchdb.roles": [],
}

describe("CoversController", () => {
  let app: INestApplication<App>

  beforeEach(async () => {
    const storedCover = await sharp({
      create: {
        width: 400,
        height: 600,
        channels: 3,
        background: { r: 12, g: 34, b: 56 },
      },
    })
      .webp()
      .toBuffer()

    const module = await Test.createTestingModule({
      controllers: [CoversController],
      providers: [
        CoversService,
        {
          provide: AppConfigService,
          useValue: {
            COVERS_STORAGE_STRATEGY: "fs",
            COVERS_MAXIMUM_SIZE_FOR_DELIVERY: { width: 600, height: 600 },
            QUEUE_COVERS_DELIVERY_MAX_CONCURRENT: 1,
          },
        },
        {
          provide: CoversFsService,
          useValue: { getCover: vi.fn().mockResolvedValue(storedCover) },
        },
        { provide: CoversS3Service, useValue: {} },
        {
          provide: InMemoryTaskQueueService,
          useValue: {
            createQueue: vi.fn(),
            enqueue: (_queueName: string, runTask: () => Observable<unknown>) =>
              runTask(),
          },
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

  it.each([
    ["without a format", "", "webp"],
    ["as image/webp", "?format=image/webp", "webp"],
    ["as image/jpeg", "?format=image/jpeg", "jpeg"],
    ["in a format it cannot produce", "?format=image/png", "webp"],
  ])(
    "labels a cover requested %s with the format it sends",
    async (_case, query, format) => {
      const response = await request(app.getHttpServer())
        .get(`/covers/books/book-1${query}`)
        .expect(200)

      expect(response.headers["content-type"]).toBe(`image/${format}`)
      expect((await sharp(response.body).metadata()).format).toBe(format)
    },
  )
})
