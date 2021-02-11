import React, { memo } from 'react';
import { Step, Tour } from '../app-tour';
import FteCoverAsset from '../assets/fte-cover.svg'
import { Box, Typography, useTheme } from '@material-ui/core';
import { Logo } from '../common/Logo';
import { useRecoilState, useRecoilValue } from 'recoil';
import { authState } from '../auth/authState';
import { firstTimeExperienceState } from './firstTimeExperienceStates';
import { useCSS } from '../utils';

export const AppTourWelcome: React.FC = memo(() => {
  const [{ hasDoneWelcomeTour }, setFirstTimeExperienceState] = useRecoilState(firstTimeExperienceState)
  const { token } = useRecoilValue(authState) || {}
  const show = !hasDoneWelcomeTour && !!token
  const styles = useStyles();
  const theme = useTheme()

  return (
    <Tour
      unskippable
      id="AppTourWelcome"
      show={show}
      onClose={() => {
        setFirstTimeExperienceState(old => ({ ...old, hasDoneWelcomeTour: true }))
      }}
    >
      <Step
        id="AppTourWelcome"
        number={1}
        content={(
          <Box style={styles.slide1}>
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

const useStyles = () => {
  const theme = useTheme()

  return useCSS(() => ({
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
  }), [theme])
}