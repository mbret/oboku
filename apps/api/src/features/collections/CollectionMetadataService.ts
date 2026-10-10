import { Injectable, Logger } from "@nestjs/common"
import { findOne } from "../../lib/couch/findOne.js"
import { from, tap } from "rxjs"
import { mergeMap, of, switchMap } from "rxjs"
import {
  markCollectionAsError,
  markCollectionAsIdle,
} from "./metadata/collections.js"
import { onBeforeError, switchMapCombineOuter } from "../../lib/utils.js"
import { processRefreshMetadata } from "./metadata/processRefreshMetadata.js"
import { CouchService, emailToNameHex } from "../../couch/couch.service.js"
import { AppConfigService } from "../../config/AppConfigService.js"
import { CoversService } from "../../covers/covers.service.js"
import { ProviderApiCredentials } from "@oboku/shared"
import { DataSourceType } from "@oboku/shared"
import { PluginsService } from "../../plugins/plugins.service.js"

@Injectable()
export class CollectionMetadataService {
  private readonly logger = new Logger(CollectionMetadataService.name)

  constructor(
    private appConfigService: AppConfigService,
    private couchService: CouchService,
    private coversService: CoversService,
    private pluginsService: PluginsService,
  ) {}

  refreshMetadata({
    collectionId,
    providerCredentials,
    soft = true,
    email,
  }: {
    collectionId: string
    providerCredentials: ProviderApiCredentials<DataSourceType>
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
      providerCredentials,
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
              processRefreshMetadata(
                collection,
                {
                  db,
                  ...params,
                  comicVineApiKey: this.appConfigService.COMICVINE_API_KEY,
                  userNameHex: emailToNameHex(email),
                },
                this.coversService,
                this.pluginsService,
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
