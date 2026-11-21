---
title: "Google Drive"
---

Google Drive is fully supported

When creating a data source for google drive, you will need to first build the tree structure by picking files and folders. This process is needed only once and every-time you want to add or remove items to be synced.

You will be able to visualize your sync structure and then synchronize.

oboku syncs only the folders and files you pick. A folder you pick does not add the files inside it, so pick those files too. On a computer, the picker selects many items at once.

oboku asks Google for access to the files you pick only, with the `drive.file` scope. To read the whole content of a folder, oboku would need the `drive` or `drive.readonly` scope. Google classes both as restricted: an app that uses them must pass Google's verification, and a security assessment when the files reach a server, as they do when oboku syncs. See [Choose Google Drive API scopes](https://developers.google.com/workspace/drive/api/guides/api-specific-auth).

## Sync Reconciliation

Because Google Drive uses unique ID, moving files around is usually completely safe and oboku will never create duplicates. There is nothing specific you should be careful with.
