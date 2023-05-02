import { useTheme, Button, Box, Link, Typography } from "@mui/material"
import { Alert } from "@mui/material"
import { Header } from "./Header"
import { CenteredBox } from "../common/CenteredBox"
import { useTranslation } from "react-i18next"
import { Google } from "@mui/icons-material"
import { useSignIn } from "./useSignIn"
import { ErrorMessage, isCancelError } from "../errors"
import { OrDivider } from "../common/OrDivider"
import { links } from "@oboku/shared"
import { useMutation } from "reactjrx"

export const LoginScreen = () => {
  const { signIn } = useSignIn()
  const { mutate, isLoading, error } = useMutation(signIn, "switch")
  const theme = useTheme()
  const { t } = useTranslation()

  return (
    <CenteredBox
      style={{
        flexShrink: 0,
        paddingTop: theme.spacing(4),
        paddingBottom: theme.spacing(4),
        overflow: "scroll",
        display: "flex",
        flexDirection: "column"
      }}
    >
      <Header />
      {error && !isCancelError(error) ? (
        <Box mb={2}>
          <Alert severity="warning">
            <ErrorMessage error={error} />
          </Alert>
        </Box>
      ) : null}
      <Button
        onClick={() => mutate()}
        size="large"
        fullWidth
        startIcon={<Google />}
        disabled={isLoading}
      >
        {t("authScreen.sign.google")}
      </Button>
      <Box mt={2}>
        <Alert severity="info" variant="outlined">
          Want more choices? Please let us know on{" "}
          <Link href={links.discord} underline="hover">
            discord
          </Link>
        </Alert>
      </Box>
      <OrDivider title="MORE" />
      <Typography textAlign="center">
        Visit{" "}
        <Link href={links.site} underline="hover">
          oboku
        </Link>{" "}
        for more information or help
      </Typography>
    </CenteredBox>
  )
}
