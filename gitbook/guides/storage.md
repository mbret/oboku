# Storage protection

oboku keeps a lot on your device: your library, your reading progress, the covers it has cached and every book you downloaded for offline reading. By default browsers treat all of that as *best-effort* storage, which means they are allowed to delete it without asking you whenever they need to reclaim disk space.

Protecting your storage tells the browser it may not do that.

## Why it matters

Most of what oboku stores is also on the server, so if it is deleted it comes back the next time you sign in and synchronize. Losing it is annoying rather than fatal.

Two things do not come back:

* **Books you uploaded directly from your device.** oboku is the only place those files exist — there is no datasource to fetch them from again, so they are lost for good.
* **Anything you changed while offline** that had not synchronized yet.

Everything else — downloaded books from Google Drive, Dropbox, Synology, your own server — can be downloaded again, but you may be re-fetching several gigabytes over a connection you were not planning to use.

{% hint style="warning" %}
If your library is mostly made of books you uploaded yourself, treat storage protection as required rather than optional.
{% endhint %}

## Checking your status

Go to **Profile → Manage storage**. The storage protection entry tells you where you stand:

* A **green** shield means your storage is protected and the browser will not delete it on its own.
* A **red** shield means the browser is currently allowed to delete oboku's data.

## How to protect it

Tap the entry when it is red and oboku will ask the browser for protection. What happens next depends on the browser, and this is the part that surprises people:

* **Firefox** asks you directly. Accept the prompt and you are done.
* **Chrome, Edge and most Chromium browsers** never ask you. They decide on their own, based on how important the site looks to them — whether you installed it, how much you use it, whether you bookmarked it, whether you allowed notifications. If they decide no, nothing visible happens and the shield stays red.

### Install oboku as an app

This is the single most effective thing you can do. An installed app is treated as important by every browser, and it is the only lever you fully control.

* **Desktop Chrome / Edge** — open the install icon in the address bar, or the browser menu, and choose to install oboku.
* **iOS / iPadOS Safari** — Share → *Add to Home Screen*.
* **Android Chrome** — menu → *Add to Home screen* / *Install app*.

Once installed, open oboku from its own icon and tap the entry again.

{% hint style="info" %}
Chrome does not document its exact criteria and does not always grant protection even when a site looks important, so the request can be refused more than once. It costs nothing to try again later — a refusal is never permanent, and nothing gets stuck.
{% endhint %}

## What protection does not cover

Protecting your storage stops the browser from deleting oboku's data *on its own*. It does not stop:

* you clearing site data or browsing data yourself,
* uninstalling the app or deleting your browser profile,
* the operating system wiping the browser.

It also does not give oboku more space. Your quota is unchanged; only the deletion policy is.

{% hint style="info" %}
Protection is per browser and per device. Enabling it on your laptop does nothing for your tablet — you need to do it once on each device you read on.
{% endhint %}
