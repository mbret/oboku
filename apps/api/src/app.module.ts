import { Module, OnModuleInit } from "@nestjs/common"
import { AppController } from "./app.controller"
import { AppService } from "./app.service"
import { CoversController } from "./covers/covers.controller"
import { ConfigModule, ConfigService } from "@nestjs/config"
import * as path from "node:path"
import * as Joi from "joi"
import { BooksController } from "./features/books/books.controller"
import { EnvironmentVariables } from "./config/types"
import * as fs from "node:fs"
import { DataSourcesController } from "./features/datasources/datasources.controller"
import { EventEmitterModule } from "@nestjs/event-emitter"
import { CollectionsController } from "./features/collections/collections.controller"
import { CollectionMetadataService } from "./features/collections/CollectionMetadataService"
import { BooksMedataService } from "./features/books/BooksMedataService"
import { InMemoryTaskQueueService } from "./features/queue/InMemoryTaskQueueService"
import { TypeOrmModule } from "@nestjs/typeorm"
import { SyncReportPostgresService } from "./features/postgres/SyncReportPostgresService"
import {
  CommunicationPostgresEntity,
  SyncReportPostgresEntity,
  UserPostgresEntity,
} from "./features/postgres/entities"
import { PostgresModule } from "./features/postgres/postgres.module"
import { AppConfigModule } from "./config/config.module"
import { CommunicationController } from "./features/communication/communication.controller"
import { CommunicationPostgresService } from "./features/postgres/CommunicationPostgresService"
import { WebController } from "./features/web/web.controller"
import { UsersModule } from "./users/users.module"
import { AuthModule } from "./auth/auth.module"
import { CouchModule } from "./couch/couch.module"
import { CoversModule } from "./covers/covers.module"

@Module({
  imports: [
    TypeOrmModule.forRoot({
      type: "postgres",
      host: process.env.POSTGRES_HOST,
      port: 5432,
      username: process.env.POSTGRES_USER,
      password: process.env.POSTGRES_PASSWORD,
      database: "oboku",
      entities: [
        SyncReportPostgresEntity,
        CommunicationPostgresEntity,
        UserPostgresEntity,
      ],
      synchronize: true,
    }),
    // SentryModule.forRoot(),
    ConfigModule.forRoot({
      isGlobal: true,
      // this is mostly used during dev, for production it will be passed
      // as env variables directly to the docker container
      envFilePath: path.join(__dirname, "../../../.env"),
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
        AWS_ACCESS_KEY_ID: Joi.string().optional(),
        AWS_SECRET_ACCESS_KEY: Joi.string().optional(),
        COVERS_BUCKET_NAME: Joi.string().optional(),
        COVERS_PLACEHOLDER_BUCKET_KEY: Joi.string().required(),
        COUCH_DB_URL: Joi.string().required(),
        GOOGLE_BOOK_API_URL: Joi.string().default(
          "https://www.googleapis.com/books/v1",
        ),
        GOOGLE_CLIENT_ID: Joi.string().optional(),
        GOOGLE_API_KEY: Joi.string().optional(),
        DROPBOX_CLIENT_ID: Joi.string().optional(),
        POSTGRES_USER: Joi.string().required(),
        POSTGRES_PASSWORD: Joi.string().required(),
        POSTGRES_HOST: Joi.string().default("localhost"),
        TMP_X_ACCESS_SECRET: Joi.string().optional(),
        COMICVINE_API_KEY: Joi.string().optional(),
        JWT_PRIVATE_KEY_FILE: Joi.string().required(),
        JWT_PUBLIC_KEY_FILE: Joi.string().required(),
        API_DATA_DIR: Joi.string().optional().default("/var/lib/oboku/data"),
      }),
    }),
    EventEmitterModule.forRoot(),
    PostgresModule,
    AppConfigModule,
    AuthModule,
    UsersModule,
    CouchModule,
    CoversModule,
  ],
  providers: [
    // {
    //   provide: APP_FILTER,
    //   useClass: SentryGlobalFilter,
    // },
    AppService,
    SyncReportPostgresService,
    CommunicationPostgresService,
    CollectionMetadataService,
    InMemoryTaskQueueService,
    BooksMedataService,
  ],
  controllers: [
    AppController,
    BooksController,
    DataSourcesController,
    CollectionsController,
    CommunicationController,
    WebController,
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
