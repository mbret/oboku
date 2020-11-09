import React from 'react'
import { useWindowSize } from "react-use"
import { makeStyles } from "@material-ui/core"
import { useRef, FC } from "react"
import { useBook } from "./queries"
import { API_URI } from '../constants'

export const BookGridItem: FC<{ id: string }> = ({ id }) => {
  const classes = useClasses()
  const { data } = useBook({ variables: { id } })
  const book = data?.book

  return (
    <div
      className={classes.itemContainer}
      onClick={() => {
        // if (!item.lastMetadataUpdatedAt) return
        // if (item.downloadState === 'none') {
        //   item.id && downloadFile(item.id).catch(() => { })
        // } else if (item.downloadState === 'downloaded') {
        //   history.push(`/reader/${item.id}`)
        // }
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
        <img
          alt="img"
          src={`${API_URI}/cover/${book?.id}`}
          style={{
            position: 'relative',
            ...!(book?.downloadState === 'downloaded') && {
              opacity: 0.5,
            },
            height: '100%',
            width: '100%',
            objectFit: 'cover',
            borderRadius: 10,
          }}
        />
        {/* <div style={{
          position: 'absolute',
          height: '100%',
          width: '100%',
          top: 0,
          display: 'flex',
          justifyContent: 'center',
          alignItems: 'center'
        }}>
          {!item.lastMetadataUpdatedAt && (
            <Button
              startIcon={<CircularProgress size="1rem" />}
            >
              Refresh...
            </Button>
          )}
          {item.lastMetadataUpdatedAt && item.downloadState === 'none' && (
            <CloudDownloadRounded />
          )}
          {item.downloadState === 'downloading' && (
            <Button
              startIcon={<Pause />}
            >
              Downloading...
              </Button>
          )}
        </div> */}
      </div>
      {/* <div
        className={classes.itemBottomContainer}
        onClick={(e) => {
          e.stopPropagation()
          item.id && models.isBookActionDialogOpenedWithVar(models.isBookActionDialogOpenedWithVar(item.id))
        }}
      >
        <div style={{ width: '100%', overflow: 'hidden' }}>
          <Typography variant="subtitle1" className={classes.itemTitle}>{item?.title || 'Unknown'}</Typography>
          <Typography variant="subtitle2">By {item?.author || 'Unknown'}</Typography>
        </div>
        <MoreVert style={{ transform: 'translate(50%, 0%)' }} />
      </div> */}
    </div >
  )
}


const useClasses = () => {
  const windowSize = useWindowSize()

  return useRef(makeStyles((theme) => ({
    container: {
      paddingLeft: theme.spacing(1),
      paddingRight: theme.spacing(1),
      display: 'flex',
      flexFlow: 'column',
      height: '100%',
    },
    itemContainer: {
      cursor: 'pointer',
      height: '100%',
      position: 'relative',
      paddingBottom: 10,
      boxSizing: 'border-box',
      display: 'flex',
      flexFlow: 'column',
      padding: theme.spacing(1)
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
    gridList: {
      width: (props: any) => props.windowSize.width,
    },
  }))).current({
    windowSize
  })
}