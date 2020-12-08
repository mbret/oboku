import { List, ListItem, ListItemAvatar, ListItemText } from '@material-ui/core'
import { CheckCircleRounded, LockRounded, RadioButtonUncheckedOutlined } from '@material-ui/icons'
import React, { FC } from 'react'
import { TagsDocType } from '../rxdb'

export const TagsSelectionList: FC<{
  tags: TagsDocType[],
  onItemClick: (id: string) => void,
  isSelected: (id: string) => boolean,
}> = ({ tags, onItemClick, isSelected }) => {

  return (
    <List>
      {tags?.map((tag) => (
        <ListItem
          key={tag?._id}
          button
          onClick={() => {
            tag?._id && onItemClick(tag._id)
          }}
        >
          <ListItemAvatar>
            {tag?._id && isSelected(tag?._id)
              ? <CheckCircleRounded />
              : <RadioButtonUncheckedOutlined />}
          </ListItemAvatar>
          <ListItemText primary={tag?.name} />
          {tag?.isProtected && <LockRounded color="primary" />}
        </ListItem>
      ))}
    </List>
  )
}