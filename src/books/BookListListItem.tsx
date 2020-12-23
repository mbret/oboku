import { Box, Button, ListItemText, Typography, useTheme } from '@material-ui/core'
import React, { FC } from 'react'
import { useRecoilValue } from 'recoil'
import { Cover } from './Cover'
import { useDefaultItemClickHandler } from './listHelpers'
import { enrichedBookState } from './states'

export const BookListListItem: FC<{
  bookId: string,
  onItemClick?: (id: string) => void,
  isSelected?: (id: string) => boolean,
  size?: 'small' | 'large',
  itemHeight?: number,
}> = ({ bookId, onItemClick, size = 'large', itemHeight }) => {
  const book = useRecoilValue(enrichedBookState(bookId))
  const onDefaultItemClick = useDefaultItemClickHandler()
  const theme = useTheme()
  const computedHeight = itemHeight || (size === 'small' ? 50 : 100)
  const coverWidth = computedHeight * theme.custom.coverAverageRatio

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
      <Box style={{
        flex: `0 0 ${coverWidth}px`
      }}>
        {book && (
          <Cover
            bookId={book._id}
          />
        )}
      </Box>
      <Box style={{
        marginLeft: theme.spacing(1)
      }} overflow="hidden">
        <ListItemText primary={(
          <Typography
            noWrap
            display="block"
            {...size === 'small' && {
              variant: 'body2'
            }}
          >
            {book?.title || 'Unknown'}
          </Typography>
        )} secondary={book?.creator} />
      </Box>
    </Box>
  )
}