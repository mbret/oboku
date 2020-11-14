import { List, ListItem, ListItemText } from '@material-ui/core';
import { CheckCircleRounded, RadioButtonUncheckedOutlined } from '@material-ui/icons';
import { Maybe } from 'graphql/jsutils/Maybe';
import React, { FC } from 'react';
import { Series } from '../generated/graphql';

export const SeriesSelectionList: FC<{
  series: Maybe<Series>[],
  onItemClick: (id: string) => void,
  isSelected: (id: string) => boolean,
}> = ({ series, onItemClick, isSelected }) => {

  return (
    <List>
      {series && series.map((item) => (
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