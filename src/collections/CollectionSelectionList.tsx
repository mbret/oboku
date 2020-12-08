import { List, ListItem, ListItemText } from '@material-ui/core';
import { CheckCircleRounded, RadioButtonUncheckedOutlined } from '@material-ui/icons';
import React, { FC } from 'react';
import { Collection } from './states';

export const CollectionSelectionList: FC<{
  collections: Collection[],
  onItemClick: (id: string) => void,
  isSelected: (id: string) => boolean,
}> = ({ collections, onItemClick, isSelected }) => {

  return (
    <List>
      {collections && collections.map((item) => (
        <ListItem
          key={item?._id}
          button
          onClick={() => {
            item?._id && onItemClick(item._id)
          }}
        >
          <ListItemText primary={item?.name} />
          {item?._id && isSelected(item?._id)
            ? <CheckCircleRounded />
            : <RadioButtonUncheckedOutlined />}
        </ListItem>
      ))}
    </List>
  )
}