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
import { defer, map, mergeMap, type Observable } from "rxjs"
import { InMemoryTaskQueueService } from "../queue/in-memory-task-queue.service"
import { CoversService } from "./covers.service"
import { type AuthUser, WithAuthUser } from "src/auth/auth.guard"
import { emailToNameHex } from "src/couch/couch.service"
import { getBookCoverKey, getCollectionCoverKey } from "@oboku/shared"

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

  /**
   * The `userNameHex` is intentionally derived from the verified JWT and never
   * accepted as a URL parameter. This makes the lookup ownership-scoped by
   * construction: the server can only ever resolve the caller's own covers,
   * and a request for someone else's `:bookId` simply maps to a non-existent
   * key in storage. The same applies to collection covers.
   */
  @Get("books/:bookId")
  @Header("Cache-Control", "private, max-age=31536000, immutable")
  findBookCover(
    @Param("bookId") bookId: string,
    @Query() query: { format?: string },
    @WithAuthUser() user: AuthUser,
  ) {
    const userNameHex = emailToNameHex(user.email)
    const objectKey = getBookCoverKey(userNameHex, bookId)

    return this.serveCover(objectKey, query.format)
  }

  @Get("collections/:collectionId")
  @Header("Cache-Control", "private, max-age=31536000, immutable")
  findCollectionCover(
    @Param("collectionId") collectionId: string,
    @Query() query: { format?: string },
    @WithAuthUser() user: AuthUser,
  ) {
    const userNameHex = emailToNameHex(user.email)
    const objectKey = getCollectionCoverKey(userNameHex, collectionId)

    return this.serveCover(objectKey, query.format)
  }

  private serveCover(
    objectKey: string,
    format?: string,
  ): Observable<StreamableFile> {
    const resolvedFormat = format || "image/webp"

    const response$ = defer(() =>
      this.coversService.getCover(objectKey).pipe(
        mergeMap((cover) => {
          if (!cover) {
            throw new NotFoundException()
          }

          const resizedCover$ = this.coversService.resizeCover(cover, {
            width: 600,
            height: 600,
            format: resolvedFormat,
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
      id: objectKey,
    })
  }
}
