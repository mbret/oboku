import React, { FC } from 'react'
import { makeStyles, Typography } from "@material-ui/core"
import { MoreVert } from '@material-ui/icons';
import { useWindowSize } from 'react-use';
import { useRecoilState, useRecoilValue } from 'recoil';
import { bookActionDrawerState } from '../BookActionsDrawer';
import { enrichedBookState } from '../states';
import { useDefaultItemClickHandler } from './helpers';
import { BookListCoverContainer } from './BookListCoverContainer';

export const BookListGridItem: FC<{
  bookId: string,
  onItemClick?: (id: string) => void,
}> = ({ bookId, onItemClick }) => {
  const item = useRecoilValue(enrichedBookState(bookId))
  const onDefaultItemClick = useDefaultItemClickHandler()
  const windowSize = useWindowSize()
  const classes = useStyles({ windowSize });
  const [, setBookActionDrawerState] = useRecoilState(bookActionDrawerState)

  return (
    <div
      key={item?._id}
      className={classes.itemContainer}
      onClick={() => {
        if (onItemClick) return onItemClick(bookId)
        return onDefaultItemClick(bookId)
      }}
    >
      <BookListCoverContainer
        bookId={bookId}
        className={classes.coverContainer}
      />
      <div
        className={classes.itemBottomContainer}
        onClick={(e) => {
          e.stopPropagation()
          item?._id && setBookActionDrawerState({ openedWith: item._id })
        }}
      >
        <div style={{ width: '100%', overflow: 'hidden' }}>
          <Typography variant="body2" className={classes.itemTitle}>{item?.title || 'Unknown'}</Typography>
          <Typography variant="caption" noWrap={true} display="block">{item?.creator || 'Unknown'}</Typography>
        </div>
        <MoreVert style={{
          transform: 'translate(50%, 0%)'
        }} />
      </div>
    </div >
  )
}

const useStyles = makeStyles((theme) => {
  type Props = { windowSize: { width: number } }

  return {
    itemContainer: {
      cursor: 'pointer',
      height: '100%',
      position: 'relative',
      display: 'flex',
      flexFlow: 'column',
      paddingLeft: (props: Props) => theme.spacing(1),
      paddingRight: (props: Props) => theme.spacing(1),
    },
    coverContainer: {
      position: 'relative',
      display: 'flex',
      flex: 1,
      marginTop: (props: Props) => theme.spacing(1),
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
      marginBottom: (props: Props) => theme.spacing(1),
    },
    itemTitle: {
      whiteSpace: 'nowrap',
      overflow: 'hidden',
      textOverflow: 'ellipsis',
    },
  }
})