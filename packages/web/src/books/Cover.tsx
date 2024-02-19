import React, { FC, memo, useEffect, useState } from "react"
import { useMountedState } from "react-use"
import placeholder from "../assets/cover-placeholder.png"
import { useTheme } from "@mui/material"
import { useEnrichedBookState } from "./states"
import {
  useBlurredTagIds,
  useProtectedTagIds,
  useTagsByIds
} from "../tags/helpers"
import { useCSS } from "../common/utils"
import { API_URI } from "../constants"
import { useLocalSettingsState } from "../settings/states"
import { normalizedBookDownloadsStateSignal } from "../download/states"
import { useSignalValue } from "reactjrx"
import { authStateSignal } from "../auth/authState"

const useBookCoverState = ({ bookId }: { bookId: string }) => {
  const tags = useTagsByIds().data
  const normalizedBookDownloadsState = useSignalValue(
    normalizedBookDownloadsStateSignal
  )
  const blurredTags = useBlurredTagIds().data ?? []
  const protectedTags = useProtectedTagIds().data ?? []

  const enrichedBook = useEnrichedBookState({
    bookId,
    normalizedBookDownloadsState,
    protectedTagIds: protectedTags,
    tags
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
    const classes = useStyle({ withShadow, fullWidth, rounded, isLoading })
    const assetHash = book?.lastMetadataUpdatedAt?.toString()
    const localSettings = useLocalSettingsState()
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
      ? `${API_URI}/covers/${auth?.nameHex}-${book._id}?${urlParams.toString()}`
      : undefined
    urlParams.append("format", "image/jpeg")
    const originalJpgSrc = book
      ? `${API_URI}/covers/${auth?.nameHex}-${book._id}?${urlParams.toString()}`
      : undefined

    const coverSrc = originalSrc && !hasError ? originalSrc : placeholder
    const coverSrcJpg =
      originalJpgSrc && !hasError ? originalJpgSrc : placeholder

    useEffect(() => {
      setHasError(false)
    }, [originalSrc])

    return (
      <div style={{ ...classes.container, ...style }}>
        {isLoading && (
          <img
            alt="img"
            src={placeholder}
            style={classes.img}
            {...(shouldBlurCover && {
              className: `${classes.img} svgBlur`
            })}
            {...rest}
          />
        )}
        <picture style={classes.picture}>
          <source srcSet={coverSrc} type="image/webp" />
          <source srcSet={coverSrcJpg} type="image/jpeg" />
          <img
            alt="img"
            src={coverSrc}
            style={classes.img}
            {...(shouldBlurCover && {
              className: `${classes.img} svgBlur`
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
      </div>
    )
  }
)

type StyleProps = Pick<Props, "withShadow" | "fullWidth" | "rounded"> & {
  isLoading: boolean
}

const useStyle = ({
  withShadow,
  fullWidth,
  rounded,
  isLoading
}: StyleProps) => {
  const theme = useTheme()

  return useCSS(
    () => ({
      container: {
        width: "100%",
        height: "100%"
      },
      picture: {
        width: "100%",
        ...(isLoading && {
          display: "none"
        })
      },
      img: {
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
      }
    }),
    [theme, withShadow, fullWidth, rounded, isLoading]
  )
}
