import { Box, Fade } from "@mui/material"
import { memo, useState } from "react"
import { Logo } from "./Logo"

export const SplashScreen = memo(({ show }: { show: boolean }) => {
  const [hidden, setHidden] = useState(false)

  if (hidden) return null

  return (
    <Fade
      in={show}
      exit
      onTransitionEnd={() => {
        setHidden(true)
      }}
      timeout={500}
    >
      <Box
        height="100%"
        display="flex"
        justifyContent="center"
        alignItems="center"
        alignContent="center"
      >
        <Logo />
      </Box>
    </Fade>
  )
})
