import { Box, ListItemAvatar, ListItemText, Typography, useTheme } from '@material-ui/core'
import { CheckCircleRounded, RadioButtonUncheckedOutlined } from '@material-ui/icons'
import React, { FC } from 'react'
import { useRecoilValue } from 'recoil'
import { Cover } from './Cover'
import { enrichedBookState } from './states'

export const BookListListItem: FC<{
  bookId: string,
  onItemClick?: (id: string) => void,
  isSelected?: (id: string) => boolean,
  size?: 'small' | 'large'
}> = ({ bookId, onItemClick, size = 'large' }) => {
  const book = useRecoilValue(enrichedBookState(bookId))
  const theme = useTheme()
  const itemHeight = size === 'small' ? 50 : 100
  const coverWidth = itemHeight * theme.custom.coverAverageRatio

  return (
    <Box
      key={book?._id}
      onClick={() => {
        book?._id && onItemClick && onItemClick(book._id)
      }}
      style={{
        // border: '1px solid green',
        display: 'flex',
        flexGrow: 1,
        overflow: 'auto',
        height: itemHeight,
      }}
    >
      <Box style={{
        // border: '1px solid red',
        // marginRight: theme.spacing(1),
        flex: `0 0 ${coverWidth}px`
      }}>
        {book && (
          <Cover
            // rounded={false}
            bookId={book._id}
            style={{
              // width: coverWidth,
              // height: coverWidth / theme.custom.coverAverageRatio,
            }}
          />
        )}
      </Box>
      <Box style={{
        marginLeft: theme.spacing(1)
      }}>
        <ListItemText primary={(
          <Typography
            noWrap
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