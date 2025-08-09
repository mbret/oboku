import { Injectable, Logger } from "@nestjs/common"
import { findOne } from "src/lib/couch/findOne"
import { from, tap } from "rxjs"
import { mergeMap, of, switchMap } from "rxjs"
import {
  markCollectionAsError,
  markCollectionAsIdle,
} from "./metadata/collections"
import { onBeforeError, switchMapCombineOuter } from "src/lib/utils"
import { processrefreshMetadata } from "./metadata/processRefreshMetadata"
import { CouchService } from "src/couch/couch.service"
import { AppConfigService } from "../../config/AppConfigService"
import { CoversService } from "src/covers/covers.service"

@Injectable()
export class CollectionMetadataService {
  private readonly logger = new Logger(CollectionMetadataService.name)

  constructor(
    private appConfigService: AppConfigService,
    private couchService: CouchService,
    private coversService: CoversService,
  ) {}

  refreshMetadata({
    collectionId,
    data,
    soft = true,
    email,
  }: {
    collectionId: string
    data?: Record<string, unknown>
    soft?: boolean
    email: string
  }) {
    this.logger.log(`invoke for ${collectionId}`)

    const db$ = from(
      this.couchService.createNanoInstanceForUser({
        email,
      }),
    )

    return of({
      collectionId,
      data,
      soft,
    }).pipe(
      switchMapCombineOuter(() => db$),
      switchMap(([params, db]) =>
        from(
          findOne(
            "obokucollection",
            {
              selector: { _id: collectionId },
            },
            { throwOnNotFound: true, db },
          ),
        ).pipe(
          mergeMap((collection) => {
            return from(
              processrefreshMetadata(
                collection,
                {
                  db,
                  ...params,
                  comicVineApiKey: this.appConfigService.COMICVINE_API_KEY,
                },
                this.coversService,
              ),
            )
          }),
          mergeMap(() => markCollectionAsIdle({ db, collectionId })),
          onBeforeError(() => markCollectionAsError({ db, collectionId })),
        ),
      ),
      tap(() => {
        console.info(`lambda executed with success for ${collectionId}`)
      }),
    )
  }
}
