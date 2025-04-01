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
import { defer, map, mergeMap } from "rxjs"
import { InMemoryTaskQueueService } from "src/features/queue/InMemoryTaskQueueService"
import { CoversService } from "./covers.service"

@Controller("covers")
export class CoversController implements OnModuleInit {
  private QUEUE_NAME = "covers.findOne"

  constructor(
    private taskQueueService: InMemoryTaskQueueService,
    private coversService: CoversService,
  ) {}

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
      this.coversService.getCover(objectKey).pipe(
        mergeMap((cover) => {
          if (!cover) {
            throw new NotFoundException()
          }

          const resizedCover$ = this.coversService.resizeCover(cover, {
            width: 600,
            height: 600,
            format,
          })

          return resizedCover$.pipe(
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
