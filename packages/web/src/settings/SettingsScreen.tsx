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
  ListItemButton,
  ListItemSecondaryAction,
  ListItemText,
  ListSubheader
} from "@mui/material"
import { localSettingsSignal, useLocalSettings } from "./states"

type LocalSettings = ReturnType<typeof useLocalSettings>

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
  unlocked: "Only when unlocked (safe)",
  hasNormalContent: "Yes (unsafe)"
}

export const SettingsScreen = memo(() => {
  const localSettings = useLocalSettings()
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
          <ListItemButton
            onClick={() => {
              localSettingsSignal.setValue((old) => ({
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
          </ListItemButton>
        </List>
        <List>
          <ListSubheader disableSticky>
            Privacy & sensitive content
          </ListSubheader>
          <ListItemButton
            onClick={() => {
              localSettingsSignal.setValue((old) => ({
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
          </ListItemButton>
          <ListItemButton
            onClick={() => {
              setIsShowCollectionDrawerOpened(true)
            }}
          >
            <ListItemText
              primary="Show collections containing protected content"
              secondary={
                showCollectionWithProtectedContentLabels[
                  localSettings.showCollectionWithProtectedContent
                ]
              }
            />
          </ListItemButton>
          <ListItemButton
            onClick={() => {
              localSettingsSignal.setValue((old) => ({
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
          </ListItemButton>
        </List>
        <List subheader={<ListSubheader disableSticky>Reading</ListSubheader>}>
          <ListItemButton
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
          </ListItemButton>
        </List>
        <List
          subheader={
            <ListSubheader disableSticky>
              eReader devices (e-ink screens)
            </ListSubheader>
          }
        >
          <ListItemButton
            onClick={() => {
              localSettingsSignal.setValue((old) => ({
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
          </ListItemButton>
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
            <ListItemButton
              key={text}
              onClick={() => {
                localSettingsSignal.setValue((old) => ({
                  ...old,
                  readingFullScreenSwitchMode: text
                }))
                setIsDrawerOpened(false)
              }}
            >
              <ListItemText primary={fullScreenModes[text]} />
            </ListItemButton>
          ))}
        </List>
      </Drawer>
      <MultipleChoiceDrawer
        open={isDrawerOpened}
        onClose={() => setIsDrawerOpened(false)}
        onChoiceSelect={(value) => {
          localSettingsSignal.setValue((old) => ({
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
          localSettingsSignal.setValue((old) => ({
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
          <ListItemButton
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
          </ListItemButton>
        ))}
      </List>
    </Drawer>
  )
}
