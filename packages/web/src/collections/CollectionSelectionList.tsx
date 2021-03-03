import { List, ListItem, ListItemText } from '@material-ui/core';
import { CheckCircleRounded, RadioButtonUncheckedOutlined } from '@material-ui/icons';
import React, { FC } from 'react';
import { UnwrapRecoilValue } from 'recoil';
import { collectionsAsArrayState } from './states';

export const CollectionSelectionList: FC<{
  collections: UnwrapRecoilValue<typeof collectionsAsArrayState>,
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
          <ListItemText primary={item?.displayableName} />
          {item?._id && isSelected(item?._id)
            ? <CheckCircleRounded />
            : <RadioButtonUncheckedOutlined />}
        </ListItem>
      ))}
    </List>
  )
}