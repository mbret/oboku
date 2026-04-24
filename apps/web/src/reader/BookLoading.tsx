import { Button, LinearProgress, Stack, Typography } from "@mui/material"
import { useSafeGoBack } from "../navigation/useSafeGoBack"
import { memo } from "react"

export const BookLoading = memo(() => {
  const { goBack } = useSafeGoBack()

  return (
    <Stack
      sx={{
        position: "absolute",
        top: 0,
        left: 0,
        height: "100%",
        width: "100%",
        justifyContent: "center",
        alignItems: "center",
        gap: 4,
      }}
    >
      <Stack
        sx={{
          textAlign: "center",
        }}
      >
        <Typography gutterBottom>Your book is loading...</Typography>
        <LinearProgress style={{ width: 200 }} />
      </Stack>
      <Button onClick={() => goBack()}>Go back</Button>
    </Stack>
  )
})
