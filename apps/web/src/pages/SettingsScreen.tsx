import { memo } from "react"
import { TopBarNavigation } from "../navigation/TopBarNavigation"
import { List, ListItem, ListItemText, ListSubheader } from "@mui/material"
import {
  localSettingsSignal,
  useLocalSettings,
} from "../settings/useLocalSettings"
import { ListItemSelect, ListItemSwitch } from "../common/lists"
import { Page } from "../common/Page"
import { themeOptions } from "../theme/themeOptions"
import { ReadingSettings } from "../settings/ReadingSettings"

type LocalSettings = ReturnType<typeof useLocalSettings>

const showCollectionWithProtectedContentLabels: Record<
  LocalSettings["showCollectionWithProtectedContent"],
  string
> = {
  unlocked: "Only when unlocked (safe)",
  hasNormalContent: "Yes (unsafe)",
}

const showCollectionWithProtectedContentChoices = (
  Object.keys(
    showCollectionWithProtectedContentLabels,
  ) as LocalSettings["showCollectionWithProtectedContent"][]
).map((value) => ({
  value,
  label: showCollectionWithProtectedContentLabels[value],
}))

export const SettingsScreen = memo(() => {
  const localSettings = useLocalSettings()

  return (
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
            localSettingsSignal.update((old) => ({
              ...old,
              hideDirectivesFromCollectionName:
                !old.hideDirectivesFromCollectionName,
            }))
          }}
          checked={localSettings.hideDirectivesFromCollectionName}
        />
      </List>
      <List>
        <ListSubheader disableSticky>Privacy & sensitive content</ListSubheader>
        <ListItemSelect
          primary="Show collections containing protected content"
          value={localSettings.showCollectionWithProtectedContent}
          choices={showCollectionWithProtectedContentChoices}
          onChange={(value) => {
            localSettingsSignal.update((old) => ({
              ...old,
              showCollectionWithProtectedContent: value,
            }))
          }}
        />
        <ListItemSwitch
          primary="Unblur cover when protected content is visible"
          onClick={() => {
            localSettingsSignal.update((old) => ({
              ...old,
              unBlurWhenProtectedVisible: !old.unBlurWhenProtectedVisible,
            }))
          }}
          checked={localSettings.unBlurWhenProtectedVisible}
        />
      </List>
      <List subheader={<ListSubheader disableSticky>Reading</ListSubheader>}>
        <ReadingSettings />
      </List>
      <List subheader={<ListSubheader disableSticky>Theming</ListSubheader>}>
        <ListItemSelect
          primary="Color mode"
          value={localSettings.themeMode ?? "system"}
          choices={themeOptions}
          onChange={(value) => {
            localSettingsSignal.update((old) => ({
              ...old,
              themeMode: value,
            }))
          }}
        />
      </List>
    </Page>
  )
})
