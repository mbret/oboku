---
title: "Translations"
---

The web app shows its interface in the user's language with [Lingui](https://lingui.dev). English is the source language. `apps/web/src/i18n/supportedLocales.ts` lists the other languages: French only, for now.

## Writing a translatable string

Write the English text in the component, inside a Lingui macro:

- `t` from `useLingui()` for a string, such as a prop: ``primary={t`Keep screen on`}``.
- `<Trans>` for text in JSX: `<Trans>Reading</Trans>`.
- `msg` for a label in a table declared outside a component, like `themeOptions.ts`. Translate the label where it renders, with `i18n._(label)` from `useLingui()`.

Import `useLingui` and `Trans` from `@lingui/react/macro`, and `msg` from `@lingui/core/macro`. The Lingui Vite plugin turns the macros into runtime calls before React Compiler runs.

Translate through `useLingui()` in a component, never through the `i18n` object that `@lingui/core` exports. React Compiler keeps a value until one of its inputs changes, and `useLingui()` gives new `t` and `i18n` values when the language changes. Text from the exported `i18n` stays in the first language.

Lingui generates each message's id from its English text, so the same English text in two places is one message with one translation.

## Updating the catalogs

The catalogs are the PO files in `apps/web/src/i18n/locales/`, one for each language. After you add, change or remove a string, run:

```bash
pnpm extract:messages
```

The command adds the new strings to every catalog with an empty translation, and removes the strings that the code no longer uses. Write the translations in each language's PO file, and commit the catalogs with the code. A string without a translation shows in English.

## Choosing the language

The app uses the first of the browser's preferred languages that oboku supports, else English. It loads that language's catalog before its first render.

## Testing a translated component

Render the component inside `I18nProvider`, after `activateLocale()`, like `ReadingSettings.test.tsx`. Tests that find elements by their English text keep working in English.
