import { t } from "@lingui/core/macro"
import { kindleSend, ObokuErrorCode, ObokuSharedError } from "@oboku/shared"
import {
  type DefaultError,
  type UseMutationOptions,
  useMutation,
} from "@tanstack/react-query"
import { useNetworkState } from "react-use"
import { OfflineError } from "../../errors/errors.shared"
import { useHttpClientApi } from "../../http"
import { notify } from "../../notifications/toasts"
import { ensureDatabase, useDatabase } from "../../rxdb"
import { usePluginRefreshMetadata } from "../plugins/usePluginRefreshMetadata"

type SendBookToKindleVariables = { bookId: string }

const withoutGlobalErrorToast = { meta: { suppressGlobalErrorToast: true } }

/**
 * Asks oboku's server to email a book to the user's Kindle, with the
 * credentials of the book's source, which the server reads the file with.
 * The source's sign-in opens when it needs one.
 *
 * It tells the user when the send starts and when the email left. Both show
 * after the caller unmounts, as the book actions drawer does on a tap.
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
  const requestSourceCredentials = usePluginRefreshMetadata(
    withoutGlobalErrorToast,
  )

  return useMutation({
    ...options,
    mutationFn: async function sendBookToKindle({
      bookId,
    }: SendBookToKindleVariables) {
      if (!network.online) throw new OfflineError()

      const database = ensureDatabase(db)
      const book = await database.book
        .findOne({ selector: { _id: bookId } })
        .exec()
      const firstLinkId = book?.links[0]
      const firstLink = firstLinkId
        ? await database.link.findOne(firstLinkId).exec()
        : null

      if (!firstLink) throw new ObokuSharedError(ObokuErrorCode.ERROR_NO_LINK)

      const { providerCredentials } = await requestSourceCredentials({
        linkId: firstLink._id,
        linkType: firstLink.type,
        linkData: firstLink.data,
      })

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
