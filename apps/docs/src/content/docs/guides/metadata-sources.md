---
title: "Metadata Sources"
---

## &#x20;Series { #series }

* mangadex
* mangaupdates
* biblioreads
* comicvine

### Default order of priority

* user (your own data)
* mangadex
* mangaupdates
* biblioreads
* source (what the series' provider reports)
* comicvine

## Books

#### Sources (by priority order)

* User information
* Directives
* File
* Catalog
* Source (what the book's provider reports about its file)

You can swap File and Catalog on a book's metadata sources screen.

The catalog entry is the best match oboku finds for the book in Google Books (when the server has a Google API key), Open Library and Project Gutenberg. Project Gutenberg is only asked about books that carry a Project Gutenberg identifier.

On the book's Catalog source screen, the catalog name links to the record the entry comes from, on the catalog's own site. An entry stored before oboku used these three catalogs has no link until you use Refresh metadata on the book.

To stop asking a catalog for your books, turn it off in Integrations, under Catalogs. Google Books is listed there only when the server has a Google API key.
