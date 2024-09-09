import i18n from "i18next"
import { initReactI18next } from "react-i18next"
import LanguageDetector from "i18next-browser-languagedetector"
import * as translations from "./resources"

const resources = Object.keys(translations).reduce((acc, key) => {
  acc[key] = {
    translation: translations[key]
  }

  return acc
}, {})

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
