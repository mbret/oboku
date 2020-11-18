import { List, ListItem, ListItemText } from '@material-ui/core';
import { CheckCircleRounded, RadioButtonUncheckedOutlined } from '@material-ui/icons';
import { Maybe } from 'graphql/jsutils/Maybe';
import React, { FC } from 'react';
import { Collection } from '../generated/graphql';

export const CollectionSelectionList: FC<{
  collections: Maybe<Collection>[],
  onItemClick: (id: string) => void,
  isSelected: (id: string) => boolean,
}> = ({ collections, onItemClick, isSelected }) => {

  return (
    <List>
      {collections && collections.map((item) => (
        <ListItem
          key={item?.id}
          button
          onClick={() => {
            item?.id && onItemClick(item.id)
          }}
        >
          <ListItemText primary={item?.name} />
          {item?.id && isSelected(item?.id)
            ? <CheckCircleRounded />
            : <RadioButtonUncheckedOutlined />}
        </ListItem>
      ))}
    </List>
  )
}