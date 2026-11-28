---
title: "Send to Kindle"
---

oboku can email a book of your library to your Kindle, with Amazon's Send to Kindle service. A Kindle cannot browse an [OPDS server](/guides/opds-servers) and cannot run KOReader without a jailbreak, so email is the way a book gets onto it.

:::note
The feature needs an oboku server that sends emails. The cloud version does. On a self-hosted instance, set the [email provider](/self-hosting/configuration/environment-variables#email-provider) first: without it, the app does not show the feature.
:::

## Set it up

1. In oboku, open **Integrations > Send to Kindle**. The screen shows the address that sends the books.
2. On Amazon's website, open **Manage Your Content and Devices > Preferences > Personal Document Settings**.
3. Add oboku's address to the **Approved Personal Document E-mail List**. Amazon ignores the emails of any other sender.
4. On the same page, find the address of your Kindle under **Send-to-Kindle E-Mail Settings**. It ends with `@kindle.com`.
5. In oboku, enter that address and select **Save**.

Your Kindle address is part of your settings: it syncs between the devices of your account. [Amazon's help page](https://www.amazon.com/gp/help/customer/display.html?nodeId=G7NECT4B4ZWHQ8WV) describes the Amazon steps.

## Send a book

Open the actions of a book, then select **Send to Kindle**.

oboku's server reads the book from its source, then emails it. If the source needs a sign-in, such as Google Drive, the sign-in opens first.

oboku tells you when the email left. Amazon then converts the book and delivers it to your Kindle, most often in a few minutes.

## Limits

- **EPUB, PDF and text files only.** Amazon accepts no comic archive (`.cbz`, `.cbr`) by email, and oboku converts nothing.
- **25 MB for a book**, unless the instance sets another limit. The screen shows the limit that applies. Amazon accepts 50 MB in an email, and email servers accept less.
- **10 books a day** for each account. The count starts again at midnight, UTC.
- **Not for a book added from a device.** oboku's server cannot reach a file that is only on your device.
- **A send counts on your download quota**, because the file goes through oboku's server. **Profile > Quotas** shows your usage.

## If a book does not arrive

oboku knows that the email left. It does not know what Amazon did with it. Check these points:

- The address that oboku shows is in the **Approved Personal Document E-mail List** of your Amazon account.
- The address you saved in oboku is the one Amazon shows for this Kindle.
- Amazon can convert the file. It cannot convert a file with DRM, or a damaged file.
- Your Kindle is online. Amazon tries to deliver a book for up to 60 days.

## Send a book by hand

Some books cannot go through oboku: a book added from a device, or a book over the size limit. For these:

1. Get the book's file from the place where you store it.
2. Upload the file on Amazon's [Send to Kindle page](https://www.amazon.com/sendtokindle). It accepts files up to 200 MB.
