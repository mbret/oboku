import React, { useRef, FC } from 'react'
import { CircularProgress, GridList, GridListTile, GridListTileBar, IconButton, makeStyles } from "@material-ui/core"
import { models } from '../client';
import { useWindowSize } from 'react-use';
import { API_URI } from '../constants';
import { useDownloadFile } from '../download/useDownloadFile';
import { useHistory } from 'react-router-dom';
import { useQueryGetBooks } from '../books/queries';
import { BookList } from '../library/BookList';
import { useQuery } from '@apollo/client';
import { Query_One_Series_Document } from '../generated/graphql';

export const SeriesBookList: FC<{ seriesId: string }> = ({ seriesId }) => {
  const history = useHistory();
  const classes = useStyles();
  const { data: seriesData } = useQuery(Query_One_Series_Document, { variables: { id: seriesId } })
  const downloadFile = useDownloadFile()
  const books = seriesData?.oneSeries?.books || []

  console.log('[BookList]', seriesData)

  return (
    <BookList data={books} style={{ height: '100%' }} />
  )
}

const useStyles = () => {
  const windowSize = useWindowSize()

  return useRef(makeStyles((theme) => ({
    container: {
      display: 'flex',
      height: 500,
      flexGrow: 1,
      paddingBottom: 2
    },
    gridList: {
      width: (props: any) => props.windowSize.width,
    },
    icon: {
      color: 'rgba(255, 255, 255, 0.54)',
    },
  }))).current({
    windowSize
  })
}