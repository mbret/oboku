/**
 * Settings that are only kept for a user session on the device itself.
 */
import { signal, useSignalValue } from "reactjrx"
import { isShallowEqual } from "@oboku/shared"
import { useCallback, type DependencyList } from "react"

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
}

export const localSettingsSignal = signal<LocalSettings>({
  key: "localSettingsState",
  default: localSettingsDefaultValues,
})

export function useLocalSettings<Key extends keyof LocalSettings>(
  key: Key,
): Required<LocalSettings>[Key]
export function useLocalSettings<Key extends keyof LocalSettings>(
  keys: readonly Key[],
): Pick<Required<LocalSettings>, Key>
export function useLocalSettings(): LocalSettings
export function useLocalSettings(
  keyOrKeys?: keyof LocalSettings | readonly (keyof LocalSettings)[],
) {
  const keys: DependencyList =
    typeof keyOrKeys === "string" ? [keyOrKeys] : (keyOrKeys ?? [])

  const select = useCallback(
    (settings: LocalSettings) => {
      if (keyOrKeys === undefined) return settings

      if (typeof keyOrKeys === "string") {
        return settings[keyOrKeys] ?? localSettingsDefaultValues[keyOrKeys]
      }

      return Object.fromEntries(
        keyOrKeys.map(
          (key) =>
            [key, settings[key] ?? localSettingsDefaultValues[key]] as const,
        ),
      )
    },
    // The key list is itself the dependency array: React compares its elements,
    // so the selector stays stable without memoizing the array reference. Biome
    // only accepts a literal dependency array, hence the suppression.
    // biome-ignore lint/correctness/useExhaustiveDependencies: keys is the dependency list
    keys,
  )

  return useSignalValue(localSettingsSignal, select, isShallowEqual)
}
