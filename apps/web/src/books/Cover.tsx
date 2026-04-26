import type React from "react"
import { memo, useEffect, useState } from "react"
import { useMountedState } from "react-use"
import placeholder from "../assets/cover-placeholder.jpg"
import { Box, type BoxProps, styled } from "@mui/material"
import { useBook } from "./states"
import { useBlurredTagIds } from "../tags/helpers"
import { useLocalSettings } from "../settings/useLocalSettings"
import { useBookCover } from "./useBookCover"

const useBookCoverState = ({ bookId }: { bookId: string }) => {
  const blurredTags = useBlurredTagIds().data ?? []

  const { data: enrichedBook } = useBook({
    id: bookId,
  })

  if (!enrichedBook) return undefined

  const { _id, lastMetadataUpdatedAt } = enrichedBook

  return {
    _id,
    lastMetadataUpdatedAt,
    isBlurred: enrichedBook.tags.some((bookTagId) =>
      blurredTags.includes(bookTagId),
    ),
  }
}

const CoverImg = styled(`img`)<{
  withShadow?: boolean
  fullWidth?: boolean
  rounded?: boolean
}>(({ theme, withShadow, fullWidth, rounded }) => ({
  display: "block",
  position: "relative",
  height: "100%",
  maxHeight: "100%",
  maxWidth: "100%",
  justifySelf: "flex-end",
  objectFit: "cover",
  ...(withShadow && {
    boxShadow: `0px 0px 3px ${theme.palette.grey[400]}`,
  }),
  ...(fullWidth && {
    width: "100%",
  }),
  ...(rounded && {
    borderRadius: 5,
  }),
}))

export const Cover = memo(
  ({
    bookId,
    style,
    fullWidth = true,
    withShadow = false,
    rounded = true,
    blurIfNeeded = true,
    sx,
    ...rest
  }: {
    bookId: string
    style?: React.CSSProperties
    fullWidth?: boolean
    withShadow?: boolean
    rounded?: boolean
    blurIfNeeded?: boolean
  } & Pick<BoxProps, "sx">) => {
    const isMounted = useMountedState()
    const book = useBookCoverState({
      bookId,
    })
    const [hasError, setHasError] = useState(false)
    const [isLoading, setIsLoading] = useState(true)
    const localSettings = useLocalSettings()
    const shouldBlurCover =
      book?.isBlurred &&
      blurIfNeeded &&
      !localSettings.unBlurWhenProtectedVisible

    const { coverSrc, coverSrcJpg } = useBookCover({ bookId })

    useEffect(() => {
      void coverSrc

      setHasError(false)
    }, [coverSrc])

    return (
      <Box
        style={style}
        sx={[
          {
            width: "100%",
            height: "100%",
            overflow: "hidden",
          },
          ...(Array.isArray(sx) ? sx : [sx]),
        ]}
      >
        {isLoading && (
          <CoverImg
            alt="img"
            src={placeholder}
            fullWidth={fullWidth}
            rounded={rounded}
            withShadow={withShadow}
            {...(shouldBlurCover && {
              className: `blurFilter`,
            })}
            {...rest}
          />
        )}
        <picture
          style={{
            display: "block",
            height: "100%",
            width: "100%",
            ...(isLoading && {
              display: "none",
            }),
          }}
        >
          <source
            srcSet={hasError ? placeholder : coverSrc}
            type="image/webp"
          />
          <source
            srcSet={hasError ? placeholder : coverSrcJpg}
            type="image/jpeg"
          />
          <CoverImg
            alt="img"
            src={hasError ? placeholder : coverSrc}
            fullWidth={fullWidth}
            rounded={rounded}
            withShadow={withShadow}
            {...(shouldBlurCover && {
              className: `blurFilter`,
            })}
            onLoad={() => {
              setIsLoading(false)
            }}
            onError={() => {
              isMounted() && setHasError(true)
            }}
            {...rest}
          />
        </picture>
      </Box>
    )
  },
)
