import { SendRounded } from "@mui/icons-material"
import { useLingui } from "@lingui/react/macro"
import { ListItemLink } from "../../common/lists"
import { ROUTES } from "../../navigation/routes"
import { useSettings } from "../../settings/useSettings"

export function SendToKindleListItem() {
  const { t } = useLingui()
  const { data: settings } = useSettings()
  const kindleEmail = settings?.kindleEmail

  return (
    <ListItemLink
      to={ROUTES.SEND_TO_KINDLE}
      icon={<SendRounded />}
      primary={t`Send to Kindle`}
      secondary={
        kindleEmail
          ? t`Sending to ${kindleEmail}`
          : t`Email a book of your library to your Kindle`
      }
    />
  )
}
