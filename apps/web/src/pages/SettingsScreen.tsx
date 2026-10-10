import { memo } from "react"
import { TopBarNavigation } from "../navigation/TopBarNavigation"
import { ListItem, ListItemText } from "@mui/material"
import {
  localSettingsSignal,
  useLocalSettings,
} from "../settings/useLocalSettings"
import { ListItemSelect, ListItemSwitch } from "../common/lists"
import { Page } from "../common/Page"
import { themeOptions } from "../theme/themeOptions"
import { ReadingSettings } from "../settings/ReadingSettings"
import { PageContainer } from "../common/PageContainer"
import { PageSection } from "../common/PageSection"

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
      <PageContainer disableGutters>
        <PageSection title="General">
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
        </PageSection>
        <PageSection title="Privacy & sensitive content">
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
        </PageSection>
        <PageSection title="Reading">
          <ReadingSettings />
        </PageSection>
        <PageSection title="Theming">
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
        </PageSection>
      </PageContainer>
    </Page>
  )
})
