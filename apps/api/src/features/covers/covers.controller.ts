import {
  Controller,
  Get,
  Header,
  NotFoundException,
  OnModuleInit,
  Param,
  Query,
  StreamableFile,
} from "@nestjs/common"
import { S3Client } from "@aws-sdk/client-s3"
import * as sharp from "sharp"
import { getCover } from "../../lib/covers/getCover"
import { getCoverPlaceholder } from "../../lib/covers/getCoverPlaceholder"
import { ConfigService } from "@nestjs/config"
import { EnvironmentVariables } from "../config/types"
import { InMemoryTaskQueueService } from "../queue/InMemoryTaskQueueService"
import {
  defer,
  delay,
  finalize,
  from,
  map,
  mergeMap,
  of,
  tap,
  timer,
} from "rxjs"

@Controller("covers")
export class CoversController implements OnModuleInit {
  private s3Client: S3Client
  private QUEUE_NAME = "covers.findOne"

  constructor(
    private configService: ConfigService<EnvironmentVariables>,
    private taskQueueService: InMemoryTaskQueueService,
  ) {
    this.s3Client = new S3Client({
      region: `us-east-1`,
      credentials: {
        accessKeyId: this.configService.getOrThrow("AWS_ACCESS_KEY_ID", {
          infer: true,
        }),
        secretAccessKey: this.configService.getOrThrow(
          "AWS_SECRET_ACCESS_KEY",
          { infer: true },
        ),
      },
    })
  }

  onModuleInit() {
    this.taskQueueService.createQueue({
      name: this.QUEUE_NAME,
      maxConcurrent: 1,
      deduplicate: true,
    })
  }

  @Get(":id")
  @Header("Cache-Control", "public, max-age=31536000, immutable")
  findOne(
    @Param() params: { id: string },
    @Query() query: { format?: string },
  ) {
    const objectKey = params.id ?? ``
    const format = query?.format || "image/webp"

    const response$ = defer(() =>
      from(getCover(this.s3Client, objectKey, this.configService)).pipe(
        mergeMap((userCover) =>
          userCover ? of(userCover) : from(getCoverPlaceholder(this.s3Client)),
        ),
        mergeMap((cover) => {
          if (!cover) {
            throw new NotFoundException()
          }

          const resized = sharp(cover).resize({
            width: 600,
            height: 600,
            fit: "inside",
            withoutEnlargement: true,
          })

          const converted =
            format === "image/jpeg"
              ? resized.toFormat("jpeg").jpeg({
                  force: true,
                })
              : resized.webp()

          return from(converted.toBuffer()).pipe(
            map(
              (buffer) =>
                new StreamableFile(buffer, {
                  disposition: `inline`,
                  type: "image/webp",
                }),
            ),
          )
        }),
      ),
    )

    return this.taskQueueService.enqueue(this.QUEUE_NAME, () => response$, {
      id: params.id,
    })
  }
}
