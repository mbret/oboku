import { List, ListItem, ListItemAvatar, ListItemText, useTheme } from '@material-ui/core'
import { CheckCircleRounded, RadioButtonUncheckedOutlined } from '@material-ui/icons'
import React, { FC } from 'react'
import { Book, Maybe } from '../generated/graphql'
import { Cover } from './Cover'

export const BooksSelectionList: FC<{
  books: Maybe<Book>[],
  onItemClick: (id: string) => void,
  isSelected: (id: string) => boolean,
}> = ({ books, onItemClick, isSelected }) => {
  const theme = useTheme()
  const coverWidth = 50

  return (
    <List>
      {books?.map((item) => (
        <ListItem
          key={item?.id}
          button
          onClick={() => {
            item?.id && onItemClick(item.id)
          }}
        >
          <ListItemAvatar style={{ marginRight: theme.spacing(1) }}>
            <>
              {item && <Cover rounded={false} bookId={item.id} style={{
                width: coverWidth,
                height: coverWidth / theme.custom.coverAverageRatio,
              }} />}
            </>
          </ListItemAvatar>
          <ListItemText primary={item?.title || 'Unknown'} secondary="asdasd" />
          {item?.id && isSelected(item?.id)
            ? <CheckCircleRounded />
            : <RadioButtonUncheckedOutlined />}
        </ListItem>
      ))}
    </List>
  )
}