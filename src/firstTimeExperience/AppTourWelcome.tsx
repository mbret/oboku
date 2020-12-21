import React, { memo } from 'react';
import { Step, Tour } from '../app-tour';
import FteCoverAsset from '../assets/fte-cover.svg'
import { Box, makeStyles, Typography, useTheme } from '@material-ui/core';
import { Logo } from '../common/Logo';
import { useUpdateAuth } from '../auth/helpers';
import { useRecoilValue } from 'recoil';
import { authState } from '../auth/authState';

export const AppTourWelcome: React.FC = memo(() => {
  const { token, hasDoneWelcomeTour } = useRecoilValue(authState) || {}
  const [updateAuth] = useUpdateAuth()
  const show = !hasDoneWelcomeTour && !!token
  const styles = useStyles();
  const theme = useTheme()

  return (
    <Tour
      unskippable
      id="AppTourWelcome"
      show={show}
      onClose={() => {
        updateAuth({ hasDoneWelcomeTour: true })
      }}
    >
      <Step
        id="AppTourWelcome"
        number={1}
        content={(
          <Box className={styles.slide1}>
            <Logo />
            <div style={{
              display: 'flex',
              flexFlow: 'column',
              alignItems: 'center',
              maxWidth: theme.custom.maxWidthCenteredContent,
              width: '80%',
              paddingTop: theme.spacing(2)
            }}>
              <img src={FteCoverAsset} alt="cover" style={{
                width: '80%',
                objectFit: 'contain',
                paddingBottom: theme.spacing(2)
              }} />
              <Typography >Welcome and thank you for using the app. oboku is under heavy development so bugs are to be expected</Typography>
            </div>
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
    padding: theme.spacing(2),
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