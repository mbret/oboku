import { type Observable, tap } from "rxjs"
import { configure } from "../plugins/google"

export const withConfiguredGoogle = <
  T extends { client_id: string; client_secret: string },
>(
  stream: Observable<T>,
) =>
  stream.pipe(
    tap(({ client_id, client_secret }) =>
      configure({
        client_id,
        client_secret,
      }),
    ),
  )
