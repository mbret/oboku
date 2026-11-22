/**
 * Settings that are only kept for a user session on the device itself.
 */
import { signal, useSignalValue } from "reactjrx"
import { isShallowEqual } from "@oboku/shared"
import type { CoreInputSettings, Theme } from "@prose-reader/core"

import type { ThemeProviderProps } from "@mui/material"

type ThemeMode = ThemeProviderProps["defaultMode"]

export type LocalSettings = {
  readingFullScreenSwitchMode: "automatic" | "always" | "never"
  unBlurWhenProtectedVisible: boolean
  hideDirectivesFromCollectionName: boolean
  showCollectionWithProtectedContent: "unlocked" | "hasNormalContent"
  themeMode?: ThemeMode | "e-ink"
  readerFloatingTime?: "bottom" | "off"
  readerFloatingProgress?: "bottom" | "off"
  readerWakeLockEnabled?: boolean
  /** `null` while this device has no value of its own: see `useReaderSettings`. */
  readerSpreadMode?: CoreInputSettings["spreadMode"] | null
  /** `null` while this device has no value of its own: see `useReaderSettings`. */
  readerFontScale?: number | null
  /** `null` while this device has no value of its own: see `useReaderSettings`. */
  readerTheme?: Theme | null
}

export const localSettingsDefaultValues: Required<LocalSettings> = {
  readingFullScreenSwitchMode: import.meta.env.DEV ? "never" : "automatic",
  unBlurWhenProtectedVisible: false,
  hideDirectivesFromCollectionName: true,
  showCollectionWithProtectedContent: "unlocked",
  /**
   * @important
   * As long as a profile is not loaded, the app will default to system mode
   */
  themeMode: "system",
  readerFloatingTime: "bottom",
  readerFloatingProgress: "bottom",
  readerWakeLockEnabled: true,
  readerSpreadMode: null,
  readerFontScale: null,
  readerTheme: null,
}

export const localSettingsSignal = signal<LocalSettings>({
  key: "localSettingsState",
  default: localSettingsDefaultValues,
})

type LocalSettingsKey = keyof LocalSettings

type LocalSettingsSelector = (settings: LocalSettings) => unknown

function selectAllLocalSettings(settings: LocalSettings) {
  return settings
}

function readLocalSetting(settings: LocalSettings, key: LocalSettingsKey) {
  return settings[key] ?? localSettingsDefaultValues[key]
}

const selectorsBySelection = new Map<string, LocalSettingsSelector>()

function createLocalSettingsSelector(
  keyOrKeys: LocalSettingsKey | readonly LocalSettingsKey[],
): LocalSettingsSelector {
  if (typeof keyOrKeys === "string") {
    return function selectLocalSetting(settings) {
      return readLocalSetting(settings, keyOrKeys)
    }
  }

  const keys = [...keyOrKeys]

  return function selectLocalSettings(settings) {
    return Object.fromEntries(
      keys.map((key) => [key, readLocalSetting(settings, key)] as const),
    )
  }
}

/**
 * Returns the same selector for every call with the same key or keys, so a
 * caller passing an inline array literal does not hand `useSignalValue` a new
 * selector on each render.
 */
function getLocalSettingsSelector(
  keyOrKeys?: LocalSettingsKey | readonly LocalSettingsKey[],
): LocalSettingsSelector {
  if (keyOrKeys === undefined) return selectAllLocalSettings

  const selection = JSON.stringify(keyOrKeys)
  const cachedSelector = selectorsBySelection.get(selection)

  if (cachedSelector) return cachedSelector

  const selector = createLocalSettingsSelector(keyOrKeys)

  selectorsBySelection.set(selection, selector)

  return selector
}

export function useLocalSettings<Key extends LocalSettingsKey>(
  key: Key,
): Required<LocalSettings>[Key]
export function useLocalSettings<Key extends LocalSettingsKey>(
  keys: readonly Key[],
): Pick<Required<LocalSettings>, Key>
export function useLocalSettings(): LocalSettings
export function useLocalSettings(
  keyOrKeys?: LocalSettingsKey | readonly LocalSettingsKey[],
) {
  return useSignalValue(
    localSettingsSignal,
    getLocalSettingsSelector(keyOrKeys),
    isShallowEqual,
  )
}
