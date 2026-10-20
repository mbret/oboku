import {
  Button,
  Fade,
  LinearProgress,
  Stack,
  styled,
  Typography,
} from "@mui/material"
import { memo, useEffect, useState } from "react"
import { useNavigate } from "react-router"
import { useSafeGoBack } from "../navigation/useSafeGoBack"
import { ROUTES } from "../navigation/routes"
import type { KoreaderPositionCheck } from "../koreader/syncConnection/useKoreaderPositionCheck"

const SLOW_CHECK_THRESHOLD_MS = 3000

const LoadingStack = styled(Stack)(function styleLoadingStack({ theme }) {
  return {
    position: "absolute",
    top: 0,
    left: 0,
    height: "100%",
    width: "100%",
    justifyContent: "center",
    alignItems: "center",
    gap: theme.spacing(4),
    padding: theme.spacing(2),
  }
})

const StepStack = styled(Stack)(function styleStepStack({ theme }) {
  return {
    alignItems: "center",
    textAlign: "center",
    gap: theme.spacing(2),
  }
})

const LoadingProgress = styled(LinearProgress)({
  width: 200,
})

const KoreaderPositionCheckStep = memo(function KoreaderPositionCheckStep({
  check,
}: {
  check: Exclude<KoreaderPositionCheck, { status: "done" }>
}) {
  const navigate = useNavigate()
  const [isCheckSlow, setIsCheckSlow] = useState(false)

  useEffect(function revealContinueAnywayWhenCheckIsTakingLong() {
    const timeout = setTimeout(function markCheckAsSlow() {
      setIsCheckSlow(true)
    }, SLOW_CHECK_THRESHOLD_MS)

    return function cancelContinueAnywayReveal() {
      clearTimeout(timeout)
    }
  }, [])

  switch (check.status) {
    case "checking":
      return (
        <StepStack>
          <Typography>Checking your KOReader position...</Typography>
          <LoadingProgress />
          <Fade in={isCheckSlow} unmountOnExit>
            <Button onClick={check.continueAnyway}>Continue anyway</Button>
          </Fade>
        </StepStack>
      )
    case "failed":
      return (
        <StepStack>
          <Typography>Couldn't check your KOReader position.</Typography>
          <Button variant="contained" onClick={check.tryAgain}>
            Try again
          </Button>
          <Button onClick={check.continueAnyway}>Continue anyway</Button>
        </StepStack>
      )
    case "refused":
      return (
        <StepStack>
          <Typography>
            Your KOReader sync server refused your password.
          </Typography>
          <Button
            variant="contained"
            onClick={function openKoreaderProgressSync() {
              navigate(ROUTES.KOREADER_PROGRESS_SYNC)
            }}
          >
            Sign in again
          </Button>
          <Button onClick={check.continueAnyway}>Continue anyway</Button>
        </StepStack>
      )
  }
})

export const BookLoading = memo(function BookLoading({
  isBookLoaded,
  koreaderPositionCheck,
}: {
  isBookLoaded: boolean
  koreaderPositionCheck: KoreaderPositionCheck
}) {
  const { goBack } = useSafeGoBack()
  const isCheckingKoreaderPosition =
    isBookLoaded && koreaderPositionCheck.status !== "done"

  return (
    <LoadingStack>
      {isCheckingKoreaderPosition ? (
        <KoreaderPositionCheckStep check={koreaderPositionCheck} />
      ) : (
        <StepStack>
          <Typography>Your book is loading...</Typography>
          <LoadingProgress />
        </StepStack>
      )}
      <Button
        variant="text"
        onClick={function goBackFromLoadingBook() {
          goBack()
        }}
      >
        Go back
      </Button>
    </LoadingStack>
  )
})
