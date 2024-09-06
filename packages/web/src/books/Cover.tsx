import React, { FC, memo, useEffect, useState } from "react"
import { useMountedState } from "react-use"
import placeholder from "../assets/cover-placeholder.png"
import { Box, styled } from "@mui/material"
import { useBook } from "./states"
import { useBlurredTagIds } from "../tags/helpers"
import { API_URL } from "../constants"
import { useLocalSettings } from "../settings/states"
import { useSignalValue } from "reactjrx"
import { authStateSignal } from "../auth/authState"

const useBookCoverState = ({ bookId }: { bookId: string }) => {
  const blurredTags = useBlurredTagIds().data ?? []

  const { data: enrichedBook } = useBook({
    id: bookId
  })

  if (!enrichedBook) return undefined

  const { _id, lastMetadataUpdatedAt } = enrichedBook

  return {
    _id,
    lastMetadataUpdatedAt,
    isBlurred: enrichedBook.tags.some((bookTagId) =>
      blurredTags.includes(bookTagId)
    )
  }
}

const CoverImg = styled(`img`)<{
  withShadow?: boolean
  fullWidth?: boolean
  rounded?: boolean
}>(({ theme, withShadow, fullWidth, rounded }) => ({
  position: "relative",
  height: "100%",
  justifySelf: "flex-end",
  objectFit: "cover",
  ...(withShadow && {
    boxShadow: `0px 0px 3px ${theme.palette.grey[400]}`
  }),
  ...(fullWidth && {
    width: "100%"
  }),
  ...(rounded && {
    borderRadius: 5
  })
}))

type Props = {
  bookId: string
  style?: React.CSSProperties
  fullWidth?: boolean
  withShadow?: boolean
  rounded?: boolean
  blurIfNeeded?: boolean
}

export const Cover: FC<Props> = memo(
  ({
    bookId,
    style,
    fullWidth = true,
    withShadow = false,
    rounded = true,
    blurIfNeeded = true,
    ...rest
  }) => {
    const auth = useSignalValue(authStateSignal)
    const isMounted = useMountedState()
    const book = useBookCoverState({
      bookId
    })
    const [hasError, setHasError] = useState(false)
    const [isLoading, setIsLoading] = useState(true)
    const assetHash = book?.lastMetadataUpdatedAt?.toString()
    const localSettings = useLocalSettings()
    const shouldBlurCover =
      book?.isBlurred &&
      blurIfNeeded &&
      !localSettings.unBlurWhenProtectedVisible

    const urlParams = new URLSearchParams({
      ...(assetHash && {
        hash: assetHash
      })
    })

    const originalSrc = book
      ? `${API_URL}/covers/${auth?.nameHex}-${book._id}?${urlParams.toString()}`
      : undefined

    urlParams.append("format", "image/jpeg")

    const originalJpgSrc = book
      ? `${API_URL}/covers/${auth?.nameHex}-${book._id}?${urlParams.toString()}`
      : undefined

    const coverSrc = originalSrc && !hasError ? originalSrc : placeholder
    const coverSrcJpg =
      originalJpgSrc && !hasError ? originalJpgSrc : placeholder

    useEffect(() => {
      setHasError(false)
    }, [originalSrc])

    return (
      <Box
        sx={{
          width: "100%",
          height: "100%"
        }}
        style={style}
      >
        {isLoading && (
          <CoverImg
            alt="img"
            src={placeholder}
            fullWidth={fullWidth}
            rounded={rounded}
            withShadow={withShadow}
            {...(shouldBlurCover && {
              className: `blurFilter`
            })}
            {...rest}
          />
        )}
        <picture
          style={{
            width: "100%",
            ...(isLoading && {
              display: "none"
            })
          }}
        >
          <source srcSet={coverSrc} type="image/webp" />
          <source srcSet={coverSrcJpg} type="image/jpeg" />
          <CoverImg
            alt="img"
            src={coverSrc}
            fullWidth={fullWidth}
            rounded={rounded}
            withShadow={withShadow}
            {...(shouldBlurCover && {
              className: `blurFilter`
            })}
            onLoad={() => {
              setIsLoading(false)
            }}
            onError={(e) => {
              isMounted() && setHasError(true)
            }}
            {...rest}
          />
        </picture>
      </Box>
    )
  }
)
