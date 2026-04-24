import {
  Box,
  Stack,
  type StackProps,
  Typography,
  useTheme,
} from "@mui/material"
import type { ReactNode } from "react"

type EmptyListProps = StackProps & {
  /**
   * Optional illustrative image displayed above the description. When set,
   * the content is constrained to the theme's centered-content max width.
   */
  image?: { src: string; alt: string }
  /**
   * Short description shown under the optional image. Defaults to a generic
   * "No items to display" hint when neither `description` nor `children`
   * are provided.
   */
  description?: ReactNode
}

/**
 * Centered empty-state placeholder for lists. Fills the available space and
 * optionally shows an illustrative image above a short description.
 */
export function EmptyList({
  image,
  description,
  children,
  ...props
}: EmptyListProps) {
  const theme = useTheme()
  const hasCustomContent = description !== undefined || children !== undefined
  const message = hasCustomContent ? description : "No items to display"

  return (
    <Stack
      {...props}
      sx={[
        {
          flex: 1,
          alignItems: "center",
          justifyContent: "center",
          alignSelf: "center",
          px: 2,
          textAlign: "center",
          width: image ? "80%" : undefined,
          maxWidth: image ? theme.custom.maxWidthCenteredContent : undefined,
        },
        ...(Array.isArray(props.sx) ? props.sx : [props.sx]),
      ]}
    >
      {image && (
        <Box
          component="img"
          src={image.src}
          alt={image.alt}
          sx={{ width: "100%" }}
        />
      )}
      {message !== undefined && message !== null && (
        <Typography
          sx={{
            color: "text.secondary",
            maxWidth: 300,
            pt: image ? 1 : 0,
          }}
        >
          {message}
        </Typography>
      )}
      {children}
    </Stack>
  )
}
