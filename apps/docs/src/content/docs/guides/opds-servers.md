---
title: "OPDS Servers"
---

An OPDS server turns your oboku library into a catalog that KOReader and the other reading apps that support OPDS can browse. You can create several, each with its own address and password, for example one per device.

:::caution
Catalogs are empty for now: oboku cannot serve your books through them yet. You can already create a server and sign a reading app in to it.
:::

## Create a server

In oboku, open **Integrations > OPDS** and tap **Create a server**. oboku names the new server with a few random words, and the screen shows the three values a reading app needs:

* **Catalog URL**: your oboku API address followed by `/opds/` and the server's words, such as `/opds/calm-snails-dream`. Copy it from the screen rather than typing it from memory.
* **Username**: the email of your oboku account.
* **Password**: the generated password. It is shown only once: oboku keeps nothing but a hash of it. Lost it? Generate a new one.

:::note
The password is not your oboku password and opens nothing but the server's catalog.
:::

An account can have up to 10 servers. A self-hosted instance can change that limit from its [admin panel](/self-hosting/admin#opds-servers).

## Set up a reading app

In KOReader:

1. In the file browser, open the search menu (the magnifying glass), then **OPDS catalog**.
2. Tap **+** at the top left, name the catalog, then enter the catalog URL, username and password.

Other reading apps that support OPDS catalogs ask for the same three values.

## Manage your servers

Each server on the **Integrations > OPDS** screen has three actions:

* **Rename** changes the server's name. The catalog URL stays the same.
* **Generate a new password** replaces the password. Apps signed in with the previous one cannot open the catalog until you sign them in again.
* **Delete** removes the server. Apps signed in to it can no longer open its catalog.

Deleting your account deletes its servers too.
