import { Alert, Container, Typography, styled } from "@mui/material"
import { useForm } from "react-hook-form"
import { Navigate, useLocation, useNavigate } from "react-router"
import { useSignIn } from "../auth/useSignIn"
import { SignInForm, type SignInFormInputs } from "../auth/SignInForm"
import { GoogleSignInButton } from "../common/GoogleSignInButton"
import { useAuthSession } from "../auth/authSession"
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
  const { data: auth } = useAuthSession()
  const location = useLocation()
  const navigate = useNavigate()
  const { mutate, isPending, isIdle, error } = useSignIn({
    onSuccess: ({ switchedAccount }) => {
      if (!switchedAccount && isFromLocationState(location.state)) {
        navigate(-1)
      } else {
        navigate(ROUTES.HOME, { replace: true })
      }
    },
  })
  const { control, handleSubmit } = useForm<SignInFormInputs>({
    defaultValues: {
      email: auth?.email ?? "",
      password: "",
    },
  })

  if (!auth?.needsRelogin) {
    return isIdle ? <Navigate to={ROUTES.HOME} replace /> : null
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
