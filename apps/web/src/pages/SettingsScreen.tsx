import { type ComponentProps, memo, useId, useState } from "react"
import { TopBarNavigation } from "../navigation/TopBarNavigation"
import {
  Drawer,
  List,
  ListItem,
  ListItemButton,
  ListItemText,
  ListSubheader,
} from "@mui/material"
import { localSettingsSignal, useLocalSettings } from "../settings/states"
import { ListItemSwitch } from "../common/ListItemSwitch"
import { Page } from "../common/Page"
import { themeOptions } from "../theme/themeOptions"

type LocalSettings = ReturnType<typeof useLocalSettings>

const fullScreenModes: Record<
  LocalSettings["readingFullScreenSwitchMode"],
  string
> = {
  automatic: "Automatic (based on device)",
  always: "Always",
  never: "Never",
}

const showCollectionWithProtectedContentLabels: Record<
  LocalSettings["showCollectionWithProtectedContent"],
  string
> = {
  unlocked: "Only when unlocked (safe)",
  hasNormalContent: "Yes (unsafe)",
}

export const SettingsScreen = memo(() => {
  const localSettings = useLocalSettings()
  const [isDrawerOpened, setIsDrawerOpened] = useState(false)
  const [isShowCollectionDrawerOpened, setIsShowCollectionDrawerOpened] =
    useState(false)
  const [isThemeDrawerOpened, setIsThemeDrawerOpened] = useState(false)
  const sensitiveDataSourcesId = useId()
  const hideDirectivesFromCollectionNameId = useId()
  const unBlurWhenProtectedVisibleId = useId()

  return (
    <>
      <Page>
        <TopBarNavigation title={"Settings"} />
        <List>
          <ListSubheader disableSticky>General</ListSubheader>
          <ListItem>
            <ListItemText primary="Language" secondary={navigator.language} />
          </ListItem>
          <ListItemSwitch
            primary="Automatically hide directives from collection name"
            secondary={`Will display a collection named "My collection [oboku~foo]" as "My collection"`}
            onClick={() => {
              localSettingsSignal.setValue((old) => ({
                ...old,
                hideDirectivesFromCollectionName:
                  !old.hideDirectivesFromCollectionName,
              }))
            }}
            checked={localSettings.hideDirectivesFromCollectionName}
            id={hideDirectivesFromCollectionNameId}
          />
        </List>
        <List>
          <ListSubheader disableSticky>
            Privacy & sensitive content
          </ListSubheader>
          <ListItemSwitch
            primary="Show sensitive data sources"
            secondary="Some data sources deal with sensitive content or website and are hidden by default"
            onClick={() => {
              localSettingsSignal.setValue((old) => ({
                ...old,
                showSensitiveDataSources: !old.showSensitiveDataSources,
              }))
            }}
            checked={localSettings.showSensitiveDataSources}
            id={sensitiveDataSourcesId}
          />
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

          <ListItemSwitch
            primary="Unblur cover when protected content is visible"
            onClick={() => {
              localSettingsSignal.setValue((old) => ({
                ...old,
                unBlurWhenProtectedVisible: !old.unBlurWhenProtectedVisible,
              }))
            }}
            checked={localSettings.unBlurWhenProtectedVisible}
            id={unBlurWhenProtectedVisibleId}
          />
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
        <List subheader={<ListSubheader disableSticky>Theming</ListSubheader>}>
          <ListItemButton
            onClick={() => {
              setIsThemeDrawerOpened(true)
            }}
          >
            <ListItemText
              primary="Color mode"
              secondary={
                themeOptions.find(
                  (option) => option.value === localSettings.themeMode,
                )?.label
              }
            />
          </ListItemButton>
        </List>
      </Page>
      <Drawer
        open={isDrawerOpened}
        onClose={() => setIsDrawerOpened(false)}
        anchor="bottom"
      >
        <List>
          {(
            Object.keys(
              fullScreenModes,
            ) as LocalSettings["readingFullScreenSwitchMode"][]
          ).map((text) => (
            <ListItemButton
              key={text}
              onClick={() => {
                localSettingsSignal.setValue((old) => ({
                  ...old,
                  readingFullScreenSwitchMode: text,
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
            readingFullScreenSwitchMode: value,
          }))
          setIsDrawerOpened(false)
        }}
        selected={localSettings.readingFullScreenSwitchMode}
        anchor="bottom"
        choices={(
          Object.keys(
            fullScreenModes,
          ) as LocalSettings["readingFullScreenSwitchMode"][]
        ).map((key) => ({ value: key, label: fullScreenModes[key] }))}
      />
      <MultipleChoiceDrawer
        open={isThemeDrawerOpened}
        onClose={() => setIsThemeDrawerOpened(false)}
        onChoiceSelect={(value) => {
          localSettingsSignal.update((old) => ({
            ...old,
            themeMode: value,
          }))
          setIsThemeDrawerOpened(false)
        }}
        selected={localSettings.themeMode}
        anchor="bottom"
        choices={themeOptions}
      />
      <MultipleChoiceDrawer
        open={isShowCollectionDrawerOpened}
        onClose={() => setIsShowCollectionDrawerOpened(false)}
        onChoiceSelect={(value) => {
          localSettingsSignal.setValue((old) => ({
            ...old,
            showCollectionWithProtectedContent: value,
          }))
          setIsShowCollectionDrawerOpened(false)
        }}
        anchor="bottom"
        selected={localSettings.showCollectionWithProtectedContent}
        choices={(
          Object.keys(
            showCollectionWithProtectedContentLabels,
          ) as LocalSettings["showCollectionWithProtectedContent"][]
        ).map((key) => ({
          value: key,
          label: showCollectionWithProtectedContentLabels[key],
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
            onClick={(_e) => {
              onChoiceSelect(value)
            }}
          >
            <ListItemText
              primary={label}
              {...(selected === value && {
                secondary: `selected`,
              })}
            />
          </ListItemButton>
        ))}
      </List>
    </Drawer>
  )
}
