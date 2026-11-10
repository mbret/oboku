---
title: "OPDS Servers"
---

An OPDS server turns your oboku library into a catalog that KOReader and other reading apps can browse. Each server serves its catalog in OPDS 1.2 and in OPDS 2.0, at two addresses. You can create several, each with its own addresses and password, for example one per device.

:::caution
Catalogs are empty for now: oboku cannot serve your books through them yet. You can already create a server and sign a reading app in to it.
:::

## Create a server

In oboku, open **Integrations > OPDS > OPDS servers** and tap **Create a server**. oboku names the new server with a few random words, and the screen shows the values a reading app needs:

* **OPDS 1.2 catalog URL**: your oboku API address followed by `/opds/` and the server's words, such as `/opds/calm-snails-dream`. Copy it from the screen rather than typing it from memory.
* **OPDS 2.0 catalog URL**: the same address followed by `/v2`.
* **Username**: the email of your oboku account.
* **Password**: the generated password. It is shown only once: oboku keeps nothing but a hash of it. Lost it? Generate a new one.

:::note
The password is not your oboku password and opens nothing but the server's catalog.
:::

Each instance caps how many servers an account can have, 10 by default. Its administrator sets the cap from the [admin panel](/self-hosting/admin#opds-servers).

## Set up a reading app

In KOReader:

1. In the file browser, open the search menu (the magnifying glass), then **OPDS catalog**.
2. Tap **+** at the top left, name the catalog, then enter the catalog URL, username and password.

Other reading apps ask for the same three values: a catalog URL, the username and the password. Give the OPDS 1.2 catalog URL to apps that read OPDS 1, and the OPDS 2.0 one to apps that read OPDS 2.0.

## Manage your servers

Each server on the **Integrations > OPDS > OPDS servers** screen has three actions:

* **Rename** changes the server's name. The catalog URLs stay the same.
* **Generate a new password** replaces the password. Apps signed in with the previous one cannot open the catalog until you sign them in again.
* **Delete** removes the server. Apps signed in to it can no longer open its catalog.

Deleting your account deletes its servers too.
