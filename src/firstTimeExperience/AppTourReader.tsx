import React, { memo } from 'react';
import { Step, Tour } from '../app-tour';
import { Box, Button, makeStyles, Typography, useTheme } from '@material-ui/core';
import { useHorizontalTappingZoneWidth } from '../reader/utils';
import { TouchAppRounded } from '@material-ui/icons';
import { useRecoilState } from 'recoil';
import { firstTimeExperienceState } from './firstTimeExperienceStates';

export const AppTourReader: React.FC = memo(() => {
  const [{ hasDoneReaderTour }, setFirstTimeExperienceState] = useRecoilState(firstTimeExperienceState)
  const theme = useTheme()
  const horizontalTappingZoneWidth = useHorizontalTappingZoneWidth()
  const show = !hasDoneReaderTour
  const styles = useStyles();

  return (
    <Tour
      unskippable
      id="AppTourReader"
      show={show}
      onClose={() => {
        setFirstTimeExperienceState(old => ({ ...old, hasDoneReaderTour: true }))
      }}
    >
      <Step
        id="AppTourReader"
        number={1}
        withButtons={false}
        content={({ onClose }) => (
          <Box className={styles.slide1}>
            {/* <Box style={{
              borderBottom: '1px dashed white',
              height: verticalTappingZoneHeight,
              width: '100%',
              display: 'flex',
              alignItems: 'center',
              flexFlow: 'column',
              justifyContent: 'center',
            }}>
              <Typography>Tap here to show the top menu</Typography>
              <TouchAppRounded />
            </Box> */}
            <Box style={{
              display: 'flex',
              flex: 1,
            }}>
              <Box style={{
                borderRight: '1px dashed white',
                height: '100%',
                width: horizontalTappingZoneWidth,
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
              }}>
                <TouchAppRounded />
              </Box>
              <Box style={{
                flex: 1,
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                textAlign: 'center',
                flexFlow: 'column',
                padding: theme.spacing(3),
              }}>
                <Box >
                  <Typography>Navigate through the book by tapping on the side of the screen</Typography>
                </Box>
                <Box mt={4}>
                  <TouchAppRounded /> <Typography>Tap in the middle to toggle top and bottom menu</Typography>
                </Box>
                <Box mt={4}>
                  <Button
                    variant="outlined"
                    size="large"
                    onClick={onClose}
                  >Got it</Button>
                </Box>
              </Box>
              <Box style={{
                borderLeft: '1px dashed white',
                height: '100%',
                width: horizontalTappingZoneWidth,
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
              }}>
                <TouchAppRounded />
              </Box>
            </Box>
            {/* <Box style={{
              borderTop: '1px dashed white',
              height: verticalTappingZoneHeight,
              width: '100%',
              display: 'flex',
              flexFlow: 'column',
              alignItems: 'center',
              justifyContent: 'center',
            }}>
              <TouchAppRounded />
              <Typography>Tap here to show reading controls menu</Typography>
            </Box> */}
          </Box>
        )}
      />
    </Tour>
  );
});

const useStyles = makeStyles((theme) => ({
  slide1: {
    boxSizing: 'border-box',
    color: '#fff',
    display: 'flex',
    flex: 1,
    flexFlow: 'column',
  },
}));