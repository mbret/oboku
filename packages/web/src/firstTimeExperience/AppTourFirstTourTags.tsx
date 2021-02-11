import React, { memo } from 'react';
import { Step, Tour } from '../app-tour';
import TagSvg from '../assets/undraw_schedule_pnbk.svg'
import { Link, Typography, useTheme } from '@material-ui/core';
import { useRecoilState, useRecoilValue } from 'recoil';
import { isTagsTourOpenedState, firstTimeExperienceState } from './firstTimeExperienceStates';
import { useCSS } from '../utils';

export const AppTourFirstTourTags: React.FC = memo(() => {
  const isTagsTourOpened = useRecoilValue(isTagsTourOpenedState)
  const [{ hasDoneFirstTimeTags }, setFirstTimeExperienceState] = useRecoilState(firstTimeExperienceState)
  const show = !hasDoneFirstTimeTags && isTagsTourOpened
  const styles = useStyles();
  const theme = useTheme()

  return (
    <Tour
      unskippable
      id="AppTourFirstTourTags"
      show={show}
      onClose={() => {
        setFirstTimeExperienceState(old => ({ ...old, hasDoneFirstTimeTags: true }))
      }}
    >
      <Step
        id="AppTourFirstTourTags"
        number={1}
        content={(
          <div style={styles.slide1}>
            <div style={{
              display: 'flex',
              flexFlow: 'column',
              alignItems: 'center',
              maxWidth: theme.custom.maxWidthCenteredContent,
              width: '80%',
              paddingTop: theme.spacing(2)
            }}>
              <img src={TagSvg} alt="cover" style={{
                width: '100%',
                objectFit: 'contain',
                paddingBottom: theme.spacing(2)
              }} />
              <Typography >
                You can use tags to better organize and search through your books. Group them by same interests
                or use tags behaviors to blur covers, protect access and more to customize your content accessibility.
                More information in the <Link href="https://docs.oboku.me" target="__blank">doc</Link>
              </Typography>
            </div>
          </div>
        )}
      />
    </Tour>
  );
});

const useStyles = () => {
  const theme = useTheme()

  return useCSS(() => ({
    coverContainer: {
      alignSelf: 'center',
      alignItems: 'center',
      justifyContent: 'center',
    },
    slide1: {
      padding: theme.spacing(2),
      boxSizing: 'border-box',
      textAlign: 'center',
      color: '#fff',
      display: 'flex',
      flex: 1,
      flexFlow: 'column',
      justifyContent: 'center',
      alignItems: 'center',
    },
  }), [theme])
}