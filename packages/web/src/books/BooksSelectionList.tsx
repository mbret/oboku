import { List, ListItem, ListItemAvatar, ListItemText, Typography, useTheme } from '@material-ui/core'
import { CheckCircleRounded, RadioButtonUncheckedOutlined } from '@material-ui/icons'
import { FC } from 'react'
import { Cover } from './Cover'
import { Book } from './states'

export const BooksSelectionList: FC<{
  books: Book[],
  onItemClick: (id: string) => void,
  isSelected: (id: string) => boolean,
  style?: React.CSSProperties
}> = ({ books, onItemClick, isSelected, style }) => {
  const theme = useTheme()
  const coverWidth = 50

  return (
    <List style={{ overflow: 'scroll', ...style }}>
      {books?.map((item) => (
        <ListItem
          key={item?._id}
          button
          onClick={() => {
            item?._id && onItemClick(item._id)
          }}
          disableGutters
        >
          <ListItemAvatar style={{ marginRight: theme.spacing(1) }}>
            <>
              {item && <Cover rounded={false} bookId={item._id} style={{
                width: coverWidth,
                height: coverWidth / theme.custom.coverAverageRatio,
              }} />}
            </>
          </ListItemAvatar>
          <ListItemText primary={<Typography noWrap>{item?.title || 'Unknown'}</Typography>} secondary="asdasd" />
          {item?._id && isSelected(item?._id)
            ? <CheckCircleRounded />
            : <RadioButtonUncheckedOutlined />}
        </ListItem>
      ))}
    </List>
  )
}