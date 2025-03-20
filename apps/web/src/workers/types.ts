export type SW_OBOKU_PROFILE_UPDATE_MESSAGE_EVENT_DATA = {
  type: "OBOKU_PROFILE_UPDATE"
  profile: string | undefined
}

export type SW_OBOKU_PROFILE_UPDATE_MESSAGE_EVENT = Omit<
  ExtendableMessageEvent,
  "data"
> & {
  data: SW_OBOKU_PROFILE_UPDATE_MESSAGE_EVENT_DATA
}

export type WEB_OBOKU_PROFILE_REQUEST_MESSAGE_DATA = {
  type: "OBOKU_PROFILE_REQUEST_UPDATE"
}

export type UKNOWN_REQUEST_MESSAGE_EVENT = Event & { data?: unknown }
