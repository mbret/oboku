<p align="center">
  <a 
  href="https://github.com/mbret/oboku">
    <img src="https://user-images.githubusercontent.com/1911240/99893449-bca35e00-2cc3-11eb-88c1-80b3190eb620.png" alt="Logo" width="75" height="75">
  </a>

  <h3 align="center">oboku</h3>

  <p align="center">
    Your personal reading cloud library
    <br>
    <a href="https://reponame/issues/new?template=bug.md">Report bug</a>
    ·
    <a href="https://reponame/issues/new?template=feature.md&labels=feature">Request feature</a>
  </p>
</p>

## Table of contents

- [Table of contents](#table-of-contents)
- [About](#about)
- [Status](#status)
- [Features](#features)
- [Roadmap](#roadmap)
- [Quick start](#quick-start)
- [Bugs and feature requests](#bugs-and-feature-requests)
- [Creators](#creators)
- [Copyright and license](#copyright-and-license)

## About
<p align="center">
<img src="https://user-images.githubusercontent.com/1911240/99895904-bff01700-2cce-11eb-84d6-ed1a250fafac.png" alt="Logo" height="300">
<img src="https://user-images.githubusercontent.com/1911240/99895927-0e051a80-2ccf-11eb-8dc1-038e07ffd184.png" alt="Logo" height="300">
<img src="https://user-images.githubusercontent.com/1911240/99895942-3ab93200-2ccf-11eb-9f43-6c54d0cea830.png" alt="Logo" height="300">
</p>

---
oboku is a reading cloud library which allows you to synchronize your own books from various sources and provide a focused and friendly app.

The service is different from kindle, kobo or google play book since it emphazise and focus on your own content (sometime named side loaded books). By connecting your own datasource to the service you will be able to synchronize and access your content wherever you are and on every device you have.

One of the main focus of oboku is the accessibility no matter the device. In that way, e-ink devices always comes first in mind when developing new features. There are no fancy animation or complexe ui. The experience will also be adapted based on your screen size.

At this point in time oboku is in early stage of development and very limited in term of features. Many more will be added over time but the phylosophy behind it will stay the same. With that said, should you try it ?

You should try oboku if you:
- Possess your own book files. For now the synchronization support is limited and paid services such as kobo or kindle are not supported.
- Read from different devices (e-ink, tablet, web, ...)
- Like to organize your books automatically
- Manage your books with calibre
- Often goes offline

You should not try it if you:
- **Wants a complete and bug free service**. This is still an early and heavily developed product
- Only buy and read books from paid or closed platform (without API we cannot synchronize from them, ever) (ex: kobo, kindle, ...)
- Like fancy animation or UI such as turning page

------
About [Calibre Web](https://github.com/janeczku/calibre-web):

Calibre Web is another similar project that created many years ago and provide a similar experience. It obviously provide a lot more of features at this time and you might want to give it a try as well. Most specifically if you are using calibre as your source of data.
Although it is a similar project oboku has some key differences:
- Offline first
- e-ink friendly
- provide more different data sources for your books (Google Drive, Dropbox, ...)
- Not self hosted (hassle free). Although you can fork the project, self host it and generally use the code however you want (under MIT limitation).
- Use modern web technologies and is accessible through any devices

In no way oboku wishes to undermine calibre-web and I want to personally thanks [janeczku](https://github.com/janeczku) and all the contributors for making calibre-web project.

## Status

This project is still under heavy development and is not officialy released yet.
If you like it and want to contribute, we are looking for translators and general contributors. If you would like to see a specific feature [please open a new issue](https://github.com/mbret/oboku/issues/new).

## Features

- Use the app and read your books offline
- Connect datasources to automatically synchronize your books (Google Drive, dropbox, ...)
- Manage collections and tags
- Hide sensitives books behind protected tags
- Follow your book progress
- Visualize, sort and filter your books

## Roadmap

- Add support for Calibre datasource
- Add metadata support from Google Book API
- Add reader annotations
- Add reader bookmark
- Add reader font size change

## Quick start

```sh
$ npm install
$ npm start
```

## Bugs and feature requests

Have a bug or a feature request? Please search for existing and closed issues. If your problem or idea is not addressed yet, [please open a new issue](https://github.com/mbret/oboku/issues/new).

## Creators

**Maxime Bret**

- <https://github.com/mbret>


## Copyright and license

Code released under the [MIT License](https://mbret/oboku/blob/master/LICENSE).

Enjoy :metal:
