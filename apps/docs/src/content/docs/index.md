---
title: "Welcome"
description: oboku is a free, open-source ebook and comic reader that syncs your library from Google Drive, Dropbox, OneDrive, WebDAV, Synology, an OPDS catalog or your own server, and works with KOReader.
---

## What is oboku? { #what-is-oboku }

oboku is a reading app and a sync service for your books. Use the cloud version at [https://app.oboku.me/](https://app.oboku.me/), or host it yourself.

Your books stay where you store them: Google Drive, Dropbox, OneDrive, Synology Drive, a WebDAV server, an OPDS catalog, or the server itself when you self-host oboku. The app reads them from there, so you do not have to self-host oboku to use it. If your books are reachable over the network, the cloud version can sync them.

oboku does not own or organize your files, so you can share any of your folders with anyone. They sync from it as well. oboku does not handle permissions: you share the folder, and its credentials if it has some, with your friends.

The app works fully offline and has a strong focus on accessibility, such as e-ink devices.

:::note
If a feature you need is missing, request it. oboku is driven by its community.
:::

## Key features

- Read EPUB, comics, manga, PDF and plain text in one [reader](/guides/reader), offline once a book is downloaded. Bookmark pages, highlight passages and take notes, on every device of your account. See the [supported contents](/guides/supported-contents).
- Sync your books from the [providers](/guides/datasources) you already use, without uploading them to oboku.
- Organize your library with [collections and series](/guides/collections) and [tags](/guides/tags). oboku fills in the covers and the [metadata](/guides/metadata-sources).
- Track what you read, and search, sort and filter your library.
- Sync your reading position with KOReader and the other apps that support KOReader sync. oboku can be their [sync server](/guides/koreader-sync-server), and its reader can [sync with them](/guides/koreader-progress-sync).
- Browse your Google Drive and WebDAV books from KOReader and other reading apps through an [OPDS server](/guides/opds-servers).
- Hide [sensitive books](/guides/privacy-and-parental-secure-control) until you unlock them, and blur their covers.
- Compress the images of heavy comics and fix the identifiers of a book, then save it back to its source.
- Switch to e-ink mode for higher contrast and no animations.
- [Share a library](/guides/datasources#sharing-is-caring) with your friends: each of them gets a library of their own.
- [Self-host](/self-hosting/installation) the whole service with Docker.

## How do we compare to similar / alternative services { #how-do-we-compare-to-similar-alternative-services }

### [Stump](https://www.stumpapp.dev/)

Media server + Reading app. Stump has some capabilities to sync some reading state and potentially more in the future but is not designed to sync libraries outside of its self hosted server. It is also only self host.

### **BookFusion**

BookFusion is yet another cloud based book library which let you organize and read your own books. It does look similar to oboku in some of the aspects and could ultimately gives you the same experience. However there are some missing key features from BookFusion that are the very reason oboku exist:

- The service is paid. Oboku is and will stay free and open source.
- You have to upload your book to their server (or use calibre plugin). Oboku is meant to be used with any storage of your choice. We do not host any of your book files, we just synchronize them.
- The reading app is not e-ink friendly
- No offline support (at least on the web)
- Unfortunately quite closed since it's provided by a company as a paid product ultimately

### **Calibre Web**

Calibre Web is another similar project that was created many years ago and provide a also similar experience. It obviously provide a lot more of features at this time and you might want to give it a try as well. Most specifically if you are using calibre as your source of data. Although it is also a similar project here are some of the key differences:

- No offline support
- Not e-ink friendly
- Limited choice of source providers (Calibre and Kobo sync)
- It is a self hosted product and comes with the hassle of maintenance.

If you already run Calibre-Web, oboku can [sync the books of its OPDS catalog](/sync-providers/opds).

In no way oboku wishes to undermine calibre-web and I want to personally thanks [janeczku](https://github.com/janeczku) and all the contributors for making the calibre-web project.

:::note
Want to add your own app to help people find it or help differentiate it? Contact me to add it here. It's not a "who is best" contest but more of a starting point for users looking for what they need
:::
