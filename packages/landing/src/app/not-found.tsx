import { Stack, Typography } from "@mui/material"

export default async function NotFound() {
  return (
    <Stack minHeight="60vh" alignItems="center" justifyContent="center">
      <Typography
        variant="h1"
        textAlign="center"
        display="flex"
        flexDirection="column"
      >
        <Typography variant="h2" component="span">
          404
        </Typography>
        <Typography variant="h6" fontWeight="normal" component="span">
          Page not found
        </Typography>
      </Typography>
    </Stack>
  )
}
