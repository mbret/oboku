# Directives

Directives are extra information you put on your data sources contents to help oboku understand better what they are. Ideally they should not be required and have some limitations but they can come handy in some situation.

## **Overview**

Let's say you have a `solo leveling Vol.1.cbz` book on yout drive. By default oboku will assume it's a manga (.cbz) and will open it as horizontal scrolling with a reading direction from right to left. This is because there are some default behavior oboku try to assume based on the extension of  your book. Now, because this one happens to be a webtoon you want oboku to display it automatically vertically with a scrolling reading mode. To solve this you can use a directive directly on your file such as: `solo leveling Vol.1 [oboku~webtoon].cbz.`

Directives can be placed on files but also folders (collections). Read the details of each directives to see what they do.

Directives are very similar to plex naming convention as an example [https://support.plex.tv/articles/naming-and-organizing-your-tv-show-files/](https://support.plex.tv/articles/naming-and-organizing-your-tv-show-files/).&#x20;

{% hint style="warning" %}
Due to some current limitation, you may need to re-download a book for some directives to be active. For example if you download a .cbz file which is read from left to right, it will open as rtl since it's the default behavior. To fix it you need to add the ltr directive. However you will need to remove and re-download the local file to make the change effectives.
{% endhint %}

## Limitations

When you are using a data sources which does not use ID for its resources (such as webdav) renaming the files or folders will prevent oboku from knowing the resource has been renamed and thus will end up duplicating the contents. This limitation is directly tight to the limitation of the protocol of the data sources. Using Google Drive or Dropbox for example does not have this problem and you can rename your contents whenever you want.

If you rename or move around contents you can always update the link on oboku manually.

## `tags`

```
my book [oboku~tags~manga].epub
my book [oboku~tags~manga,good,personal].epub
my folder [oboku~tags~manga]/
```

Specify list of tags for the given file or folder. If the directive is on the folder, the tags will be added to every sub files.

## `webtoon`

```
my book [oboku~webtoon].epub
```

Specify a book as webtoon content. Oboku will display the book vertically with a free scrolling experience. This can also be set on a manifest level and would be the recommended way of doing it.

## `metadata-ignore-file`

{% hint style="info" %}
Files only
{% endhint %}

```
my book [oboku~metadata-ignore-file].epub
```

Tells oboku to not use any information from the file itself to build the metadata. It can be useful if for exemple you don't want the cover to be the first image from the file or if the epub file is not good enough for you and contain invalid information.

Remember that the `file` source metadata takes priority over other sources such as google API but not the `user` source.

## `google-volume-id~{id}`

{% hint style="info" %}
Files only
{% endhint %}

```
my book [oboku~google-volume-id~xDoiuklsd23].epub
```

Tells oboku fetch google metadata from the volume id rather than trying to guess based on the other infos. This help having more accurate metadata with google.

## `metadata-ignore-sources`

{% hint style="info" %}
Files only
{% endhint %}

```
my book [oboku~metadata-ignore-sources].epub
```

Tells oboku to not fetch any metadata from external sources. Basically only using metadata from links and files. You can use it when the external metadata are wrong and you want to stay as close to your file.

## `metadata-source-{source}-only`

{% hint style="info" %}
Collections only
{% endhint %}

```
my series [oboku~metadata-comicvine-only]
```

Tells oboku to not fetch any metadata from other sources than the given one. Can be helpful depending of the type of series. For example mangedex is more designed towards mangas and might give false positive if your series is a comic that could match some results on mangadex. You can see the list of supported [sources here](metadata-sources.md)

## `metadata-title~{value}`

{% hint style="info" %}
Collections only
{% endhint %}

```
my series [oboku~metadata-title~More specific title].epub
```

Tells oboku to use this title instead of the folder name when looking for metadata. Sometimes it's easier to match some series matadata by using different title. Something you don't necessarily want as folder name but just very specific for metadata (eg: japanese title for manga).

## `no_collection`

```
my folder [oboku~no_collection]/
```

**Only usable on folders**. Use this directive if you want to prevent the folder to be treated as collection. This is usefull if you use a data source that contains lot of sub folder and you don't necessarely want to have a collection for each folder (default behavior).

When using `no_collection` on a folder, oboku will then use the default behavior for all children which means every folder directly under this folder will be treated as collection. Use this directive again if  you need to ignore deeper folder.

## `ignore`

```
my book [oboku~ignore].epub
my folder [oboku~ignore]/
```

Will ignore the item or folder and its sub folders/items

## `direction`

```
my book [oboku~direction~ltr].epub
my book [oboku~direction~rtl].epub
```

**Only usable on files**. Override the default direction for a given book. By default oboku will use several strategies to detect the reading direction which are applied by order of priority as follow:

1. If the file is an `.epub` it will use **metadata** **direction**
2. Otherwise use directive if it exist
3. Otherwise if the file is a `.cbz` it will be **rtl**. (cbz is most commonly used for manga)
4. Finally if it's none of the cases above it will use **ltr**

## **`isbn`**

```
my book [oboku~isbn~1588989865].epub
```

**Only usable on files**. Tells oboku to use this isbn to extract metadata. This is a very useful directive if your content does not contains much information for oboku to get metadata from. By using this directive oboku will not look at the file but rather directly get metadata from external API based on the ISBN. This use case is useful if:

* Your `.epub` file is incomplete
* Your are using simple image archive such as `.cbz`, `.cbr`, ...
* Your file is above the recommended size of \~500mb
