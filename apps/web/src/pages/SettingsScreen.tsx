import { memo } from "react"
import type { MessageDescriptor } from "@lingui/core"
import { msg } from "@lingui/core/macro"
import { useLingui } from "@lingui/react/macro"
import { TopBarNavigation } from "../navigation/TopBarNavigation"
import { capitalize, ListItem, ListItemText } from "@mui/material"
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
  MessageDescriptor
> = {
  unlocked: msg`Only when unlocked (safe)`,
  hasNormalContent: msg`Yes (unsafe)`,
}

const showCollectionWithProtectedContentChoices = (
  Object.keys(
    showCollectionWithProtectedContentLabels,
  ) as LocalSettings["showCollectionWithProtectedContent"][]
).map((value) => ({
  value,
  label: showCollectionWithProtectedContentLabels[value],
}))

export const SettingsScreen = memo(function SettingsScreen() {
  const { t, i18n } = useLingui()
  const localSettings = useLocalSettings()
  const activeLanguageName = capitalize(
    new Intl.DisplayNames([i18n.locale], { type: "language" }).of(
      i18n.locale,
    ) ?? i18n.locale,
  )

  return (
    <Page>
      <TopBarNavigation title={t`Settings`} />
      <PageContainer disableGutters>
        <PageSection title={t`General`}>
          <ListItem>
            <ListItemText
              primary={t`Language`}
              secondary={activeLanguageName}
            />
          </ListItem>
          <ListItemSwitch
            primary={t`Automatically hide directives from collection name`}
            secondary={t`Will display a collection named "My collection [oboku~foo]" as "My collection"`}
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
        <PageSection title={t`Privacy & sensitive content`}>
          <ListItemSelect
            primary={t`Show collections containing protected content`}
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
            primary={t`Unblur cover when protected content is visible`}
            onClick={() => {
              localSettingsSignal.update((old) => ({
                ...old,
                unBlurWhenProtectedVisible: !old.unBlurWhenProtectedVisible,
              }))
            }}
            checked={localSettings.unBlurWhenProtectedVisible}
          />
        </PageSection>
        <PageSection title={t`Reading`}>
          <ReadingSettings />
        </PageSection>
        <PageSection title={t`Theming`}>
          <ListItemSelect
            primary={t`Color mode`}
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
