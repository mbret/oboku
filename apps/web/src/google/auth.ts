import { from } from "rxjs"

import { switchMap } from "rxjs"

import { gsiOrThrow$ } from "./gsi"
import { configuration } from "../config/configuration"
import { CancelError } from "../errors/errors.shared"

export const signInWithGooglePrompt = () =>
  gsiOrThrow$.pipe(
    switchMap((gsi) => {
      const signInWithPopup =
        new Promise<google.accounts.id.CredentialResponse>(
          (resolve, reject) => {
            gsi.accounts.id.initialize({
              client_id: configuration.GOOGLE_CLIENT_ID ?? "",
              context: "signin",
              ux_mode: "popup",
              use_fedcm_for_prompt: false,
              callback: (response) => {
                resolve(response)
              },
            })

            gsi.accounts.id.prompt((notification) => {
              if (
                notification.isSkippedMoment() ||
                notification.isDismissedMoment()
              ) {
                reject(new CancelError())
              }
            })
          },
        )

      return from(signInWithPopup)
    }),
  )
