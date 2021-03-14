import React, { FC, memo } from 'react'
import { Typography, useTheme } from "@material-ui/core"
import { MoreVert } from '@material-ui/icons';
import { useRecoilState, useRecoilValue } from 'recoil';
import { bookActionDrawerState } from '../BookActionsDrawer';
import { enrichedBookState } from '../states';
import { useDefaultItemClickHandler } from './helpers';
import { BookListCoverContainer } from './BookListCoverContainer';
import { useCSS } from '../../common/utils';

export const BookListGridItem: FC<{
  bookId: string,
  onItemClick?: (id: string) => void,
}> = memo(({ bookId, onItemClick }) => {
  const item = useRecoilValue(enrichedBookState(bookId))
  const onDefaultItemClick = useDefaultItemClickHandler()
  const classes = useStyles();
  const [, setBookActionDrawerState] = useRecoilState(bookActionDrawerState)

  return (
    <div
      key={item?._id}
      style={classes.itemContainer}
      onClick={() => {
        if (onItemClick) return onItemClick(bookId)
        return onDefaultItemClick(bookId)
      }}
    >
      <BookListCoverContainer
        bookId={bookId}
        style={classes.coverContainer}
        size="large"
      />
      <div
        style={classes.itemBottomContainer}
        onClick={(e) => {
          e.stopPropagation()
          item?._id && setBookActionDrawerState({ openedWith: item._id })
        }}
      >
        <div style={{ width: '100%', overflow: 'hidden' }}>
          <Typography variant="body2" style={classes.itemTitle}>{item?.title || 'Unknown'}</Typography>
          <Typography variant="caption" noWrap={true} display="block">{item?.creator || 'Unknown'}</Typography>
        </div>
        <MoreVert style={{
          transform: 'translate(50%, 0%)'
        }} />
      </div>
    </div >
  )
})

const useStyles = () => {
  const theme = useTheme()

  return useCSS(() => ({
    itemContainer: {
      cursor: 'pointer',
      height: '100%',
      position: 'relative',
      display: 'flex',
      flexFlow: 'column',
      // paddingLeft: theme.spacing(1),
      // paddingRight: theme.spacing(1),
      padding: theme.spacing(1),
      // paddingRight: theme.spacing(1),
      // paddingBottom: theme.spacing(1),
      // paddingTop: theme.spacing(2),
    },
    coverContainer: {
      position: 'relative',
      display: 'flex',
      flex: 1,
      // marginTop: theme.spacing(1),
      minHeight: 0 // @see https://stackoverflow.com/questions/42130384/why-should-i-specify-height-0-even-if-i-specified-flex-basis-0-in-css3-flexbox
    },
    itemBottomContainer: {
      width: '100%',
      height: 50,
      flexFlow: 'row',
      display: 'flex',
      alignItems: 'center',
      paddingLeft: 2,
      paddingRight: 5,
      // marginBottom: theme.spacing(1),
    },
    itemTitle: {
      whiteSpace: 'nowrap',
      overflow: 'hidden',
      textOverflow: 'ellipsis',
    },
  }), [theme])
}
