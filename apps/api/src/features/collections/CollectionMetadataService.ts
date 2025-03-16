import { Injectable, Logger } from "@nestjs/common"
import { findOne } from "src/lib/couch/findOne"
import { from, tap } from "rxjs"
import { mergeMap, of, switchMap } from "rxjs"
import {
  markCollectionAsError,
  markCollectionAsIdle,
} from "./metadata/collections"
import { getAuthToken } from "src/lib/auth"
import { getNanoDbForUser } from "src/lib/couch/dbHelpers"
import { withConfiguredGoogle } from "src/lib/google/withConfiguredGoogle"
import {
  onBeforeError,
  switchMapCombineOuter,
  switchMapMergeOuter,
} from "src/lib/utils"
import { processrefreshMetadata } from "./metadata/processRefreshMetadata"
import { parameters$ } from "./metadata/parameters"
import { ConfigService } from "@nestjs/config"
import { EnvironmentVariables } from "src/types"

@Injectable()
export class CollectionMetadataService {
  private readonly logger = new Logger(CollectionMetadataService.name)

  constructor(private configService: ConfigService<EnvironmentVariables>) {}

  refreshMetadata({
    collectionId,
    credentials,
    authorization,
    soft = true,
  }: {
    collectionId: string
    credentials: Record<string, string>
    authorization: string
    soft?: boolean
  }) {
    this.logger.log(`invoke for ${collectionId}`)

    return of({
      collectionId,
      credentials,
      authorization,
      soft,
    }).pipe(
      switchMapMergeOuter(() => parameters$),
      withConfiguredGoogle,
      switchMapMergeOuter((params) =>
        getAuthToken(params.authorization, params.jwtPrivateKey),
      ),
      switchMapCombineOuter(({ name: userName, jwtPrivateKey }) =>
        from(
          getNanoDbForUser(
            userName,
            jwtPrivateKey,
            this.configService.getOrThrow("COUCH_DB_URL", {
              infer: true,
            }),
          ),
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
                },
                this.configService,
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
