import React from "react"
import { Box, Link, Typography } from "@material-ui/core"

export const SupportLink = () => {
  return (
    <Box mt={3} flex={1} display="flex" alignItems="flex-end">
      <Typography align="center">
        Looking for support ? Please check the{" "}
        <Link href="https://docs.oboku.me/support">support page</Link>
      </Typography>
    </Box>
  )
}
