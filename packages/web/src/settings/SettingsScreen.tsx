import React, { useState } from 'react';
import { CheckCircleRounded, RadioButtonUncheckedOutlined } from '@material-ui/icons';
import { TopBarNavigation } from '../TopBarNavigation';
import { Box, Drawer, List, ListItem, ListItemSecondaryAction, ListItemText, ListSubheader } from '@material-ui/core';
import { useRecoilState, UnwrapRecoilValue } from 'recoil';
import { localSettingsState } from './states';

type LocalSettings = UnwrapRecoilValue<typeof localSettingsState>

const fullScreenModes: Record<LocalSettings['readingFullScreenSwitchMode'], string> = { automatic: 'Automatic (based on device)', always: 'Always', never: 'Never' }

export const SettingsScreen = () => {
  const [localSettings, setLocalSettings] = useRecoilState(localSettingsState)
  const [isDrawerOpened, setIsDrawerOpened] = useState(false)

  console.log(`debug SettingsScreen`, localSettings)
  
  return (
    <>
      <Box display="flex" flex={1} overflow="scroll" flexDirection="column">
        <TopBarNavigation title={'Settings'} />
        <List >
          <ListSubheader disableSticky>General</ListSubheader>
          <ListItem
            button
            onClick={() => {
              setLocalSettings(old => ({ ...old, hideDirectivesFromCollectionName: !old.hideDirectivesFromCollectionName }))
            }}
          >
            <ListItemText
              primary="Automatically hide directives from collection name"
              secondary={`Will display a collection named "My collection [oboku~foo]" as "My collection"`}
            />
            <ListItemSecondaryAction>
              {localSettings.hideDirectivesFromCollectionName ? <CheckCircleRounded /> : <RadioButtonUncheckedOutlined />}
            </ListItemSecondaryAction>
          </ListItem>
        </List>
        <List >
          <ListSubheader disableSticky>Privacy</ListSubheader>
          <ListItem
            button
            onClick={() => {
              setLocalSettings(old => ({ ...old, unblurWhenProtectedVisible: !old.unblurWhenProtectedVisible }))
            }}
          >
            <ListItemText primary="Unblur cover when protected content is visible" />
            <ListItemSecondaryAction>
              {localSettings.unblurWhenProtectedVisible ? <CheckCircleRounded /> : <RadioButtonUncheckedOutlined />}
            </ListItemSecondaryAction>
          </ListItem>
        </List>
        <List subheader={<ListSubheader disableSticky>Reading</ListSubheader>}>
          <ListItem
            button
            onClick={() => {
              setIsDrawerOpened(true)
            }}
          >
            <ListItemText
              primary="Automatically switch to fullscreen upon opening"
              secondary={fullScreenModes[localSettings.readingFullScreenSwitchMode]} />
          </ListItem>
        </List>
        <List subheader={<ListSubheader disableSticky>eReader devices (e-ink screens)</ListSubheader>}>
          <ListItem
            button
            onClick={() => {
              setLocalSettings(old => ({ ...old, useNavigationArrows: !old.useNavigationArrows }))
            }}
          >
            <ListItemText primary="Display list navigation arrows" secondary="Scrolling by clicking on a button can be more confortable with e-ink screens" />
            <ListItemSecondaryAction>
              {localSettings.useNavigationArrows ? <CheckCircleRounded /> : <RadioButtonUncheckedOutlined />}
            </ListItemSecondaryAction>
          </ListItem>
        </List>
      </Box >
      <Drawer open={isDrawerOpened} onClose={() => setIsDrawerOpened(false)} anchor="bottom">
        <List>
          {(Object.keys(fullScreenModes) as LocalSettings['readingFullScreenSwitchMode'][]).map((text) => (
            <ListItem button key={text} onClick={() => {
              setLocalSettings(old => ({ ...old, readingFullScreenSwitchMode: text }))
              setIsDrawerOpened(false)
            }}>
              <ListItemText primary={fullScreenModes[text]} />
            </ListItem>
          ))}
        </List>
      </Drawer>
    </>
  );
}