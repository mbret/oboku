import { Subject, filter, map } from "rxjs"
import type { SW_OBOKU_PROFILE_UPDATE_MESSAGE_EVENT } from "./types"

export const messageSubject = new Subject<
  | SW_OBOKU_PROFILE_UPDATE_MESSAGE_EVENT
  | (Omit<ExtendableMessageEvent, "data"> & {
      data?: {
        type?: "SKIP_WAITING"
      }
    })
>()

export const profileUpdate$ = messageSubject.pipe(
  filter(
    (message): message is SW_OBOKU_PROFILE_UPDATE_MESSAGE_EVENT =>
      message.data?.type === "OBOKU_PROFILE_UPDATE",
  ),
  map(({ data }) => data.profile),
)
