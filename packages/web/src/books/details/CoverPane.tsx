import { useTheme, Box, BoxProps } from "@mui/material"
import { Cover } from "../Cover"

export const CoverPane = ({ bookId, ...rest }: { bookId?: string } & BoxProps) => {
  const theme = useTheme()

  return (
    <Box
      style={{
        display: "flex",
        alignItems: "center",
        justifyContent: "center"
      }}
      {...rest}
    >
      <Box
        sx={{
          width: "80%",
          [theme.breakpoints.down("md")]: {
            width: "40%"
          },
          maxWidth: theme.custom.maxWidthCenteredContent
        }}
      >
        {!!bookId && <Cover bookId={bookId} blurIfNeeded={false} />}
      </Box>
    </Box>
  )
}
