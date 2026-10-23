import {
  Button,
  Fade,
  LinearProgress,
  Stack,
  styled,
  Typography,
} from "@mui/material"
import { memo } from "react"
import { useNavigate } from "react-router"
import { useHasElapsed } from "../common/useHasElapsed"
import { useSafeGoBack } from "../navigation/useSafeGoBack"
import { ROUTES } from "../navigation/routes"
import type { KoreaderPositionCheck } from "../koreader/syncConnection/useKoreaderPositionCheck"

const SLOW_CHECK_THRESHOLD_MS = 3000

/**
 * Where opening a book stands: its file loads, then its KOReader position is
 * checked. The book may open once it is `done`.
 */
export type BookOpening = { status: "loadingFile" } | KoreaderPositionCheck

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
  check: Exclude<KoreaderPositionCheck, { status: "starting" | "done" }>
}) {
  const navigate = useNavigate()
  const isCheckSlow = useHasElapsed(SLOW_CHECK_THRESHOLD_MS)

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
  opening,
}: {
  opening: BookOpening
}) {
  const { goBack } = useSafeGoBack()
  const isCheckingKoreaderPosition =
    opening.status === "checking" ||
    opening.status === "failed" ||
    opening.status === "refused"

  return (
    <LoadingStack>
      {isCheckingKoreaderPosition ? (
        <KoreaderPositionCheckStep check={opening} />
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
