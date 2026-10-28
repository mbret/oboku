---
title: "Enable features"
---

## Allow Google Sign In method

You need to provide one more env variable:

* `GOOGLE_CLIENT_ID`: Create a new OAuth 2.0 Client IDs in the google cloud console.

## Enable Google Drive support

:::tip
Let you add books and datasources from google drive
:::

You need to provide two more env variables

* `GOOGLE_CLIENT_ID`: You can use the same as for google sign in.&#x20;
* `GOOGLE_API_KEY`: You need to create a new API Keys credential in the google cloud console and  enable the following APIs:
  * Google Picker API

:::danger
The `GOOGLE_API_KEY` is public so make sure to apply enoughts constraints on it to prevent abuses
:::



## Enable Google Book Metadata

:::tip
Adds Google Books to the catalogs oboku looks books up in
:::

oboku completes a book's metadata from online catalogs. Open Library and Project Gutenberg need no configuration. To look books up in Google Books too, provide:

* `GOOGLE_API_KEY`: You need to create or update the API Keys credential in the google cloud console and  enable the following API
  * Books API

The API server calls Google Books with this key, so a key restricted to your website's address (HTTP referrers) fails those lookups. The server logs a failing catalog with its HTTP status on every refresh.

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
