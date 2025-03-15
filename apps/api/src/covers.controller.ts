import {
  Controller,
  Get,
  Header,
  NotFoundException,
  Param,
  Query,
  StreamableFile,
} from "@nestjs/common"
import { S3Client } from "@aws-sdk/client-s3"
import * as sharp from "sharp"
import { getCover } from "./lib/covers/getCover"
import { getCoverPlaceholder } from "./lib/covers/getCoverPlaceholder"
import { ConfigService } from "@nestjs/config"
import { EnvironmentVariables } from "./types"

@Controller("covers")
export class CoversController {
  constructor(private configService: ConfigService<EnvironmentVariables>) {}

  @Get(":id")
  @Header("Cache-Control", "public, max-age=31536000, immutable")
  async findOne(
    @Param() params: { id: string },
    @Query() query: { format?: string },
  ) {
    const s3 = new S3Client({
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
    const objectKey = params.id ?? ``
    const format = query?.format || "image/webp"

    const userCover = await getCover(s3, objectKey)
    const cover = userCover ? userCover : await getCoverPlaceholder(s3)

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

    const buffer = await converted.toBuffer()

    return new StreamableFile(buffer, {
      disposition: `inline`,
      type: "image/webp",
    })
  }
}
