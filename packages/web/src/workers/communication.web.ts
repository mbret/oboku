import { EMPTY, from, fromEvent, switchMap } from "rxjs"
import { getProfile } from "../profile/currentProfile"
import {
  SW_OBOKU_PROFILE_UPDATE_MESSAGE_EVENT,
  SW_OBOKU_PROFILE_UPDATE_MESSAGE_EVENT_DATA,
  UKNOWN_REQUEST_MESSAGE_EVENT
} from "./types"

export const registerCommunication = () => {
  from(navigator.serviceWorker.ready)
    .pipe(
      switchMap((sw) => {
        return fromEvent(navigator.serviceWorker, "message").pipe(
          switchMap(
            (
              event:
                | UKNOWN_REQUEST_MESSAGE_EVENT
                | SW_OBOKU_PROFILE_UPDATE_MESSAGE_EVENT
            ) => {
              if (
                "data" in event &&
                typeof event.data === "object" &&
                "type" in (event.data as any) &&
                (event.data as any).type === "OBOKU_PROFILE_REQUEST_UPDATE"
              ) {
                sw.active?.postMessage({
                  type: "OBOKU_PROFILE_UPDATE",
                  profile: getProfile()
                } satisfies SW_OBOKU_PROFILE_UPDATE_MESSAGE_EVENT_DATA)
              }

              return EMPTY
            }
          )
        )
      })
    )
    .subscribe()
}
