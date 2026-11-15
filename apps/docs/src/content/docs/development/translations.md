---
title: "Translations"
---

The web app shows its interface in the user's language with [Lingui](https://lingui.dev). English is the source language. `apps/web/src/i18n/supportedLocales.ts` lists the supported languages: English and French.

## Writing a translatable string

Write the English text in the component, inside a Lingui macro:

- Use `t` from `useLingui()` for a string, such as a prop: ``primary={t`Keep screen on`}``.
- Use `<Trans>` for text in JSX: `<Trans>Reading</Trans>`.
- Use `msg` for a label in a table outside a component, as in `themeOptions.ts`. `ListItemSelect` translates the labels of its choices. In other components, translate the label where it renders, with `i18n._(label)` from `useLingui()`.

Import `useLingui` and `Trans` from `@lingui/react/macro`, and `msg` from `@lingui/core/macro`. The Lingui Vite plugin turns the macros into runtime calls before React Compiler runs.

During render, translate through `useLingui()`. Do not use the `i18n` object that `@lingui/core` exports. React Compiler reuses a computed value until one of its inputs changes. When the language changes, `useLingui()` returns new `t` and `i18n` values, but the exported `i18n` stays the same object. Text from it stays in the language of the first render.

Outside render, for example in a stream or a mutation callback, use `t` from `@lingui/core/macro`. It reads the language that is active when the code runs.

Lingui makes each message's id from its English text, so the same English text in two places is one message with one translation. If the same English text needs two translations, give each one a context: ``t({ message: "Light", context: "theme" })``.

## Updating the catalogs

The catalogs are the PO files in `apps/web/src/i18n/locales/`, one for each language. After you add, change or remove a string, run:

```bash
pnpm extract:messages
```

The command adds each new string to every catalog. The English catalog holds the source text as the translation, and the other catalogs get an empty translation. The command also removes the strings that the code no longer uses.

Write the translations in the PO file of each other language. Commit the catalogs with the code. CI fails when the catalogs differ from the output of the command.

If a translation is empty, the app shows the English text.

## Adding a language

1. Add the language to `supportedLocales` in `apps/web/src/i18n/supportedLocales.ts`.
2. Run `pnpm extract:messages` to create its PO file.
3. Add its catalog to `catalogLoaders` in `apps/web/src/i18n/activateLocale.ts`. Until you do, the type check fails.
4. Write the translations in the new PO file.

## Choosing the language

The app uses the first language in the browser's language list that oboku supports. If the list has none, the app uses English. The app loads the catalog of that language before its first render, and sets the page's `lang` attribute to it.

## Testing a translated component

In tests and in development, `useLingui()` throws outside `I18nProvider`. Call `await activateLocale("en")`, then render the component inside `I18nProvider`, as in `SettingsList.test.tsx`. With English active, queries find elements by their English text.
