import React, { FC, useEffect, useState } from 'react'
import { useMountedState } from 'react-use'
import { API_URI } from '../constants'
import placeholder from '../assets/cover-placeholder.png'
import { useTheme } from '@material-ui/core'
import { useRecoilValue } from 'recoil'
import { normalizedBooksState } from './states'

export const Cover: FC<{
  bookId: string,
  style?: React.CSSProperties
  fullWidth?: boolean,
  withShadow?: boolean,
  rounded?: boolean,
}> = ({ bookId, style, fullWidth = true, withShadow = false, rounded = true, ...rest }) => {
  const isMounted = useMountedState()
  const theme = useTheme()
  const book = useRecoilValue(normalizedBooksState)[bookId || '-1']
  const [hasError, setHasError] = useState(false)

  const coverSrc = book
    ? `${API_URI}/cover/${book._id}?${book?.lastMetadataUpdatedAt || ''}`
    : placeholder

  useEffect(() => {
    setHasError(false)
  }, [coverSrc, isMounted])

  return (
    <img
      alt="img"
      src={hasError ? placeholder : coverSrc}
      style={{
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
          borderRadius: 10,
        },
        ...style,
      }}
      onError={() => {
        isMounted() && setHasError(true)
      }}
      {...rest}
    />
  )
}