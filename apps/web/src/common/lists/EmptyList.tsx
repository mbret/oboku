import { Box, Stack, type StackProps, styled, Typography } from "@mui/material"
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

const StyledRoot = styled(Stack, {
  shouldForwardProp: (prop) => prop !== "hasImage",
})<{ hasImage: boolean }>(({ theme, hasImage }) => ({
  flex: 1,
  alignItems: "center",
  justifyContent: "center",
  alignSelf: "center",
  paddingLeft: theme.spacing(2),
  paddingRight: theme.spacing(2),
  textAlign: "center",
  ...(hasImage && {
    width: "80%",
    maxWidth: theme.custom.maxWidthCenteredContent,
  }),
}))

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
  const hasCustomContent = description !== undefined || children !== undefined
  const message = hasCustomContent ? description : "No items to display"

  return (
    <StyledRoot hasImage={!!image} {...props}>
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
    </StyledRoot>
  )
}
