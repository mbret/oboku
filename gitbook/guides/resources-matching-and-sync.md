# Resources Matching and Sync

oboku's purpose is to synchronize your content from various providers into a cohesive library while fetching metadata for each of your book & folders. This is similar to [https://watch.plex.tv/](https://watch.plex.tv/) or any other software that manage media library.&#x20;

Unlike movies, tv shows or music books are very complexe to fetch metadata for. As an example Batman movie ([https://www.imdb.com/title/tt0372784/?ref\_=nv\_sr\_srsg\_0\_tt\_7\_nm\_1\_in\_0\_q\_batma](https://www.imdb.com/title/tt0372784/?ref_=nv_sr_srsg_0_tt_7_nm_1_in_0_q_batma)) is pretty much the only and unique place you can find the metadata for it, in all languages for its title, cover, etc. There are no such services for books. Each books has a specific identity per country, per language, per edition or even per version. This is expected because every "printed" edition of a book is unique but this makes managing books quite harder than other media.

## Books metadata

To know more about where and how we fetch book metadata you can visit this section [metadata-sources.md](metadata-sources.md "mention")

### Refine metadata

There are many ways to refine your metadata and have your files matches together but you have two main ways to do it:

* Oboku&#x20;
* Original source

You can always overwrite metadata yourself but this is strongly encourage to "fix" your books when possible. This will make them compatible with other tools and generally improve them. Unlike movies for example there are "standard" ways to embed metadata into ebooks.

#### Refine by: ISBN

If you specify an ISBN within the file, directive or user information, we will target the right book. ISBN are uniques so this is by far the most reliable way to get consistent metadata for a book.

#### Refine by: Naming and Conventions

Similar to plex and other software (eg: [https://support.plex.tv/articles/naming-and-organizing-your-movie-media-files/](https://support.plex.tv/articles/naming-and-organizing-your-movie-media-files/)) you may want to have a consistant and noise free naming convention. This will help our metadata fetcher to retrieve deterministic results.

## Series metadata

TODO

### Refine

Having the correct metadata is hard and oboku may often get it wrong. To help oboku refine metadata you can use several methods:

* Have a clear, straightforward, clean name. "Dragon Ball Z" is better than "Dragon Ball Z - series - (1984) - Toriyama"
* Use [directives.md](directives.md "mention")to restrict / help oboku refine

Directives usually are enough to fix even the hardest to find series. If everything fail, you can always provide the value yourself. Although oboku is made to be hassle free and auto-magic so try first with the automatic metadata.

## Technical details

Conceptually, the main purposes of oboku is to sync files across various location into a single place and let you read them.

For the simplicity of the explanation and because the files can be various of various types (`mobby-dick.epub`, `2026-bill.pdf`, `/naruto-season-1`) we are gonna uses `files` and `book` . `File` being the actual resource on your drive, kobo store, local file system, etc and `book` being the entity managed by oboku.

In order to sync files into books one of the challenge is to be able to know what is what. For example, what happens if the user move one of its file into a different location. What happens if the user rename a file. What happens if the user has two different files but that are the same book.

### Unique Identifier

Application usually solve this problem by using whatever common unique identifier exists. For movies and series you can use the imdb ID, for books you can use `ISBN`, etc. The idea is to be able to identify a file with something unique.

If the user decides to move a movie file into a different location, or rename the file or actually change it by a higher quality version, the application will be able to re-attach this file behind the correct entity in the application. As long as you detect the file as Harry Potter you can re-attach it with the correct metadata, watch progress etc.

### The problem with ISBN & oboku

#### Inconsistency & Unreliability

Retrieving ISBN from a file is not easy tasks. Sometimes the isbn is wrong, something there are no isbn (my-bill-2026.pdf), sometimes you even get a different ISBN than the one you scan the previous day. Unlike movies or series, one book title can have several dozens of different ISBN, physical, digital, language, revisions, etc. Unless you have a perfect epub book with the isbn written in it, it is by definition highly unreliable.

#### Strong reliance on file content & structure

Reading progress, bookmarks and many of the information of your books are intrinsically tied to the actual file. Most of these metadata are based on [https://idpf.org/epub/linking/cfi/](https://idpf.org/epub/linking/cfi/) and will not work if the file content changes. Sometimes it's possible to migrate or self-repair CFIs when the file change but its an entire topic on its own and very much a "might work" system.

If you decide to change a file and we re-attach it to an existing book, there is a chance many of the existing data will not work as expected. This is fine if you loose the progress of your movie, this is more problematic if you loose your page and all your bookmarks on a 600 hundred pages book.

{% hint style="info" %}
We do use ISBN for metadata such as cover, rating, description, etc. This is a different topic.
{% endhint %}

#### Simply no ISBN to be found

Many of our users read fan books or organize their books by collections name that don't matches anything publicly known. If ISBN are possible half of the time and we have to use something else as fallback, why bother and why not use a different unique system at all.

### What we use

#### Identifier based on resource and provider

Instead of an ISBN, the ID we use is built following some rules proper to each providers.

* A book synced from Google Drive will use its Google ID. which is globally unique.
* A book synced from Synology Drive will use its Synology ID + host
* A book synced from filesystem will use the file hash + a `filesystem` flag.

Thanks to that system we are still able to match files and books to some extends. IF you move a file around on your filesystem, it will work. If you move it around in your Google Drive it will work as well.

#### Drawback

Because we are using a stricter ID, we are unable to automatically match a file moved from Dropbox to Google Drive as the same book. We are also obviously not able to match a different file that is theoretically for the same book. But it's better to not do something than doing it wrong.

#### Let the user decide when we don't know

If we are unable to match a file with a book for certain, we will create a new book. If the user wants to merge an existing book with it, he can do so manually through the app. This is usually not a common use case and when it happens, nothing is lost.&#x20;



