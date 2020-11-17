import React, { FC } from 'react'
import { CircularProgress, makeStyles, Typography } from "@material-ui/core"
import { CloudDownloadRounded, MoreVert, Pause } from '@material-ui/icons';
import { models } from '../client';
import { useWindowSize } from 'react-use';
import { ROUTES } from '../constants';
import { useDownloadFile } from '../download/useDownloadFile';
import { useHistory } from 'react-router-dom';
import { Cover } from '../books/Cover';
import { Book, QueryBookDocument } from '../generated/graphql';
import { useQuery } from '@apollo/client';

export const BookListGridItem: FC<{
  bookId: Book['id'],
}> = ({ bookId }) => {
  const { data } = useQuery(QueryBookDocument, { variables: { id: bookId } }) || {}
  const history = useHistory();
  const windowSize = useWindowSize()
  const classes = useStyles({ windowSize });
  const downloadFile = useDownloadFile()
  const item = data?.book

  return (
    <div
      key={item?.id}
      className={classes.itemContainer}
      onClick={() => {
        if (!item?.lastMetadataUpdatedAt) return
        if (item?.downloadState === 'none') {
          item?.id && downloadFile(item?.id).catch(() => { })
        } else if (item?.downloadState === 'downloaded') {
          history.push(ROUTES.READER.replace(':id', item?.id))
        }
      }}
    >
      <div
        style={{
          position: 'relative',
          flexGrow: 1,
          width: '100%',
          minHeight: 0,
        }}
      >
        {item && <Cover bookId={item?.id} />}
        {item?.downloadState === 'downloading' && (
          <div style={{
            backgroundColor: 'white',
            opacity: 0.5,
            height: `${100 - (item?.downloadProgress || 0)}%`,
            width: '100%',
            position: 'absolute',
            top: 0,
          }} />
        )}
        <div style={{
          position: 'absolute',
          height: '100%',
          width: '100%',
          top: 0,
          display: 'flex',
          justifyContent: 'center',
          alignItems: 'center'
        }}>
          {!item?.lastMetadataUpdatedAt && (
            <div className={classes.itemCoverCenterInfo}>
              <CircularProgress size="1rem" />&nbsp;
              <Typography noWrap>Refresh...</Typography>
            </div>
          )}
          {item?.lastMetadataUpdatedAt && item?.downloadState === 'none' && (
            <>
              <div style={{
                backgroundColor: 'white',
                opacity: 0.5,
                height: '100%',
                width: '100%',
                position: 'absolute',
                top: 0,
              }} />
              <CloudDownloadRounded />
            </>
          )}
          {item?.downloadState === 'downloading' && (
            <div className={classes.itemCoverCenterInfo}>
              <Pause />&nbsp;
              <Typography noWrap>Downloading...</Typography>
            </div>
          )}
        </div>
      </div>
      <div
        className={classes.itemBottomContainer}
        onClick={(e) => {
          e.stopPropagation()
          item?.id && models.isBookActionDialogOpenedWithVar(models.isBookActionDialogOpenedWithVar(item.id))
        }}
      >
        <div style={{ width: '100%', overflow: 'hidden' }}>
          <Typography variant="body2" className={classes.itemTitle}>{item?.title || 'Unknown'}</Typography>
          <Typography variant="caption">{item?.creator || 'Unknown'}</Typography>
        </div>
        <MoreVert style={{ transform: 'translate(50%, 0%)' }} />
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
      boxSizing: 'border-box',
      display: 'flex',
      flexFlow: 'column',
      padding: (props: Props) => theme.spacing(1),
      // border: '1px solid blue',
    },
    itemBottomContainer: {
      boxSizing: 'border-box',
      width: '100%',
      height: 50,
      minHeight: 50,
      flexFlow: 'row',
      display: 'flex',
      alignItems: 'center',
      paddingLeft: 2,
      paddingRight: 5,
    },
    itemTitle: {
      whiteSpace: 'nowrap',
      overflow: 'hidden',
      textOverflow: 'ellipsis',
    },
    itemCoverCenterInfo: {
      display: 'flex',
      alignItems: 'center',
      overflow: 'hidden',
      width: '90%',
      justifyContent: 'center',
    },
    itemCoverCenterInfoText: {

    },
  }
})