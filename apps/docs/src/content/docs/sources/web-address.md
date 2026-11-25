---
title: "Web address"
---

You can add a book from the address of its file, such as `https://example.com/books/my-book.epub`. To add one, select **Add a new book** in your library, then **From Web address**.

## What is supported

- One book per address. A library sync cannot use a web address.
- The [formats oboku can read](/guides/supported-contents).
- Reading only: oboku never uploads books to the address.

## CORS

Your browser downloads the book from its address, so the server that hosts it has to allow it. Its answer must allow oboku's origin in `Access-Control-Allow-Origin`: `https://app.oboku.me` on the cloud version, or the address you open oboku at when you self-host it. oboku sends no credentials with the download, so `*` works too.

## Servers on your local network

oboku's server downloads the book to read its metadata, such as its title and cover, and it only reaches servers on the public internet unless its instance allows private networks. A server on the machine oboku runs on counts as private too. On a self-hosted instance, an admin can allow your server, or private networks as a whole, from the [admin panel](/self-hosting/admin#private-networks).

## Self-signed certificate

If the server uses a self-signed certificate, check **Allow self-signed certificate for API requests** when you add the book. oboku's server then accepts the certificate. Your browser downloads the book too, so open the server's address once in it to trust the certificate as well.
