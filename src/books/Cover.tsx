import React, { FC, useEffect, useState } from 'react'
import { useMountedState } from 'react-use'
import { API_URI } from '../constants'
import { useBook } from './queries'
import placeholder from '../assets/cover-placeholder.png'

export const Cover: FC<{ bookId: string }> = ({ bookId }) => {
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
        height: '100%',
        width: '100%',
        objectFit: 'cover',
        borderRadius: 10,
      }}
      onError={() => {
        isMounted() && setHasError(true)
      }}
    />
  )
}