import { Stack, styled } from "@mui/material"

export const IntroStack = styled(Stack)(function styleIntroStack({ theme }) {
  return {
    gap: theme.spacing(2),
    paddingTop: theme.spacing(2),
  }
})
