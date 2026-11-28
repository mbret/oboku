---
title: "Web address"
---

You can add a book from the address of its file, such as `https://example.com/books/my-book.epub`. To add one, select **Add a new book** in your library, then **From Web address**.

## What is supported

- One book per address. A library sync cannot use a web address.
- The [formats oboku can read](/guides/supported-contents).
- Reading only: oboku never uploads books to the address.

## CORS

Your browser downloads the book from its address, so the server that hosts it has to allow it, unless the book [uses oboku's server as a proxy](#use-obokus-server-as-a-proxy). Its answer must allow oboku's origin in `Access-Control-Allow-Origin`: `https://app.oboku.me` on the cloud version, or the address you open oboku at when you self-host it. oboku sends no credentials with the download, so `*` works too.

## Use oboku's server as a proxy

Some servers refuse downloads from the browser, and you cannot change their CORS answers. For such a server, check **Use oboku's server as a proxy** when you add the book.

oboku's server then downloads the book from its address and passes it on to you. It only downloads a file whose size the server states, and stops at that size. It passes the file on as the server sends it, with the type the server states. These downloads count towards your [monthly download quota](/guides/opds-servers#monthly-download-quota) and towards the quota of all users.

Without the setting, your browser downloads the book from its address, and the download does not count towards the quota.

## Change the address of a book

Open the book's details, then select the web address under **Source**. The form shows the book's address and settings. Change them, then confirm: oboku points the book to the new address and reads its metadata again.

## Servers on your local network

oboku's server downloads the book to read its metadata, such as its title and cover, and to pass it on to you when the book uses it as a proxy. It only reaches servers on the public internet unless its instance allows private networks. A server on the machine oboku runs on counts as private too. On a self-hosted instance, an admin can allow your server, or private networks as a whole, from the [admin panel](/self-hosting/admin#private-networks).

## Self-signed certificate

If the server uses a self-signed certificate, check **Allow self-signed certificate for API requests** when you add the book. oboku's server then accepts the certificate. Unless the book uses oboku's server as a proxy, your browser downloads the book too, so open the server's address once in it to trust the certificate as well.
