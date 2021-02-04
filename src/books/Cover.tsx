import React, { FC, useEffect, useMemo, useState } from 'react'
import { useMountedState } from 'react-use'
import { API_URI } from '../constants'
import placeholder from '../assets/cover-placeholder.png'
import { useTheme } from '@material-ui/core'
import { useRecoilValue } from 'recoil'
import { bookState } from './states'
import { authState } from '../auth/authState'

export const Cover: FC<{
  bookId: string,
  style?: React.CSSProperties
  fullWidth?: boolean,
  withShadow?: boolean,
  rounded?: boolean,
}> = ({ bookId, style, fullWidth = true, withShadow = false, rounded = true, ...rest }) => {
  const auth = useRecoilValue(authState)
  const isMounted = useMountedState()
  const theme = useTheme()
  const book = useRecoilValue(bookState(bookId))
  const [hasError, setHasError] = useState(false)
  const [isLoading, setIsLoading] = useState(true)

  const assetHash = book?.lastMetadataUpdatedAt?.toString()

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

  const finalStyle: React.CSSProperties = useMemo(() => ({
    position: 'relative',
    height: '100%',
    ...withShadow && {
      boxShadow: `0px 0px 3px ${theme.palette.grey[400]}`,
    },
    ...fullWidth && {
      width: '100%',
    },
    justifySelf: 'flex-end',
    objectFit: 'cover',
    ...rounded && {
      borderRadius: 5,
    },
    ...style,
  }), [theme, fullWidth, style, rounded, withShadow])

  const imgStyle = useMemo(() => ({
    ...finalStyle,
    ...isLoading && {
      display: 'none'
    }
  }), [finalStyle, isLoading])

  return (
    <>
      {isLoading && (
        <img
          alt="img"
          src={placeholder}
          style={finalStyle}
          {...rest}
        />
      )}
      <picture style={imgStyle}>
        <source srcSet={coverSrc} type="image/webp" />
        <source srcSet={coverSrcJpg} type="image/jpeg" />
        <img
          alt="img"
          src={coverSrc}
          style={finalStyle}
          onLoad={() => {
            setIsLoading(false)
          }}
          onError={(e) => {
            isMounted() && setHasError(true)
          }}
          {...rest}
        />
      </picture>
    </>
  )
}