import { configure as configureGoogleDataSource } from "@libs/plugins/google"
import { Observable, tap } from "rxjs"

export const withConfiguredGoogle = <
  T extends { client_id: string; client_secret: string },
>(
  stream: Observable<T>,
) =>
  stream.pipe(
    tap(({ client_id, client_secret }) =>
      configureGoogleDataSource({
        client_id,
        client_secret,
      }),
    ),
  )
