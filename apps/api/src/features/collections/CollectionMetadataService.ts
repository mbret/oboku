import { Injectable, Logger } from "@nestjs/common"
import { ConfigService } from "@nestjs/config"
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
import { createSupabaseClient } from "src/lib/supabase/client"
import { lock } from "src/lib/supabase/lock"
import {
  onBeforeError,
  switchMapCombineOuter,
  switchMapMergeOuter,
} from "src/lib/utils"
import type { EnvironmentVariables } from "src/types"
import { withDeleteLock } from "src/lib/supabase/deleteLock"
import { processrefreshMetadata } from "./metadata/processRefreshMetadata"
import { parameters$ } from "./metadata/parameters"

const COLLECTION_METADATA_LOCK_MN = 5

@Injectable()
export class CollectionMetadataService {
  private readonly logger = new Logger(CollectionMetadataService.name)
  private readonly supabaseClient: ReturnType<typeof createSupabaseClient>

  constructor(private configService: ConfigService<EnvironmentVariables>) {
    this.supabaseClient = createSupabaseClient(this.configService)
  }

  async refreshMetadata({
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

    try {
      const lockId = `metadata-collection_${collectionId}`

      const { alreadyLocked } = await lock(
        lockId,
        COLLECTION_METADATA_LOCK_MN,
        this.supabaseClient,
      )

      if (!alreadyLocked) {
        of({
          collectionId,
          credentials,
          authorization,
          soft,
        })
          .pipe(
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
                onBeforeError(() =>
                  markCollectionAsError({ db, collectionId }),
                ),
              ),
            ),
            tap(() => {
              console.info(`lambda executed with success for ${collectionId}`)
            }),
            withDeleteLock(this.supabaseClient, lockId),
          )
          .subscribe()

        this.logger.log(`${collectionId}: command sent with success`)
      } else {
        this.logger.log(`${collectionId} is already locked, ignoring!`)
      }
    } catch (error) {
      this.logger.log(error)

      throw error
    }

    return {}
  }
}
