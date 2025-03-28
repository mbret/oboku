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
import { AppConfigService } from "../config/AppConfigService"

@Injectable()
export class CollectionMetadataService {
  private readonly logger = new Logger(CollectionMetadataService.name)

  constructor(
    private appConfigService: AppConfigService,
    private couchService: CouchService,
  ) {}

  refreshMetadata({
    collectionId,
    credentials,
    authorization,
    soft = true,
    email,
  }: {
    collectionId: string
    credentials: Record<string, string>
    authorization: string
    soft?: boolean
    email: string
  }) {
    this.logger.log(`invoke for ${collectionId}`)

    return of({
      collectionId,
      credentials,
      authorization,
      soft,
    }).pipe(
      switchMapCombineOuter(() =>
        from(
          this.couchService.createNanoInstanceForUser({
            email,
          }),
        ),
      ),
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
                this.appConfigService,
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
