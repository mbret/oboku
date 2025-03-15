import { Module } from "@nestjs/common"
import { AppController } from "./app.controller"
import { AppService } from "./app.service"
import { CoversController } from "./covers.controller"
import { ConfigModule } from "@nestjs/config"
import * as path from "node:path"
import * as Joi from "joi"
import { MetadataController } from "./metadata.controller"

@Module({
  imports: [
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
        }),
      ],
      validationSchema: Joi.object({
        NODE_ENV: Joi.string().valid("development", "production"),
        PORT: Joi.number().port().default(3000),
        TMP_DIR: Joi.string().required(),
        COUCH_DB_URL: Joi.string().required(),
        CONTACT_TO_ADDRESS: Joi.string().required(),
        STAGE: Joi.string().valid("prod", "dev").required(),
        AWS_API_URI: Joi.string().required(),
        GOOGLE_BOOK_API_URL: Joi.string().required(),
        OFFLINE: Joi.boolean().required(),
      }),
    }),
  ],
  controllers: [AppController, CoversController, MetadataController],
  providers: [AppService],
})
export class AppModule {}
