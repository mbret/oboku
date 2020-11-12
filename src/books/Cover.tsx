import React, { FC, useEffect, useState } from 'react'
import { useMountedState } from 'react-use'
import { API_URI } from '../constants'
import { useBook } from './queries'
import placeholder from '../assets/cover-placeholder.png'

export const Cover: FC<{
  bookId: string,
  style?: React.CSSProperties
  fullWidth?: boolean
}> = ({ bookId, style, fullWidth = true }) => {
  const isMounted = useMountedState()
  const { data } = useBook({ variables: { id: bookId } })
  const [hasError, setHasError] = useState(false)
  const book = data?.book

  const coverSrc = book
    ? `${API_URI}/cover/${book.id}?${book?.lastMetadataUpdatedAt || ''}`
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
        ...fullWidth && {
          width: '100%',
        },
        justifySelf: 'flex-end',
        objectFit: 'cover',
        borderRadius: 10,
        ...style,
      }}
      onError={() => {
        isMounted() && setHasError(true)
      }}
    />
  )
}