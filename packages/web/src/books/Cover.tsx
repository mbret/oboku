import React, { FC, memo, useEffect, useState } from 'react'
import { useMountedState } from 'react-use'
import placeholder from '../assets/cover-placeholder.png'
import { useTheme } from '@material-ui/core'
import { selectorFamily, useRecoilValue } from 'recoil'
import { enrichedBookState } from './states'
import { authState } from '../auth/authState'
import { bluredTagIdsState } from '../tags/states'
import { useCSS } from '../common/utils'
import { API_URI } from '../constants'
import { localSettingsState } from '../settings/states'

const bookCoverState = selectorFamily({
  key: 'bookCoverState',
  get: (id: string) => ({ get }) => {
    const enrichedBook = get(enrichedBookState(id))
    const bluredTags = get(bluredTagIdsState)

    if (!enrichedBook) return undefined

    const { _id, lastMetadataUpdatedAt } = enrichedBook

    return {
      _id,
      lastMetadataUpdatedAt,
      isBlurred: enrichedBook.tags.some(bookTagId => bluredTags.includes(bookTagId))
    }
  }
})

type Props = {
  bookId: string,
  style?: React.CSSProperties
  fullWidth?: boolean,
  withShadow?: boolean,
  rounded?: boolean,
  blurIfNeeded?: boolean
}

export const Cover: FC<Props> = memo(({ bookId, style, fullWidth = true, withShadow = false, rounded = true, blurIfNeeded = true, ...rest }) => {
  const auth = useRecoilValue(authState)
  const isMounted = useMountedState()
  const book = useRecoilValue(bookCoverState(bookId))
  const [hasError, setHasError] = useState(false)
  const [isLoading, setIsLoading] = useState(true)
  const classes = useStyle({ withShadow, fullWidth, rounded, isLoading })
  const assetHash = book?.lastMetadataUpdatedAt?.toString()
  const localSettings = useRecoilValue(localSettingsState)
  const shouldBlurCover = book?.isBlurred && blurIfNeeded && !localSettings.unblurWhenProtectedVisible

  const urlParams = new URLSearchParams({
    ...assetHash && {
      hash: assetHash,
    }
  })

  const originalSrc = book ? `${API_URI}/cover/${auth?.userId}-${book._id}?${urlParams.toString()}` : undefined
  urlParams.append('format', 'image/jpeg')
  const originalJpgSrc = book ? `${API_URI}/cover/${auth?.userId}-${book._id}?${urlParams.toString()}` : undefined

  const coverSrc = originalSrc && !hasError ? originalSrc : placeholder
  const coverSrcJpg = originalJpgSrc && !hasError ? originalJpgSrc : placeholder

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
          {...shouldBlurCover && {
            className: `${classes.img} svgBlur`
          }}
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
          {...shouldBlurCover && {
            className: `${classes.img} svgBlur`
          }}
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
})

type StyleProps = Pick<Props, 'withShadow' | 'fullWidth' | 'rounded'> & { isLoading: boolean }

const useStyle = ({ withShadow, fullWidth, rounded, isLoading }: StyleProps) => {
  const theme = useTheme()

  return useCSS(() => ({
    container: {
      width: '100%',
      height: '100%'
    },
    picture: {
      width: '100%',
      ...isLoading && {
        display: 'none'
      }
    },
    img: {
      position: 'relative',
      height: '100%',
      justifySelf: 'flex-end',
      objectFit: 'cover',
      ...withShadow && {
        boxShadow: `0px 0px 3px ${theme.palette.grey[400]}`,
      },
      ...fullWidth && {
        width: '100%',
      },
      ...rounded && {
        borderRadius: 5,
      },
    },
  }), [theme, withShadow, fullWidth, rounded, isLoading])
}