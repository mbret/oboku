---
description: If you find yourself having a problem please check for details on this page
---

# Support & Troubleshoot

## Important information

### Incognito mode / private browsing

Using incognito mode, private browsing or some plugins that heavily restrict the use of cookies **may not work well with oboku**. Some third party providers we use for data sources requires the use of cookies to authenticate you. You might not be able to use Google Drive if your browser is blocking cookies for example. It is recommended to use normal mode and eventually accept popups opening for oboku to have full access to all the features.

## Troubleshoot

Since the app is under development here is some of the problems you may encounter and how you can try to fix or workaround.

### When (I open the app / after an update) I have a blank screen

This is most likely because there is a crash in the app which prevent it to even startup correctly. This could happens because of some mistake made with the new version of the app. In this scenario you can try to clear the data (cache) of the web app. Clearing the data of the app in case of you installed it on your home screen will not clear the browser data. You will have to perform the operation inside your browser settings. You can refer to this [documentation](https://support.google.com/accounts/answer/32050?co=GENIE.Platform%3DAndroid\&hl=en) if you are a chrome user as an example. **Be sure to delete only the data of oboku and not your entire browser since it is unnecessary, unless you are doing it on purpose**.

### My content is not being synchronized or visible&#x20;

When synchronizing your content with data sources there could be several reasons for your content to not be synchronized. oboku will only synchronize the content it recognize so make sure your are using [supported formats](https://docs.oboku.me/wiki/supported-media). If you are using supported content then it is most likely an internal problem. Please contact the support for further assistance.

### The metadata are not synchronized and/or in error.

As a reminder only epubs or files with the isbn directive will be parsed for metadata. Any other format will only have the title filled. However it is still possible for the metadata extraction to fail completely. One of the possible reason for oboku to not parse metadata is if the file is too big. If your file is around 500mb or above there is a high chance we will not be able to extract it. If that is the case the best workaround is to use the `isbn` directive. Visit the [datasources](https://docs.oboku.me/wiki/datasources) section for more info. If you are under this size and still get troubles getting the metadata please contact the support for further assistance.

### I have some flickers when turning pages for comics / manga on safari

This is a known performance issue that cannot be resolved. The flicker will usually appears when you open a heavy book (many pages). You can mitigate the issue by using a fading animation which will prevent the brutal flicker.

### I changed a file or moved seomething in a different location

Depending on which provider the book comes from, oboku will try to re-attach the file to the actual book as best we it can. Visit the [resources-matching-and-sync.md](guides/resources-matching-and-sync.md "mention") section to understand more about the expected behavior. Note that changing the actual file content may breaks reading progress or other data such as annotations.
