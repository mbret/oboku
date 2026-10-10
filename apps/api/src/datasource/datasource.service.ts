import type { DataSourceType, ProviderApiCredentials } from "@oboku/shared"
import { Injectable } from "@nestjs/common"
import { EventEmitter2 } from "@nestjs/event-emitter"
import { from, switchMap } from "rxjs"
import { AppConfigService } from "../config/AppConfigService.js"
import type { AuthUser } from "../auth/auth.guard.js"
import { CouchService } from "../couch/couch.service.js"
import { CoversService } from "../covers/covers.service.js"
import { NotificationsService } from "../notifications/notifications.service.js"
import { SyncReportPostgresService } from "../features/postgres/SyncReportPostgresService.js"
import { sync } from "../lib/sync/sync.js"

@Injectable()
export class DataSourceService {
  constructor(
    protected appConfig: AppConfigService,
    protected coversService: CoversService,
    protected syncReportPostgresService: SyncReportPostgresService,
    protected notificationService: NotificationsService,
    protected eventEmitter: EventEmitter2,
    protected couchService: CouchService,
  ) {}

  syncLongProgress = ({
    dataSourceId,
    providerCredentials,
    user,
  }: {
    dataSourceId: string
    providerCredentials: ProviderApiCredentials<DataSourceType>
    user: AuthUser
  }) => {
    const db$ = from(
      this.couchService.createNanoInstanceForUser({ email: user.email }),
    )

    return db$.pipe(
      switchMap((db) =>
        from(
          sync({
            user,
            dataSourceId,
            db,
            providerCredentials,
            config: this.appConfig.config,
            eventEmitter: this.eventEmitter,
            syncReportPostgresService: this.syncReportPostgresService,
            notificationService: this.notificationService,
            coversService: this.coversService,
          }),
        ),
      ),
    )
  }
}
