import React from 'react';
import { TopBarNavigation } from '../TopBarNavigation';
import { makeStyles, Typography } from '@material-ui/core';
import { useParams } from 'react-router-dom';
import { useQueryGetOneSeries } from '../series/queries';
import { SeriesBookList } from './SeriesBookList';

type ScreenParams = {
  id: string
}

export const SeriesDetailsScreen = () => {
  const headerHeight = '20vh'
  const classes = useClasses({ headerHeight })
  const { id } = useParams<ScreenParams>()
  const { data } = useQueryGetOneSeries({ variables: { id } })
  const series = data?.oneSeries

  console.log('[SeriesDetailsScreen]', series)

  return (
    <div style={{
      flex: 1
    }}>
      <TopBarNavigation title="" showBack={true} position="absolute" color="transparent" />
      <div style={{

      }}>
        <img
          src="/series-bg.webp"
          alt="img"
          style={{
            width: '100%',
            filter: 'grayscale(100%)',
            height: headerHeight,
            objectFit: 'cover',
          }}
        />
        <div className={classes.headerContent}>
          <div>
            <Typography variant="h5" gutterBottom className={classes.titleTypo} >
              {series?.name}
            </Typography>
            <Typography variant="subtitle1" gutterBottom className={classes.titleTypo}>
              {`${series?.books?.length || 0} book(s)`}
            </Typography>
          </div>
        </div>
        <SeriesBookList seriesId={id} />
      </div>
    </div>
  );
}

const useClasses = makeStyles(theme => {
  type Props = { headerHeight: string }

  return {
    headerContent: {
      boxShadow: 'black 0px 82px 50px -50px inset',
      height: ({ headerHeight }: Props) => headerHeight,
      position: 'absolute',
      top: 0,
      display: 'flex',
      alignItems: 'flex-end',
      paddingLeft: theme.spacing(2),
      paddingRight: theme.spacing(2),
    },
    titleTypo: {
      color: 'white',
      textShadow: '0px 0px 3px black'
    }
  }
})