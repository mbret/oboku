---
title: "Synology Drive"
---

We fully support it and its implementation is similar to how Google Drive or Dropbox works.

## CORS

Make sure you allow CORS otherwise the oboku client device will not be able to access it.

## Servers on your local network

oboku's server connects to your NAS for syncs and downloads, and it only reaches servers on the public internet unless its instance allows private networks. A server on the machine oboku runs on counts as private too. On a self-hosted instance, an admin can allow your server, or private networks as a whole, from the [admin panel](/self-hosting/admin#private-networks) to use a server on your local network or on that machine.

## Self Signed certificate

If you use self signed certificate, make sure to open your NAS adress at least once on your oboku client device. You also need to configure your connector to allow self-signed certificate.
