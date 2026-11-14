---
title: "Google Account Connection"
---

Connecting your Google account lets oboku's server keep access to the Google Drive books you added to oboku, so that it can reach them without your browser. It reaches only the files you picked in Google's file picker or opened with oboku, never the rest of your Drive.

The connection is optional. Without it, oboku reaches Google Drive through your browser, as before.

## What it changes

Without the connection, oboku opens Google's sign-in window whenever it needs your Drive after Google's last sign-in expired, such as when you download a book. While connected, oboku asks its server for access instead, and the window no longer opens.

While connected, your [OPDS servers](/guides/opds-servers) list your Google Drive books, and reading apps download them through oboku's server.

Books added before August 2025 are the exception. oboku found them by browsing your Drive with a wider permission it no longer asks for, so its server cannot reach them yet. The first time you open one of them while connected, Google's file picker shows the book: select it to give oboku access to it. oboku then reaches it without asking again.

oboku reaches every Drive book with the connected account. Books you added with another Google account cannot be reached while you are connected: disconnect to reach them through Google's sign-in window again.

If oboku's server loses its access, because you removed oboku from your Google Account or Google expired its access, oboku tells you, opens Google's sign-in window as before, and shows your account as disconnected. Connect again to stop the window from opening.

## Connect

Open **Integrations > Google**, then tap **Connect**. In Google's window:

1. Choose the Google account you add your Drive books with. oboku reaches only the files picked with that account.
2. Allow every permission oboku asks for: your Drive files, and your email so the screen shows which account is connected.

The screen then shows the account and when you connected it.

:::note
oboku's server keeps the access Google gives it, encrypted. It never leaves the server.
:::

On a self-hosted oboku, **Connect** appears once the admin has set up Google, its client secret included. See [Google](/self-hosting/configuration/google).

## Disconnect

Tap **Disconnect your Google account**, then confirm. oboku's server forgets its access to your Drive, and your books stay in your library.

Google still lists oboku among the third-party apps of your Google Account, so oboku keeps working with Google in your browser. To remove its access entirely, remove oboku from [your Google Account's third-party connections](https://myaccount.google.com/connections).

## Connect again

Google gives oboku lasting access only once. After you disconnect, remove oboku from [your Google Account's third-party connections](https://myaccount.google.com/connections) first, then connect again. Otherwise oboku says it already has access to this account and was not given a lasting one.
