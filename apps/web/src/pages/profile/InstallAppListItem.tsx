import { useLingui } from "@lingui/react/macro"
import { GetAppRounded } from "@mui/icons-material"
import { ListItemButton, ListItemIcon, ListItemText } from "@mui/material"
import { useMutation } from "@tanstack/react-query"
import { useObserve } from "reactjrx"
import { installPrompt$ } from "../../common/browser"

const promptInstall = (installPrompt: BeforeInstallPromptEvent) =>
  installPrompt.prompt()

export const InstallAppListItem = () => {
  const { t } = useLingui()
  const { data: installPrompt } = useObserve(installPrompt$)
  const { mutate: openInstallDialog, isPending: isInstallDialogOpen } =
    useMutation({ mutationFn: promptInstall })

  if (!installPrompt) return null

  return (
    <ListItemButton
      disabled={isInstallDialogOpen}
      onClick={function openOfferedInstallDialog() {
        openInstallDialog(installPrompt)
      }}
    >
      <ListItemIcon>
        <GetAppRounded />
      </ListItemIcon>
      <ListItemText
        primary={t`Install the app`}
        secondary={t`Add oboku to your home screen or desktop`}
      />
    </ListItemButton>
  )
}
