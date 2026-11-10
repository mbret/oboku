---
title: "Google"
---

oboku uses one Google Cloud project for Google sign-in, Google Drive and Google Books lookups. You enter its settings in the admin panel, under **Providers > Google**.

## Create the OAuth client

1. In the [Google Cloud console](https://console.cloud.google.com/apis/credentials), create an **OAuth client ID** of type **Web application**.
2. Under **Authorized JavaScript origins**, add the address you open oboku at, such as `https://oboku.example.com`.
3. Copy the **Client ID**. Google sign-in stays off until it is set.
4. On the client's page, copy its **Client secret**, or add a new one. Features that let the server reach Google on a user's behalf will need it.

## Create the API key

Create an **API key** in the same project and enable these APIs for it:

* **Google Picker API**, to add books and data sources from Google Drive
* **Books API**, to look books up in Google Books

:::danger
The web app sends the API key to every browser, so restrict it to the APIs above.
:::

The API server calls Google Books with this key too, so a key restricted to your website's address (HTTP referrers) fails those lookups. The server logs a failing catalog with its HTTP status on every refresh.

## Admin panel

Enter the client ID, the API key and the client secret under **Providers > Google** in the admin panel. The secret is never shown again once saved: enter a new one to replace it, or clear it.

The API keeps these settings in its instance config file, which only the API's user can read.

## Upgrading from environment variables

Earlier versions read the client ID and the API key from the `GOOGLE_CLIENT_ID` and `GOOGLE_API_KEY` environment variables. On its first start after the upgrade, the API copies both into the instance config, then stops reading them: you can remove them, and from then on change the values in the admin panel.
