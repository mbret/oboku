---
description: Ever wondered what runs oboku ?
---

# Platform & Tech

## Technologies

### Backend API

The main API is written with NestJS.

### Web Client (PWA)

The web client app is a PWA running on ReactJS and Material UI. It uses [https://prose-reader.com/](https://prose-reader.com/) for reading system. It rely heavily on service worker to allow offline uses.

### Remote Database user (couchdb)

The database is [https://couchdb.apache.org/](https://couchdb.apache.org/). This database mainly allows replication & conflict resolution.&#x20;

The remote database is replicated with the device local database. Your device holds the "same" data as the one on the remote database. This allow full offline use and synchronization between devices.&#x20;

### Remote Database system (postgres)

Used for system purposes rather than user (who have their own db). It is not directly accessible publicly and is driven by the backend API.

### Local database (indexedDB)

The device database is [https://developer.mozilla.org/en-US/docs/Web/API/IndexedDB\_API](https://developer.mozilla.org/en-US/docs/Web/API/IndexedDB_API) with [https://rxdb.info/](https://rxdb.info/) as "ORM" layer. The local database synchronize and replicate the remote database when online. When you are offline, all the changes happens in indexedDB and will wait until online to replicate to the remote database.
