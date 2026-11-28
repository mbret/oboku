import { useState } from "react"
import {
  Button,
  Dialog,
  DialogActions,
  DialogContent,
  DialogContentText,
  DialogTitle,
  Stack,
  styled,
  TextField,
  Typography,
  useMediaQuery,
  useTheme,
} from "@mui/material"
import { isHttpUrl, type UriLinkData } from "@oboku/shared"
import { CancelButton } from "../../../common/forms/CancelButton"
import { CheckboxField } from "../../../common/forms/CheckboxField"

// The cast keeps DialogContentText's polymorphic `component` prop, which
// `styled` otherwise erases.
const IntroDialogContentText = styled(DialogContentText)(
  function styleIntroDialogContentText({ theme }) {
    return {
      gap: theme.spacing(1),
      display: "flex",
      flexDirection: "column",
    }
  },
) as typeof DialogContentText

const RecommendationTypography = styled(Typography)({
  fontWeight: "bold",
})

export function WebAddressDialog({
  title,
  initialLinkData,
  onConfirm,
  onCancel,
}: {
  title: string
  initialLinkData?: UriLinkData
  onConfirm: (linkData: UriLinkData) => void
  onCancel: () => void
}) {
  const [bookUrl, setBookUrl] = useState(initialLinkData?.url ?? "")
  const [allowSelfSigned, setAllowSelfSigned] = useState(
    initialLinkData?.allowSelfSigned ?? false,
  )
  const [proxyThroughServer, setProxyThroughServer] = useState(
    initialLinkData?.proxyThroughServer ?? false,
  )
  const theme = useTheme()
  const fullScreen = useMediaQuery(theme.breakpoints.down("md"))
  const isValid = isHttpUrl(bookUrl)

  return (
    <Dialog open fullScreen={fullScreen}>
      <DialogTitle>{title}</DialogTitle>
      <DialogContent>
        <IntroDialogContentText component="div">
          <Typography gutterBottom component="p">
            Your browser downloads the book from this address, so its server has
            to allow <b>cross origin requests</b> (eg: Google Drive public
            link), unless oboku's server downloads it for you. This solution is
            usually best suited when you have your own NAS or server.
          </Typography>
          <RecommendationTypography>
            We recommend you add books with a library sync, or from a source
            such as Google Drive or Dropbox
          </RecommendationTypography>
          <Typography component="p">
            Here are some examples of valid URIs:
            <Stack component="span">
              <Typography noWrap component="span">
                - https://my_nas_url.com/file/45646578
              </Typography>
              <Typography noWrap component="span">
                - https://drive.google.com/file/d/1kGGQnvm...
              </Typography>
            </Stack>
          </Typography>
        </IntroDialogContentText>
        <TextField
          autoFocus
          label="Your file url"
          type="text"
          fullWidth
          value={bookUrl}
          margin="normal"
          onChange={function updateBookUrl(event) {
            setBookUrl(event.target.value)
          }}
        />
        <CheckboxField
          checked={allowSelfSigned}
          onChange={setAllowSelfSigned}
          label="Allow self-signed certificate for API requests"
        />
        <CheckboxField
          checked={proxyThroughServer}
          onChange={setProxyThroughServer}
          label="Use oboku's server as a proxy"
          caption="For a server that refuses requests from the browser (CORS). oboku's server downloads the book, then passes it on to you. The downloads count towards your monthly download quota."
        />
      </DialogContent>
      <DialogActions>
        <CancelButton onClick={onCancel} variant="outlined" />
        <Button
          onClick={function confirmWebAddress() {
            onConfirm({
              url: bookUrl,
              ...(allowSelfSigned && { allowSelfSigned: true }),
              ...(proxyThroughServer && { proxyThroughServer: true }),
            })
          }}
          color="primary"
          disabled={!isValid}
        >
          Confirm
        </Button>
      </DialogActions>
    </Dialog>
  )
}
