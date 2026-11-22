import type React from "react"
import { memo, useState } from "react"
import placeholder from "../assets/cover-placeholder.jpg"
import { Box, type BoxProps, styled } from "@mui/material"
import { useBook } from "./states"
import { useBlurredTagIds } from "../tags/helpers"
import { useLocalSettings } from "../settings/useLocalSettings"
import { useBookCover } from "./useBookCover"
import { getMetadataFromBook } from "./metadata"

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
    title: getMetadataFromBook(enrichedBook).title?.toString() ?? "",
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
    borderRadius: theme.shape.borderRadius,
  }),
}))

const CoverRootBox = styled(Box)({
  width: "100%",
  height: "100%",
  overflow: "hidden",
})

export const Cover = memo(function Cover({
  bookId,
  style,
  fullWidth = true,
  withShadow = false,
  rounded = true,
  blurIfNeeded = true,
  decorative = false,
  className,
  sx,
  ...rest
}: {
  bookId: string
  className?: string
  style?: React.CSSProperties
  fullWidth?: boolean
  withShadow?: boolean
  rounded?: boolean
  blurIfNeeded?: boolean
  /** Hides the cover from assistive technologies, for a cover shown beside its book's title. */
  decorative?: boolean
} & Pick<BoxProps, "sx">) {
  const book = useBookCoverState({
    bookId,
  })
  const [isLoading, setIsLoading] = useState(true)
  const localSettings = useLocalSettings()
  const shouldBlurCover =
    book?.isBlurred && blurIfNeeded && !localSettings.unBlurWhenProtectedVisible

  const { coverSrc, coverSrcJpg, onError } = useBookCover({ bookId })
  const alt = decorative ? "" : (book?.title ?? "")

  return (
    <CoverRootBox className={className} style={style} sx={sx}>
      {isLoading && (
        <CoverImg
          alt={alt}
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
        <source srcSet={coverSrc} type="image/webp" />
        <source srcSet={coverSrcJpg} type="image/jpeg" />
        <CoverImg
          alt={alt}
          src={coverSrc}
          fullWidth={fullWidth}
          rounded={rounded}
          withShadow={withShadow}
          {...(shouldBlurCover && {
            className: `blurFilter`,
          })}
          onLoad={() => {
            setIsLoading(false)
          }}
          onError={onError}
          {...rest}
        />
      </picture>
    </CoverRootBox>
  )
})
