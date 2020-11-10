import React, { memo } from 'react';
import { Step, Tour } from '../app-tour';
import cover from '../assets/cover.png'
import { Box, makeStyles, Typography } from '@material-ui/core';
import { makeVar, useReactiveVar } from '@apollo/client';
import { useFirstTimeExperience, useSetFirstTimeExperience } from './queries';

export const isAppTourWelcomeOpened = makeVar(false);

export const AppTourWelcome: React.FC = memo(() => {
  const { data: fteData } = useFirstTimeExperience()
  const setFirstTimeExperience = useSetFirstTimeExperience()
  const show = useReactiveVar(isAppTourWelcomeOpened) || !fteData?.firstTimeExperience.hasDoneWelcomeTour
  const styles = useStyles();

  return (
    <Tour
      unskippable
      id="FirstTimeCoverLongPress"
      show={show}
      onClose={() => {
        setFirstTimeExperience({ hasDoneWelcomeTour: true })
      }}
    >
      <Step
        id="FirstTimeCoverLongPress"
        number={1}
        content={(
          <Box className={styles.slide1}>
            <img src={cover} alt="cover" style={{
              width: '100%',
              maxWidth: 300,
              objectFit: 'cover',
            }} />
            <Typography>Welcome and thank you for using the app. Oboku is under heavy development so bugs are to be expected</Typography>
          </Box>
        )}
      />
    </Tour>
  );
});

const useStyles = makeStyles((theme) => ({
  text: {
    // ...fonts.bodyL,
    // color: colors.whitePrimary,
  },
  coverContainer: {
    // marginTop: vh(5),
    alignSelf: 'center',
    alignItems: 'center',
    justifyContent: 'center',
    // width: coverWidth,
  },
  slide1: {
    // display,
    padding: theme.spacing(5),
    boxSizing: 'border-box',
    textAlign: 'center',
    // border: '1px solid red',
    color: '#fff',
    display: 'flex',
    flex: 1,
    flexFlow: 'column',
    justifyContent: 'center',
    alignItems: 'center',
    // paddingHorizontal: 30,
    // justifyContent: 'center',
    // ...DeviceInfo.isTablet() && {
    //   paddingHorizontal: 180,
    // },
  },
  firstCircle: {
    width: 66,
    height: 66,
    borderRadius: 50,
    // backgroundColor: colors.white,
    opacity: 0.3,
    position: 'absolute',
  },
  secondCircle: {
    width: 40,
    height: 40,
    borderRadius: 50,
    // backgroundColor: colors.white,
    opacity: 0.4,
    position: 'absolute',
  },
  cover: {
    opacity: 0.4,
  },
}));