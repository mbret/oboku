import i18n from "i18next";
import { initReactI18next } from "react-i18next";
import LanguageDetector from 'i18next-browser-languagedetector'
import Backend from "i18next-http-backend"

i18n
  // load translation using http -> see /public/locales
  // learn more: https://github.com/i18next/i18next-http-backend
  .use(Backend)
  .use(LanguageDetector)
  .use(initReactI18next) // passes i18n down to react-i18next
  .init({
    // lng: navigator.language,
    fallbackLng: 'en',
    keySeparator: false, // we do not use keys in form messages.welcome
    interpolation: {
      escapeValue: false // react already safes from xss
    }
  }, (error) => {
    error && console.error(error)
  });

// @ts-ignore
window.i18n = i18n

export {
  i18n
}