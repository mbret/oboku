import i18n from "i18next"
import { initReactI18next } from "react-i18next"
import LanguageDetector from "i18next-browser-languagedetector"
import * as translations from "./resources"

const translationKeys = Object.keys(
  translations
) as (keyof typeof translations)[]

const resources = translationKeys.reduce(
  (acc, key) => {
    acc[key] = {
      translation: translations[key]
    }

    return acc
  },
  {} as Record<
    (typeof translationKeys)[number],
    { translation: Record<string, unknown> }
  >
)

i18n
  .use(LanguageDetector)
  .use(initReactI18next) // passes i18n down to react-i18next
  .init(
    {
      // lng: navigator.language,
      fallbackLng: "en",
      keySeparator: false, // we do not use keys in form messages.welcome
      interpolation: {
        escapeValue: false // react already safes from xss
      },
      resources
    },
    (error) => {
      error && console.error(error)
    }
  )
