import { Module, OnModuleInit } from "@nestjs/common"
import { AppController } from "./app.controller"
import { AppService } from "./app.service"
import { CoversController } from "./features/covers.controller"
import { ConfigModule, ConfigService } from "@nestjs/config"
import * as path from "node:path"
import * as Joi from "joi"
import { BooksController } from "./features/books.controller"
import { EnvironmentVariables } from "./types"
import * as fs from "node:fs"
import { AuthController } from "./features/auth.controller"
import { SyncController } from "./features/sync.controller"
import { EventEmitterModule } from "@nestjs/event-emitter"
import { CollectionsController } from "./features/collections.controller"
import { CollectionMetadataService } from "./features/collections/CollectionMetadataService"
import { BooksMedataService } from "./features/books/BooksMedataService"
import { InMemoryTaskQueueService } from "./features/queue/InMemoryTaskQueueService"
import { SentryGlobalFilter, SentryModule } from "@sentry/nestjs/setup"
import { APP_FILTER } from "@nestjs/core"

@Module({
  imports: [
    SentryModule.forRoot(),
    ConfigModule.forRoot({
      isGlobal: true,
      // this is mostly used during dev, for production it will be passed
      // as env variables directly to the docker container
      envFilePath: path.join(__dirname, "../.env"),
      cache: true,
      load: [
        () => ({
          ...process.env,
          METADATA_EXTRACTOR_SUPPORTED_EXTENSIONS: [
            "application/x-cbz",
            "application/epub+zip",
            "application/zip",
            "application/x-zip-compressed",
            "application/x-rar",
          ],
          COVER_ALLOWED_EXT: [".jpg", ".jpeg", ".png"],
          COVER_MAXIMUM_SIZE_FOR_STORAGE: { width: 400, height: 600 },
          /**
           * Target a tmp folder in the container
           */
          TMP_DIR: "/tmp/oboku",
          TMP_DIR_BOOKS: "/tmp/oboku/books",
        }),
      ],
      validationSchema: Joi.object({
        NODE_ENV: Joi.string().valid("development", "production"),
        PORT: Joi.number().port().default(3000),
        AWS_ACCESS_KEY_ID: Joi.string().required(),
        AWS_SECRET_ACCESS_KEY: Joi.string().required(),
        COVERS_BUCKET_NAME: Joi.string().required(),
        COVERS_PLACEHOLDER_BUCKET_KEY: Joi.string().required(),
        COUCH_DB_URL: Joi.string().required(),
        CONTACT_TO_ADDRESS: Joi.string().required(),
        STAGE: Joi.string().valid("prod", "dev").default("prod"),
        AWS_API_URI: Joi.string().required(),
        FIREBASE_CONFIG: Joi.string().required(),
        GOOGLE_BOOK_API_URL: Joi.string().default(
          "https://www.googleapis.com/books/v1",
        ),
        OFFLINE: Joi.boolean().default(false),
      }),
    }),
    EventEmitterModule.forRoot(),
  ],
  controllers: [
    AppController,
    CoversController,
    BooksController,
    AuthController,
    SyncController,
    CollectionsController,
  ],
  providers: [
    {
      provide: APP_FILTER,
      useClass: SentryGlobalFilter,
    },
    AppService,
    CollectionMetadataService,
    InMemoryTaskQueueService,
    BooksMedataService,
  ],
})
export class AppModule implements OnModuleInit {
  constructor(private configService: ConfigService<EnvironmentVariables>) {}

  /**
   * Prepare all tmp folders
   */
  onModuleInit() {
    const tmpDir = this.configService.getOrThrow("TMP_DIR", {
      infer: true,
    })

    if (!fs.existsSync(tmpDir)) {
      fs.mkdirSync(tmpDir, { recursive: true })
    }

    // make sure to cleanup on each restart
    fs.rmSync(tmpDir, { recursive: true, force: true })

    const tmpDirBooks = this.configService.getOrThrow("TMP_DIR_BOOKS", {
      infer: true,
    })

    fs.mkdirSync(tmpDirBooks, { recursive: true })
  }
}
