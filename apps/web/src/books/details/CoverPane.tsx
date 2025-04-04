import { useTheme, Box, type BoxProps } from "@mui/material"
import { Cover } from "../Cover"

export const CoverPane = ({
  bookId,
  ...rest
}: { bookId?: string } & BoxProps) => {
  const theme = useTheme()

  return (
    <Box
      style={{
        display: "flex",
        alignItems: "center",
        justifyContent: "center",
      }}
      {...rest}
    >
      <Box
        sx={{
          width: ["60%", 200],
          maxWidth: theme.custom.maxWidthCenteredContent,
        }}
      >
        {!!bookId && <Cover bookId={bookId} blurIfNeeded={false} />}
      </Box>
    </Box>
  )
}
