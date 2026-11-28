import { t } from "@lingui/core/macro"
import { kindleSend, ObokuErrorCode, ObokuSharedError } from "@oboku/shared"
import {
  type DefaultError,
  type UseMutationOptions,
  useMutation,
} from "@tanstack/react-query"
import { useNetworkState } from "react-use"
import { useRequestBookSourceCredentials } from "../../books/useRequestBookSourceCredentials"
import { OfflineError } from "../../errors/errors.shared"
import { useHttpClientApi } from "../../http"
import { notify } from "../../notifications/toasts"
import { ensureDatabase, useDatabase } from "../../rxdb"
import { awaitDocumentsPushed } from "../../rxdb/replication/awaitDocumentsPushed"

type SendBookToKindleVariables = { bookId: string }

const withoutGlobalErrorToast = { meta: { suppressGlobalErrorToast: true } }

/**
 * Tells the user when the send starts and when the email left, from the
 * mutation itself: its caller, the book actions drawer, unmounts on the tap.
 * The source's sign-in opens when the source needs one.
 */
export const useSendBookToKindle = (
  options?: Pick<
    UseMutationOptions<void, DefaultError, SendBookToKindleVariables>,
    "meta"
  >,
) => {
  const httpClientApi = useHttpClientApi()
  const { db } = useDatabase()
  const network = useNetworkState()
  const requestBookSourceCredentials = useRequestBookSourceCredentials(
    withoutGlobalErrorToast,
  )

  return useMutation({
    ...options,
    mutationFn: async function sendBookToKindle({
      bookId,
    }: SendBookToKindleVariables) {
      if (!network.online) throw new OfflineError()

      const sourceCredentials = await requestBookSourceCredentials(bookId)

      if (!sourceCredentials) {
        throw new ObokuSharedError(ObokuErrorCode.ERROR_NO_LINK)
      }

      const { providerCredentials } = sourceCredentials

      // The server reads the Kindle address from the settings it holds: an
      // address this device saved a moment ago must reach it first.
      const settings = await ensureDatabase(db)
        .settings.findOne("settings")
        .exec()

      await awaitDocumentsPushed(settings ? [settings] : []).catch(
        function failAsAddressNotOnServer(error: unknown) {
          throw new Error(
            t`Your Kindle address has not reached oboku's server yet. Check your connection, then send again.`,
            { cause: error },
          )
        },
      )

      notify({
        title: t`Send to Kindle`,
        description: t`Sending the book to your Kindle…`,
        severity: "info",
      })

      await kindleSend({
        client: httpClientApi.sdkClient,
        body: { bookId, providerCredentials },
      })
    },
    onSuccess: function tellBookIsOnItsWay() {
      notify({
        title: t`Send to Kindle`,
        description: t`The book is on its way. Amazon delivers it to your Kindle in a few minutes.`,
        severity: "success",
      })
    },
  })
}
