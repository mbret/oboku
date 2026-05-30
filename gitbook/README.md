---
description: Welcome to the documentation of oboku
---

# Welcome

## What is oboku ?

oboku is both a cloud or a self host-able service that allows you to synchronize your books and collections from various sources and read them. The cloud version is accessible at [https://app.oboku.me/](https://app.oboku.me/)

The core principle of oboku is to let you store your books wherever you want (Google Drive, Synology, Server, etc) and have the app directly access them. This is why you don't have to self host it to use it. As long as your content is accessible through a network you can synchronize it with the cloud version.

Because the server does not "own" or organize your books you can easily share any of your collections with anyone. They simply synchronize from it as well. Permissions are not handled by oboku, you are the one providing and sharing credentials with your friends.

By self-hosting the service you will be able to synchronize your books directly from the server.

The app also work fully offline and have a heavy focus on accessibility (eg: e-ink devices).

{% hint style="info" %}
If you are interested but feels like some features are lacking, you are encouraged to requests them. Oboku is driven by its community.
{% endhint %}

## **Key features:**

* Full offline usage
* Synchronize your books from external sources
* Manage collections and tags
* Control sensitive materials
* Track your book progress
* Visualize, sort and filter your books
* Aim to support all known contents types
* Share your libraries with your friends

## How do we compare to similar / alternative services

### [Stump](https://www.stumpapp.dev/)

Media server + Reading app. Stump has some capabilities to sync some reading state and potentially more in the future but is not designed to sync libraries outside of its self hosted server. It is also only self host.

### **BookFusion**

BookFusion is yet another cloud based book library which let you organize and read your own books. It does look similar to oboku in some of the aspects and could ultimately gives you the same experience. However there are some missing key features from BookFusion that are the very reason oboku exist:

* The service is paid. Oboku is and will stay free and open source.
* You have to upload your book to their server (or use calibre plugin). Oboku is meant to be used with any storage of your choice. We do not host any of your book files, we just synchronize them.
* The reading app is not e-ink friendly
* No offline support (at least on the web)
* Unfortunately quite closed since it's provided by a company as a paid product ultimately

### **Calibre Web**

Calibre Web is another similar project that was created many years ago and provide a also similar experience. It obviously provide a lot more of features at this time and you might want to give it a try as well. Most specifically if you are using calibre as your source of data. Although it is also a similar project here are some of the key differences:

* No offline support
* Not e-ink friendly
* Limited choice of source prodivers (Calibre and Kobo sync)
* It is a self hosted product and comes with the hassle of maintenance.&#x20;

In no way oboku wishes to undermine calibre-web and I want to personally thanks [janeczku](https://github.com/janeczku) and all the contributors for making the calibre-web project.

{% hint style="info" %}
Want to add your own app to help people find it or help differentiate it? Contact me to add it here. It's not a "who is best" contest but more of a starting point for users looking for what they need
{% endhint %}
