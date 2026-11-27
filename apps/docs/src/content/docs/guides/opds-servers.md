---
title: "OPDS Servers"
---

An OPDS server turns your oboku library into a catalog that KOReader and other reading apps can browse. Each server serves its catalog in OPDS 1.2 and in OPDS 2.0, at two addresses. You can create several, each with its own addresses and password, for example one per device.

## What a catalog lists

A catalog lists the books of your library that oboku's server can reach on its own:

- books oboku reads from Google Drive, while your [Google account is connected](/guides/google-account-connection);
- books oboku reads from a WebDAV server, while their [connector is connected](/guides/connectors#connect-a-connector).

Reading apps download them through oboku's server, which reaches each source with its connection. Without a connection, catalogs are empty. A connector you edit, or whose password you change, stops serving its books until you connect it again.

The **Integrations > OPDS servers** screen shows these sources in three groups:

- **Sources set up**: your connected Google account and each connected WebDAV connector. Catalogs list their books.
- **Sources available**: the kinds of sources catalogs serve, Google Drive and WebDAV. Tap one to connect your Google account, or to add and connect a WebDAV connector.
- **Sources not available yet**: the kinds of sources that catalogs cannot list yet.

Each book comes with the cover oboku shows for it. Covers do not count towards the download quota. A catalog leaves out:

- books under a [protected tag](/guides/privacy-and-parental-secure-control#protected-contents), even while your library is unlocked;
- books you marked not interested;
- books oboku reads from another source, such as Dropbox or Synology Drive, or from a WebDAV connector that is not connected.

A catalog opens on two entries, each listing 50 items per page:

- **All books**: every book it lists, newest first.
- **Shelves**: your [shelves](/guides/collections), from A to Z, as in the app's **Shelves** tab, each with its books from A to Z. It leaves out a shelf holding a book under a protected tag, and shelves without a book the catalog lists.

Some listed books cannot be downloaded yet:

- Books added before August 2025: oboku's server reaches them once you open them in oboku while connected and select them in Google's file picker. See [What it changes](/guides/google-account-connection#what-it-changes).
- Books added with another Google account than the connected one: oboku reaches Drive with one account only.
- Books on a WebDAV server that does not state a file's size: oboku's server only downloads a file whose size the server states.

If a WebDAV server refuses the connector's password when a reading app downloads one of its books, oboku's server forgets it, and the connector's books leave the catalog until you connect it again.

## Monthly download quota

Reading apps download books through oboku's server, and so do books from a [WebDAV](/sources/webdav#use-obokus-server-as-a-proxy) or [OPDS](/sources/opds#use-obokus-server-as-a-proxy) connector that uses it as a proxy. Each instance has a monthly quota on what its server sends, for all users together. Each user also has their own quota, 5% of it by default. A download that would pass either quota fails with "too many requests" until the next month (UTC). Browsing the catalog still works.

**Profile > Quotas** shows how much of your quota and of the quota of all users is used this month, and when both start over. The **OPDS servers** screen links to it. The instance's administrator sets both from the [admin panel](/self-hosting/admin#proxied-download-quota): 500 GB a month by default, 5% of it per user.

## Create a server

In oboku, open **Integrations > OPDS servers** and tap **Create a server**. oboku names the new server with a few random words, and the screen shows the values a reading app needs:

- **OPDS 1.2 catalog URL**: your oboku API address followed by `/opds/` and the server's words, such as `/opds/calm-snails-dream`. Copy it from the screen rather than typing it from memory.
- **OPDS 2.0 catalog URL**: the same address followed by `/v2`.
- **Username**: the email of your oboku account.
- **Password**: the generated password. It is shown only once: oboku keeps nothing but a hash of it. Lost it? Generate a new one.

:::note
The password is not your oboku password and opens nothing but the server's catalog.
:::

Each instance caps how many servers an account can have, 10 by default. Its administrator sets the cap from the [admin panel](/self-hosting/admin#opds-servers).

## Set up a reading app { #set-up-a-reading-app }

In KOReader:

1. In the file browser, open the search menu (the magnifying glass), then **OPDS catalog**.
2. Tap **+** at the top left, name the catalog, then enter the catalog URL, username and password.

Other reading apps ask for the same three values: a catalog URL, the username and the password. Give the OPDS 1.2 catalog URL to apps that read OPDS 1, and the OPDS 2.0 one to apps that read OPDS 2.0.

## Manage your servers

Each server on the **Integrations > OPDS servers** screen has three actions:

- **Rename** changes the server's name. The catalog URLs stay the same.
- **Generate a new password** replaces the password. Apps signed in with the previous one cannot open the catalog until you sign them in again.
- **Delete** removes the server. Apps signed in to it can no longer open its catalog.

Deleting your account deletes its servers too.
