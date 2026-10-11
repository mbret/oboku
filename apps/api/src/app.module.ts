import { Module } from "@nestjs/common"
import { AppController } from "./app.controller.js"
import { AppService } from "./app.service.js"
import { ConfigModule } from "@nestjs/config"
import path from "node:path"
import Joi from "joi"
import { EventEmitterModule } from "@nestjs/event-emitter"
import { CollectionsController } from "./features/collections/collections.controller.js"
import { CollectionMetadataService } from "./features/collections/CollectionMetadataService.js"
import { QueueModule } from "./queue/queue.module.js"
import { TypeOrmModule } from "@nestjs/typeorm"
import { SyncReportPostgresService } from "./features/postgres/SyncReportPostgresService.js"
import { PostgresModule } from "./features/postgres/postgres.module.js"
import { AppConfigModule } from "./config/config.module.js"
import { AppConfigService } from "./config/AppConfigService.js"
import { WebController } from "./web/web.controller.js"
import { UsersModule } from "./users/users.module.js"
import { AuthModule } from "./auth/auth.module.js"
import { CouchModule } from "./couch/couch.module.js"
import { CoversModule } from "./covers/covers.module.js"
import { ScheduleModule } from "@nestjs/schedule"
import { AdminModule } from "./admin/admin.module.js"
import { DataSourceModule } from "./datasource/datasource.module.js"
import { StorageModule } from "./storage/storage.module.js"
import { WebDavModule } from "./webdav/webdav.module.js"
import { NotificationsModule } from "./notifications/notifications.module.js"
import { BooksModule } from "./books/books.module.js"
import { PluginsModule } from "./plugins/plugins.module.js"
import { KoreaderSyncServerModule } from "./koreader-sync-server/koreader-sync-server.module.js"
import { KoreaderSyncConnectionModule } from "./koreader-sync-connection/koreader-sync-connection.module.js"

@Module({
  imports: [
    TypeOrmModule.forRootAsync({
      inject: [AppConfigService],
      useFactory: function getPostgresConnectionOptions(
        config: AppConfigService,
      ) {
        return {
          type: "postgres",
          host: config.POSTGRES_HOST,
          port: 5432,
          username: config.POSTGRES_USER,
          password: config.POSTGRES_PASSWORD,
          database: config.POSTGRES_DB,
          autoLoadEntities: true,
          synchronize: true,
        }
      },
    }),
    ConfigModule.forRoot({
      isGlobal: true,
      // this is mostly used during dev, for production it will be passed
      // as env variables directly to the docker container
      envFilePath: path.join(import.meta.dirname, "../.env"),
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
        POSTGRES_USER: Joi.string().default("postgres"),
        POSTGRES_PASSWORD: Joi.string().required(),
        // use default docker service name
        POSTGRES_HOST: Joi.string().default("postgres"),
        TMP_X_ACCESS_SECRET: Joi.string().optional(),
        COMICVINE_API_KEY: Joi.string().optional(),
        JWT_PRIVATE_KEY_FILE: Joi.string().optional(),
        JWT_PRIVATE_KEY: Joi.string().optional(),
        JWT_PUBLIC_KEY_FILE: Joi.string().optional(),
        JWT_PUBLIC_KEY: Joi.string().optional(),
        API_DATA_DIR: Joi.string().required(),
        API_CONFIG_DIR: Joi.string().required(),
        COVERS_STORAGE_STRATEGY: Joi.string()
          .valid("fs", "s3")
          .optional()
          .default("fs"),
        ADMIN_LOGIN: Joi.string().optional(),
        ADMIN_PASSWORD: Joi.string().optional(),
        APP_PUBLIC_URL: Joi.string().uri().required(),
        ADMIN_PUBLIC_URL: Joi.string().optional(),
        EMAIL_SMTP_HOST: Joi.string().optional(),
        EMAIL_SMTP_PORT: Joi.number().port().optional(),
        EMAIL_SMTP_USER: Joi.string().optional(),
        EMAIL_SMTP_PASSWORD: Joi.string().optional(),
        EMAIL_FROM: Joi.string().email().optional(),
        EMAIL_FROM_NAME: Joi.string().optional(),
        EMAIL_SMTP_MAX_SEND_RATE: Joi.number().positive().optional(),
      })
        .or("JWT_PRIVATE_KEY_FILE", "JWT_PRIVATE_KEY")
        .or("JWT_PUBLIC_KEY_FILE", "JWT_PUBLIC_KEY"),
    }),
    ScheduleModule.forRoot(),
    EventEmitterModule.forRoot(),
    QueueModule,
    PostgresModule,
    AppConfigModule,
    StorageModule,
    AuthModule,
    UsersModule,
    CouchModule,
    CoversModule,
    AdminModule,
    DataSourceModule,
    NotificationsModule,
    WebDavModule,
    BooksModule,
    PluginsModule,
    KoreaderSyncServerModule,
    KoreaderSyncConnectionModule,
  ],
  providers: [AppService, SyncReportPostgresService, CollectionMetadataService],
  controllers: [AppController, CollectionsController, WebController],
})
export class AppModule {}
