# Books

## Download

To download a book you can simply click on its cover. The download will then proceed with the provider you added the book from.

Since books can come from various providers and data sources the download process may differ for some steps. For example if you want to download a book linked to dropbox and you are not already authenticated with the provider, you will be prompted with a consent screen from dropbox before the download can proceed.

Once your books are downloaded you can click again on the cover to read them.

You can manage your downloaded books in the settings.

{% hint style="info" %}
Some providers may or may not provide a way to track download progress. When this is the case you will not be able to see the current download progress until it is completely done.&#x20;

Due to the important costs it involves we cannot use a bridge or proxy to provide the feature yet.
{% endhint %}

{% hint style="warning" %}
Due to the current lack of support of background downloading from some major browsers **it is currently not possible to download books while the app is closed or frozen**. We are working on implementing it for chrome as a progressive update and follow with other browsers once the support is here. You can check the status of the technologie here [https://www.chromestatus.com/feature/5712608971718656](https://www.chromestatus.com/feature/5712608971718656)
{% endhint %}

## Book Link

A book is always attached to a link. The link is&#x20;

## Supported formats

### `.epub`

Standard and most commonly used format to read book on digital platform. There are still a lot of work to be done but ultimately you should be able to have all the expected features from oboku (highlights, bookmark, reflow, reading direction and language support, ...). Whenever possible, please try to convert your document into epub format. You can use many tools for it (eg: calibre)

### `.cbz`, `.cbr` , `.zip`, `.rar`

Theses are common format used for comic/manga archive. This is basically a zip or a rar file that contains a list of image files in it (.png, .jpg, ...). If you have a list of images and would like to be able to read as a book you can quickly create an archive and use it as it is.&#x20;

### `.txt`

Text documents format, oboku will let you open it and scroll through the content. The support is limited and you will not have most of the features than epub. It is recommended to convert it into an epub book.

### `.pdf`

Regular PDF documents will work as expected and be displayed as pre-paginated books.

## Unsupported formats

### `.mobi`

mobi is an old and closed format from amazon and we will not provide support for it. It requires a lot of effort and is very limited compared to epub. When possible convert your mobi files to epub. [See more](https://wiki.mobileread.com/wiki/MOBI)

### Need a format not listed here ?

We try to support as many open standard as possible but if your format is not available yet please contact us and we will work on it if possible

## General limitation per contents

Due to server cost (it's free for you but not for us unfortunately) it is currently recommended that the document size must stay **under 500mb**. In addition to the size limitation and for oboku to be able to retrieve metadata of the said file, the server must be able to download and process it under **15mn** maximu&#x6D;**.** That being said, epubs larger than 200-300mb are quite rares and if you have such books you can use tools like calibre to optimize the images inside in order to reduce the size. The time to process a book varies based on the size of the book and the latency of the data source. Most of the time data source like google, dropbox, etc should be fast enough but it is possible to experience slowdown from time to time and therefore even a small book could end up in timeout. You can try to manually refresh the books that appears to have failed to retrieve metadata.

{% hint style="info" %}
Note that nothing blocks you from adding a book that is larger in size. Some of the features will not work properly such as retrieving metadata from your epub or displaying the cover (they require to download and access the file) but you will still be able to see it in your library, download it and potentially read it.
{% endhint %}
