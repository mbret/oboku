import { Module, OnModuleInit } from "@nestjs/common"
import { AppController } from "./app.controller"
import { AppService } from "./app.service"
import { ConfigModule } from "@nestjs/config"
import * as path from "node:path"
import * as Joi from "joi"
import { BooksController } from "./features/books/books.controller"
import * as fs from "node:fs"
import { DataSourcesController } from "./features/datasources/datasources.controller"
import { EventEmitterModule } from "@nestjs/event-emitter"
import { CollectionsController } from "./features/collections/collections.controller"
import { CollectionMetadataService } from "./features/collections/CollectionMetadataService"
import { BooksMedataService } from "./features/books/BooksMedataService"
import { InMemoryTaskQueueService } from "./features/queue/InMemoryTaskQueueService"
import { TypeOrmModule } from "@nestjs/typeorm"
import { SyncReportPostgresService } from "./features/postgres/SyncReportPostgresService"
import { PostgresModule } from "./features/postgres/postgres.module"
import { AppConfigModule } from "./config/config.module"
import { CommunicationController } from "./features/communication/communication.controller"
import { CommunicationPostgresService } from "./features/postgres/CommunicationPostgresService"
import { WebController } from "./features/web/web.controller"
import { UsersModule } from "./users/users.module"
import { AuthModule } from "./auth/auth.module"
import { CouchModule } from "./couch/couch.module"
import { CoversModule } from "./covers/covers.module"
import { AppConfigService } from "./config/AppConfigService"
import { ScheduleModule } from "@nestjs/schedule"
import { AdminModule } from "./admin/admin.module"

@Module({
  imports: [
    TypeOrmModule.forRoot({
      type: "postgres",
      host: process.env.POSTGRES_HOST ?? "postgres",
      port: 5432,
      username: process.env.POSTGRES_USER ?? "postgres",
      password: process.env.POSTGRES_PASSWORD,
      database: process.env.POSTGRES_DB,
      autoLoadEntities: true,
      synchronize: true,
    }),
    // SentryModule.forRoot(),
    ConfigModule.forRoot({
      isGlobal: true,
      // this is mostly used during dev, for production it will be passed
      // as env variables directly to the docker container
      envFilePath: path.join(__dirname, "../.env"),
      cache: true,
      validationSchema: Joi.object({
        NODE_ENV: Joi.string().valid("development", "production"),
        PORT: Joi.number().port().default(3000),
        AWS_ACCESS_KEY_ID: Joi.string().optional(),
        AWS_SECRET_ACCESS_KEY: Joi.string().optional(),
        COVERS_BUCKET_NAME: Joi.string().optional().default("oboku-covers"),
        // use default docker service name
        COUCH_DB_URL: Joi.string().default("http://couchdb:5984"),
        GOOGLE_BOOK_API_URL: Joi.string().default(
          "https://www.googleapis.com/books/v1",
        ),
        GOOGLE_CLIENT_ID: Joi.string().optional(),
        GOOGLE_API_KEY: Joi.string().optional(),
        DROPBOX_CLIENT_ID: Joi.string().optional(),
        POSTGRES_DB: Joi.string().optional(),
        POSTGRES_USER: Joi.string().optional(),
        POSTGRES_PASSWORD: Joi.string().required(),
        // use default docker service name
        POSTGRES_HOST: Joi.string().default("postgres"),
        TMP_X_ACCESS_SECRET: Joi.string().optional(),
        COMICVINE_API_KEY: Joi.string().optional(),
        JWT_PRIVATE_KEY_FILE: Joi.string().required(),
        JWT_PUBLIC_KEY_FILE: Joi.string().required(),
        API_DATA_DIR: Joi.string().optional().default("/var/lib/oboku/data"),
        COVERS_STORAGE_STRATEGY: Joi.string()
          .valid("fs", "s3")
          .optional()
          .default("fs"),
        ADMIN_LOGIN: Joi.string().optional(),
        ADMIN_PASSWORD: Joi.string().optional(),
      }),
    }),
    ScheduleModule.forRoot(),
    EventEmitterModule.forRoot(),
    PostgresModule,
    AppConfigModule,
    AuthModule,
    UsersModule,
    CouchModule,
    CoversModule,
    AdminModule,
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
  constructor(private configService: AppConfigService) {}

  /**
   * Prepare all tmp folders
   */
  onModuleInit() {
    if (!fs.existsSync(this.configService.TMP_DIR)) {
      fs.mkdirSync(this.configService.TMP_DIR, { recursive: true })
    }

    // make sure to cleanup on each restart
    fs.rmSync(this.configService.TMP_DIR, { recursive: true, force: true })

    fs.mkdirSync(this.configService.TMP_DIR_BOOKS, { recursive: true })
  }
}
