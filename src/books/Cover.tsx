import React, { FC, useEffect, useState } from 'react'
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

  const coverSrc = book
    ? `${API_URI}/cover/${auth?.userId}-${book._id}?${book?.lastMetadataUpdatedAt || ''}`
    : placeholder

  const finalSrc = hasError ? placeholder : coverSrc

  useEffect(() => {
    setHasError(false)
  }, [coverSrc])

  const finalStyle: React.CSSProperties = {
    position: 'relative',
    // maxHeight: '100%',
    // maxWidth: '100%',
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
  }

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
      <img
        alt="img"
        src={finalSrc}
        style={{
          ...finalStyle,
          ...isLoading && {
            visibility: 'hidden'
          }
        }}
        onLoad={() => {
          setIsLoading(false)
        }}
        onError={(e) => {
          isMounted() && setHasError(true)
        }}
        {...rest}
      />
    </>
  )
}