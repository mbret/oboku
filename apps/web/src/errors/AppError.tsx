import {
  Box,
  Button,
  Link,
  StyledEngineProvider,
  ThemeProvider,
  Typography,
  styled,
} from "@mui/material"
import { memo } from "react"
import { useNetworkState } from "react-use"
import { theme } from "../theme/theme"
import { errorToMessage } from "./ErrorMessage"

const RootBox = styled(Box)(({ theme }) => ({
  minHeight: "100dvh",
  width: "100%",
  display: "flex",
  alignItems: "center",
  justifyContent: "center",
  padding: theme.spacing(2),
}))

const ContentBox = styled(Box)(({ theme }) => ({
  display: "flex",
  flexDirection: "column",
  alignItems: "center",
  gap: theme.spacing(2),
  maxWidth: 500,
  textAlign: "center",
}))

const DetailTypography = styled(Typography)(({ theme }) => ({
  color: theme.palette.text.secondary,
  wordBreak: "break-word",
}))

const SUPPORT_URL = "https://docs.oboku.me/support"

const reloadPage = () => {
  window.location.reload()
}

export const AppError = memo(function AppError({ error }: { error?: unknown }) {
  const { online } = useNetworkState()
  const isOffline = online === false
  const detailMessage =
    error === undefined || error === null ? undefined : errorToMessage(error)

  return (
    <StyledEngineProvider injectFirst>
      <ThemeProvider theme={theme}>
        <RootBox>
          <ContentBox>
            <Typography variant="h6">Oups!</Typography>
            {isOffline ? (
              <Typography>
                You appear to be offline, so oboku couldn't finish loading.
                Reconnect to the internet, then reload.
              </Typography>
            ) : (
              <>
                <Typography>
                  Something went wrong while loading oboku. Please reload the
                  page. If the problem persists,{" "}
                  <Link href={SUPPORT_URL} target="_blank" rel="noopener">
                    contact us
                  </Link>
                  .
                </Typography>
                {detailMessage ? (
                  <DetailTypography variant="body2">
                    {detailMessage}
                  </DetailTypography>
                ) : null}
              </>
            )}
            <Button variant="contained" color="primary" onClick={reloadPage}>
              Reload
            </Button>
          </ContentBox>
        </RootBox>
      </ThemeProvider>
    </StyledEngineProvider>
  )
})
