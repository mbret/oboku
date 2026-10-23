---
title: "KOReader Progress Sync"
---

oboku's reader can sync its reading position through a KOReader sync server, as KOReader, Readest and CrossPoint do. Start a book on your e-reader, then open it in oboku: it opens where you stopped. Read on in oboku, and your e-reader picks up from there the next time it syncs.

Any KOReader sync server works: oboku's own [KOReader sync server](/guides/koreader-sync-server), KOReader's public server, or one you host. A self-hosted oboku reaches a server on your own network only once its admin allows it, under [Private networks](/self-hosting/admin#private-networks).

## Turn it on

Open **Profile**, then **KOReader progress sync** under **Other apps**. Enter the server, username and password your devices use, then tap **Turn on**.

When your devices use oboku's own server, the screen offers to fill in its address and your username: tap **Use it**, then enter the password you generated for your devices.

:::note
oboku signs in with the password, then keeps only the key KOReader sync clients derive from it, encrypted.
:::

## What syncs

* **As you read**, oboku sends your position to the server a few seconds after it stops moving. Offline, it goes out once you are back online, even if you closed oboku in between.
* **When you open a book**, oboku asks the server where the book was left. When another device left the book after you last read it in oboku, the book opens where that device left it.

oboku does not send a position:

* that the book has since moved on from: you read on in it on another device, marked it as read or unread, or it opened where another device left it;
* when the server already keeps it, or keeps a position it received after you got there. A server dates a position when it receives it, so when two devices read offline, the first one back online can win even if the other read later;
* that you reached while the server refused your password;
* that was still waiting when you signed out or switched accounts.

The positions of EPUB books, PDFs and comic archives (CBZ, CBR and CBT) sync. Other books keep their position in oboku only.

Devices recognize a book only when they identify it the same way. oboku identifies a book by the content of its file, as KOReader does by default (the "binary" document matching method). Keep that method on your devices, and read the same copy of the file everywhere.

## While a book opens

The book opens once the server has answered. When the answer takes more than a few seconds, **Continue anyway** opens the book where oboku left it.

* **The server can't be reached**, or doesn't answer within 15 seconds: tap **Try again**, or **Continue anyway**.
* **The server refuses your password**, for example after it changed: tap **Sign in again**, then turn progress sync off and on again with the new password.

Offline, the book opens right away, where oboku left it.

## Turn it off

**Profile > KOReader progress sync > Turn off progress sync** stops oboku's reader syncing with the server. The reading positions already on the server stay there.
