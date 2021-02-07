import React, { FC, memo, useEffect, useState } from 'react'
import { useMountedState } from 'react-use'
import { API_URI } from '../constants'
import placeholder from '../assets/cover-placeholder.png'
import { Box, makeStyles } from '@material-ui/core'
import { selectorFamily, useRecoilValue } from 'recoil'
import { enrichedBookState } from './states'
import { authState } from '../auth/authState'
import { bluredTagIdsState } from '../tags/states'

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
}

export const Cover: FC<Props> = memo(({ bookId, style, fullWidth = true, withShadow = false, rounded = true, ...rest }) => {
  const auth = useRecoilValue(authState)
  const isMounted = useMountedState()
  const book = useRecoilValue(bookCoverState(bookId))
  const [hasError, setHasError] = useState(false)
  const [isLoading, setIsLoading] = useState(true)
  const classes = useStyle({ withShadow, fullWidth, rounded, isLoading })

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

  return (
    <Box style={style} className={classes.container}>
      {isLoading && (
        <img
          alt="img"
          src={placeholder}
          className={classes.img}
          {...book?.isBlurred && {
            className: `${classes.img} svgBlur`
          }}
          {...rest}
        />
      )}
      <picture className={classes.picture}>
        <source srcSet={coverSrc} type="image/webp" />
        <source srcSet={coverSrcJpg} type="image/jpeg" />
        <img
          alt="img"
          src={coverSrc}
          className={classes.img}
          {...book?.isBlurred && {
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
    </Box>
  )
})

type StyleProps = Pick<Props, 'withShadow' | 'fullWidth' | 'rounded'> & { isLoading: boolean }

const useStyle = makeStyles(theme => ({
  container: {
    width: '100%'
  },
  picture: ({ isLoading }: StyleProps) => ({
    width: '100%',
    ...isLoading && {
      display: 'none'
    }
  }),
  img: ({ withShadow, fullWidth, rounded }: StyleProps) => ({
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
  }),
}))