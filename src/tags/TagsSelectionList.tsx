import { List, ListItem, ListItemAvatar, ListItemText } from '@material-ui/core'
import { CheckCircleRounded, LockRounded, RadioButtonUncheckedOutlined } from '@material-ui/icons'
import { Tag } from 'oboku-shared'
import React, { FC } from 'react'

export const TagsSelectionList: FC<{
  tags: Tag[],
  onItemClick: (id: string) => void,
  isSelected: (id: string) => boolean,
}> = ({ tags, onItemClick, isSelected }) => {

  return (
    <List>
      {tags?.map((tag) => (
        <ListItem
          key={tag?.id}
          button
          onClick={() => {
            tag?.id && onItemClick(tag.id)
          }}
        >
          <ListItemAvatar>
            {tag.id && isSelected(tag.id)
              ? <CheckCircleRounded />
              : <RadioButtonUncheckedOutlined />}
          </ListItemAvatar>
          <ListItemText primary={tag?.name} />
          {tag.isProtected && <LockRounded color="primary" />}
        </ListItem>
      ))}
    </List>
  )
}