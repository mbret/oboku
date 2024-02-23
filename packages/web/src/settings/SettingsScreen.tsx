import { ComponentProps, memo, useState } from "react"
import {
  CheckCircleRounded,
  RadioButtonUncheckedOutlined
} from "@mui/icons-material"
import { TopBarNavigation } from "../navigation/TopBarNavigation"
import {
  Box,
  Drawer,
  List,
  ListItem,
  ListItemSecondaryAction,
  ListItemText,
  ListSubheader
} from "@mui/material"
import { localSettingsStateSignal, useLocalSettingsState } from "./states"

type LocalSettings = ReturnType<typeof useLocalSettingsState>

const fullScreenModes: Record<
  LocalSettings["readingFullScreenSwitchMode"],
  string
> = {
  automatic: "Automatic (based on device)",
  always: "Always",
  never: "Never"
}
const showCollectionWithProtectedContentLabels: Record<
  LocalSettings["showCollectionWithProtectedContent"],
  string
> = {
  unlocked: "Only when protected content are unlocked",
  hasNormalContent: "If the collection has non protected content as well"
}

export const SettingsScreen = memo(() => {
  const localSettings = useLocalSettingsState()
  const [isDrawerOpened, setIsDrawerOpened] = useState(false)
  const [isShowCollectionDrawerOpened, setIsShowCollectionDrawerOpened] =
    useState(false)

  return (
    <>
      <Box display="flex" flex={1} overflow="scroll" flexDirection="column">
        <TopBarNavigation title={"Settings"} />
        <List>
          <ListSubheader disableSticky>General</ListSubheader>
          <ListItem>
            <ListItemText primary="Language" secondary={navigator.language} />
          </ListItem>
          <ListItem
            button
            onClick={() => {
              localSettingsStateSignal.setValue((old) => ({
                ...old,
                hideDirectivesFromCollectionName:
                  !old.hideDirectivesFromCollectionName
              }))
            }}
          >
            <ListItemText
              primary="Automatically hide directives from collection name"
              secondary={`Will display a collection named "My collection [oboku~foo]" as "My collection"`}
            />
            <ListItemSecondaryAction>
              {localSettings.hideDirectivesFromCollectionName ? (
                <CheckCircleRounded />
              ) : (
                <RadioButtonUncheckedOutlined />
              )}
            </ListItemSecondaryAction>
          </ListItem>
        </List>
        <List>
          <ListSubheader disableSticky>
            Privacy & sensitive content
          </ListSubheader>
          <ListItem
            button
            onClick={() => {
              localSettingsStateSignal.setValue((old) => ({
                ...old,
                showSensitiveDataSources: !old.showSensitiveDataSources
              }))
            }}
          >
            <ListItemText
              primary="Show sensitive data sources"
              secondary="Some data sources deal with sensitive content or website and are hidden by default"
            />
            <ListItemSecondaryAction>
              {localSettings.showSensitiveDataSources ? (
                <CheckCircleRounded />
              ) : (
                <RadioButtonUncheckedOutlined />
              )}
            </ListItemSecondaryAction>
          </ListItem>
          <ListItem
            button
            onClick={() => {
              setIsShowCollectionDrawerOpened(true)
            }}
          >
            <ListItemText
              primary="Show collections with protected content"
              secondary={
                showCollectionWithProtectedContentLabels[
                  localSettings.showCollectionWithProtectedContent
                ]
              }
            />
          </ListItem>
          <ListItem
            button
            onClick={() => {
              localSettingsStateSignal.setValue((old) => ({
                ...old,
                unBlurWhenProtectedVisible: !old.unBlurWhenProtectedVisible
              }))
            }}
          >
            <ListItemText primary="Unblur cover when protected content is visible" />
            <ListItemSecondaryAction>
              {localSettings.unBlurWhenProtectedVisible ? (
                <CheckCircleRounded />
              ) : (
                <RadioButtonUncheckedOutlined />
              )}
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
              secondary={
                fullScreenModes[localSettings.readingFullScreenSwitchMode]
              }
            />
          </ListItem>
        </List>
        <List
          subheader={
            <ListSubheader disableSticky>
              eReader devices (e-ink screens)
            </ListSubheader>
          }
        >
          <ListItem
            button
            onClick={() => {
              localSettingsStateSignal.setValue((old) => ({
                ...old,
                useOptimizedTheme: !old.useOptimizedTheme
              }))
            }}
          >
            <ListItemText
              primary="Optimized theme"
              secondary="Will use a more adapted app design (black & white, more contrast, ...)"
            />
            <ListItemSecondaryAction>
              {localSettings.useOptimizedTheme ? (
                <CheckCircleRounded />
              ) : (
                <RadioButtonUncheckedOutlined />
              )}
            </ListItemSecondaryAction>
          </ListItem>
        </List>
      </Box>
      <Drawer
        open={isDrawerOpened}
        onClose={() => setIsDrawerOpened(false)}
        anchor="bottom"
      >
        <List>
          {(
            Object.keys(
              fullScreenModes
            ) as LocalSettings["readingFullScreenSwitchMode"][]
          ).map((text) => (
            <ListItem
              button
              key={text}
              onClick={() => {
                localSettingsStateSignal.setValue((old) => ({
                  ...old,
                  readingFullScreenSwitchMode: text
                }))
                setIsDrawerOpened(false)
              }}
            >
              <ListItemText primary={fullScreenModes[text]} />
            </ListItem>
          ))}
        </List>
      </Drawer>
      <MultipleChoiceDrawer
        open={isDrawerOpened}
        onClose={() => setIsDrawerOpened(false)}
        onChoiceSelect={(value) => {
          localSettingsStateSignal.setValue((old) => ({
            ...old,
            readingFullScreenSwitchMode: value
          }))
          setIsDrawerOpened(false)
        }}
        selected={localSettings.readingFullScreenSwitchMode}
        anchor="bottom"
        choices={(
          Object.keys(
            fullScreenModes
          ) as LocalSettings["readingFullScreenSwitchMode"][]
        ).map((key) => ({ value: key, label: fullScreenModes[key] }))}
      />
      <MultipleChoiceDrawer
        open={isShowCollectionDrawerOpened}
        onClose={() => setIsShowCollectionDrawerOpened(false)}
        onChoiceSelect={(value) => {
          localSettingsStateSignal.setValue((old) => ({
            ...old,
            showCollectionWithProtectedContent: value
          }))
          setIsShowCollectionDrawerOpened(false)
        }}
        anchor="bottom"
        selected={localSettings.showCollectionWithProtectedContent}
        choices={(
          Object.keys(
            showCollectionWithProtectedContentLabels
          ) as LocalSettings["showCollectionWithProtectedContent"][]
        ).map((key) => ({
          value: key,
          label: showCollectionWithProtectedContentLabels[key]
        }))}
      />
    </>
  )
})

const MultipleChoiceDrawer = <Choice extends { value: string; label: string }>({
  choices,
  onChoiceSelect,
  selected,
  ...rest
}: {
  choices: Choice[]
  onChoiceSelect: (value: Choice["value"]) => void
  selected: Choice["value"]
} & ComponentProps<typeof Drawer>) => {
  return (
    <Drawer {...rest}>
      <List>
        {choices.map(({ value, label }) => (
          <ListItem
            button
            key={value}
            onClick={(e) => {
              onChoiceSelect(value)
            }}
          >
            <ListItemText
              primary={label}
              {...(selected === value && {
                secondary: `selected`
              })}
            />
          </ListItem>
        ))}
      </List>
    </Drawer>
  )
}
