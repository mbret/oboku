import type { DataSourceType, ProviderApiCredentials } from "@oboku/shared"
import { Injectable } from "@nestjs/common"
import { EventEmitter2 } from "@nestjs/event-emitter"
import { from, switchMap } from "rxjs"
import { AppConfigService } from "src/config/AppConfigService"
import type { AuthUser } from "src/auth/auth.guard"
import { CouchService } from "src/couch/couch.service"
import { CoversService } from "src/covers/covers.service"
import { NotificationsService } from "src/notifications/notifications.service"
import { SyncReportPostgresService } from "src/features/postgres/SyncReportPostgresService"
import { sync } from "src/lib/sync/sync"

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
