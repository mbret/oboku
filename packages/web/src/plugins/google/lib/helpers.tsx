import React, { useState } from "react"
import { AccessToken } from "./types"

export type ContextValue = {
  gsi: typeof google | undefined
  lazyGsi: Promise<typeof google>
  lazyGapi: Promise<typeof gapi>
  accessToken?: { token: AccessToken; createdAt: Date }
  setAccessToken: ReturnType<
    typeof useState<{ token: AccessToken; createdAt: Date } | undefined>
  >[1]
}

export const GoogleAPIContext = React.createContext<ContextValue>({
  gsi: undefined,
  lazyGsi: new Promise(() => {}),
  lazyGapi: new Promise(() => {}),
  setAccessToken: () => {}
})

export const extractIdFromResourceId = (resourceId: string) =>
  resourceId.replace(`drive-`, ``)
