import {
  isMicrosoftConsumerAccount,
  READER_ACCEPTED_EXTENSIONS,
} from "@oboku/shared"
import { useMutation } from "@tanstack/react-query"
import { memo, useCallback } from "react"
import type { ObokuPlugin } from "../types"
import { requestMicrosoftAccessToken } from "./auth/auth"
import { Picker, type OneDrivePickerSelection } from "./picker/PickerFrame"
import {
  ONE_DRIVE_CONSUMER_AUTHORITY,
  ONE_DRIVE_CONSUMER_PICKER_BASE_URL,
  PICKER_CONSUMER_SCOPES,
  ONE_DRIVE_GRAPH_SCOPES,
  ONE_DRIVE_PLUGIN_NAME,
} from "./constants"
import { useDelayEffect } from "../../common/useDelayEffect"
import { useRequestPopupDialog } from "../useRequestPopupDialog"
import { getOneDrivePickerBaseUrl } from "./graph"
import { requestPickerAccessTokenForResource } from "./picker/picker"

export const UploadBook: ObokuPlugin<"one-drive">["UploadBookComponent"] = memo(
  function UploadBook({ onClose }) {
    const requestPopup = useRequestPopupDialog(ONE_DRIVE_PLUGIN_NAME)

    const { data, mutate } = useMutation({
      mutationFn: async () => {
        const graphAuth = await requestMicrosoftAccessToken({
          requestPopup,
          scopes: ONE_DRIVE_GRAPH_SCOPES,
        })

        if (isMicrosoftConsumerAccount(graphAuth.account)) {
          const { accessToken } = await requestMicrosoftAccessToken({
            authority: ONE_DRIVE_CONSUMER_AUTHORITY,
            requestPopup,
            scopes: PICKER_CONSUMER_SCOPES,
          })

          return {
            initialPickerAccessToken: accessToken,
            pickerBaseUrl: ONE_DRIVE_CONSUMER_PICKER_BASE_URL,
          }
        }

        const pickerBaseUrl = await getOneDrivePickerBaseUrl(
          graphAuth.accessToken,
        )
        const initialPickerAccessToken =
          await requestPickerAccessTokenForResource({
            requestPopup,
            resource: pickerBaseUrl,
          })

        return {
          initialPickerAccessToken,
          pickerBaseUrl,
        }
      },
      onError: () => {
        onClose()
      },
    })

    useDelayEffect(mutate, 1)

    const handlePickerClose = useCallback(
      (selections?: ReadonlyArray<OneDrivePickerSelection>) => {
        onClose(
          selections?.map((item) => ({
            book: {
              metadata: [{ type: "link", title: item.name }],
            },
            link: {
              data: {
                driveId: item.parentReference.driveId,
                fileId: item.id,
              },
              type: "one-drive",
            },
          })),
        )
      },
      [onClose],
    )

    if (!data) return null

    return (
      <Picker
        fileFilters={READER_ACCEPTED_EXTENSIONS}
        initialPickerAccessToken={data.initialPickerAccessToken}
        onClose={handlePickerClose}
        pickerBaseUrl={data.pickerBaseUrl}
      />
    )
  },
)
