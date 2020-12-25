import { Box, makeStyles, Typography, useTheme } from '@material-ui/core'
import React, { FC } from 'react'
import { useRecoilValue, useSetRecoilState } from 'recoil'
import { useDefaultItemClickHandler } from './helpers'
import { enrichedBookState } from '../states'
import { BookListCoverContainer } from './BookListCoverContainer'
import { ReadingStateState } from 'oboku-shared'
import { MenuBookRounded, MoreVert } from '@material-ui/icons'
import { bookActionDrawerState } from '../BookActionsDrawer'

export const BookListListItem: FC<{
  bookId: string,
  onItemClick?: (id: string) => void,
  isSelected?: (id: string) => boolean,
  size?: 'small' | 'large',
  itemHeight?: number,
  withDrawerActions?: boolean
}> = ({ bookId, onItemClick, size = 'large', itemHeight, withDrawerActions = true }) => {
  const book = useRecoilValue(enrichedBookState(bookId))
  const onDefaultItemClick = useDefaultItemClickHandler()
  const theme = useTheme()
  const computedHeight = itemHeight || (size === 'small' ? 50 : 100)
  const coverWidth = computedHeight * theme.custom.coverAverageRatio
  const classes = useStyles({ coverWidth })
  const setBookActionDrawerState = useSetRecoilState(bookActionDrawerState)

  return (
    <Box
      key={book?._id}
      onClick={() => {
        if (onItemClick) return onItemClick(bookId)
        return onDefaultItemClick(bookId)
      }}
      style={{
        display: 'flex',
        overflow: 'hidden',
        height: computedHeight,
        cursor: 'pointer'
      }}
      flexGrow={1}
    >
      <BookListCoverContainer
        bookId={bookId}
        className={classes.coverContainer}
        withReadingProgress={false}
      />
      <Box ml={1} overflow="hidden" style={{ display: 'flex', flex: 1, minHeight: 0, flexDirection: 'column' }}>
        <Typography
          noWrap
          variant="body1"
          display="block"
          {...size === 'small' && {
            variant: 'body2'
          }}
        >
          {book?.title || 'Unknown'}
        </Typography>
        <Typography noWrap color="textSecondary" variant="body2">{book?.creator}</Typography>
        <Box style={{ display: 'flex', flex: 1, minHeight: 0, alignItems: 'flex-end' }}>
          {book?.readingStateCurrentState === ReadingStateState.Reading && (
            <>
              <MenuBookRounded style={{ opacity: '50%' }} />
              <Typography
                color="textSecondary"
                style={{
                  marginLeft: theme.spacing(0.5),
                }}>{Math.floor((book?.readingStateCurrentBookmarkProgressPercent || 0) * 100) || 1}%</Typography>
            </>
          )}
        </Box>
      </Box>
      {withDrawerActions && (
        <Box
          display="flex"
          alignItems="center"
          ml={1}
          onClick={(e) => {
            e.stopPropagation()
            book?._id && setBookActionDrawerState({ openedWith: book._id })
          }}
        >
          <MoreVert style={{
            // transform: 'translate(-50%, 0%)',
          }} />
        </Box>
      )}
    </Box>
  )
}

const useStyles = makeStyles((theme) => {
  type Props = { windowSize: { width: number } }

  return {
    coverContainer: {
      position: 'relative',
      display: 'flex',
      flex: ({ coverWidth }: { coverWidth: number }) => `0 0 ${coverWidth}px`,
      // marginTop: (props: Props) => theme.spacing(1),
      minHeight: 0 // @see https://stackoverflow.com/questions/42130384/why-should-i-specify-height-0-even-if-i-specified-flex-basis-0-in-css3-flexbox
    },
  }
})