---
title: "Enable features"
---

## Allow Google Sign In method

Set the Google client ID in the admin panel. See [Google](/self-hosting/configuration/google).

## Enable Google Drive support

:::tip
Let you add books and datasources from google drive
:::

Set the Google client ID and API key in the admin panel, with the Google Picker API enabled for the key. See [Google](/self-hosting/configuration/google).

## Enable Google Book Metadata

:::tip
Adds Google Books to the catalogs oboku looks books up in
:::

oboku completes a book's metadata from online catalogs. Open Library and Project Gutenberg need no configuration. To look books up in Google Books too, set the Google API key in the admin panel, with the Books API enabled for it. See [Google](/self-hosting/configuration/google).

Requests to Open Library and Project Gutenberg identify themselves as oboku, including the ones your server makes.

## Enable ComicVine support

:::tip
Will use comic vine API to enrich metadata
:::

You need to provide one more env variable:

* `COMICVINE_API_KEY`: Create a new API key at [https://comicvine.gamespot.com/api/](https://comicvine.gamespot.com/api/)

## Enable Amazon s3 storage for covers

:::tip
Let you store and retrieve covers from s3 rather than file system.&#x20;
:::

You need to provide:

* `AWS_ACCESS_KEY_ID`: Create an amazon access key&#x20;
* `AWS_SECRET_ACCESS_KEY`: Then pass the secret key
* `COVERS_STORAGE_STRATEGY`: Set this value to `s3`
