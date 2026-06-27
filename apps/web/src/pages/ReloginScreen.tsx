import { Alert, Container, Typography, styled } from "@mui/material"
import { useForm } from "react-hook-form"
import { Navigate, useLocation } from "react-router"
import { useSignalValue } from "reactjrx"
import { useSignIn } from "../auth/useSignIn"
import { SignInForm, type SignInFormInputs } from "../auth/SignInForm"
import { GoogleSignInButton } from "../common/GoogleSignInButton"
import { authStateSignal } from "../auth/states.web"
import { Page } from "../common/Page"
import { OrDivider } from "../common/OrDivider"
import { TopBarNavigation } from "../navigation/TopBarNavigation"
import { ErrorAlert } from "../errors/ErrorMessage"
import { isCancelError } from "../errors/errors.shared"
import { ROUTES } from "../navigation/routes"
import { isFromLocationState } from "../navigation/locationState"

const ContentContainer = styled(Container)(({ theme }) => ({
  flex: 1,
  display: "flex",
  flexDirection: "column",
  justifyContent: "center",
  gap: theme.spacing(2),
  paddingTop: theme.spacing(4),
}))

const SignedInAsText = styled(Typography)(({ theme }) => ({
  color: theme.palette.text.secondary,
}))

export const ReLoginScreen = () => {
  const auth = useSignalValue(authStateSignal)
  const location = useLocation()
  const { mutate, isPending, error, data } = useSignIn()
  const { control, handleSubmit } = useForm<SignInFormInputs>({
    defaultValues: {
      email: auth?.email ?? "",
      password: "",
    },
  })

  const needsReLogin = !!auth?.needsRelogin
  const from = isFromLocationState(location.state)
    ? location.state.from
    : ROUTES.HOME

  if (!needsReLogin) {
    return <Navigate to={data?.switchedAccount ? ROUTES.HOME : from} replace />
  }

  const displayedError = error && !isCancelError(error) ? error : null

  return (
    <Page>
      <TopBarNavigation title="Sign in again" goBackDefaultTo={ROUTES.HOME} />
      <ContentContainer maxWidth="xs">
        <Alert severity="warning">
          Your session has expired. Sign in again to continue.
        </Alert>
        {auth?.email ? (
          <SignedInAsText>Signed in as {auth.email}</SignedInAsText>
        ) : null}
        {displayedError ? <ErrorAlert error={displayedError} /> : null}
        <SignInForm
          control={control}
          onSubmit={handleSubmit((data) => {
            mutate(data)
          })}
        />
        <OrDivider title="or" />
        <GoogleSignInButton
          onClick={() => mutate(undefined)}
          disabled={isPending}
        />
      </ContentContainer>
    </Page>
  )
}
