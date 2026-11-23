# Book fixtures

The tests add these books to the library, and the stack serves this folder
through Server Sync. Each one may be redistributed.

## Standard Ebooks

The texts are in the United States public domain. Standard Ebooks dedicates its
contributions to the public domain under
[CC0 1.0](https://creativecommons.org/publicdomain/zero/1.0/). Each cover adapts
a painting that is in the public domain. Each book holds the full notice in
`epub/text/uncopyright.xhtml` and the cover credit in `epub/text/colophon.xhtml`.

All five editions were released on 15 November 2026. Each source page is
`https://standardebooks.org/ebooks/<path>`.

| File                                                        | Book                                                          | Path                                                   | Revision | Cover painting                                      |
| ----------------------------------------------------------- | ------------------------------------------------------------- | ------------------------------------------------------ | -------- | --------------------------------------------------- |
| `h-g-wells_the-time-machine.epub`                           | _The Time Machine_, H. G. Wells, 1895                         | `h-g-wells/the-time-machine`                           | fbd9854  | _The Black Marble Clock_, Paul Cézanne, about 1870  |
| `jane-austen_pride-and-prejudice.epub`                      | _Pride and Prejudice_, Jane Austen, 1813                      | `jane-austen/pride-and-prejudice`                      | a77a2db  | _A Wet Sunday Morning_, Edmund Blair Leighton, 1896 |
| `mary-shelley_frankenstein.epub`                            | _Frankenstein_, Mary Shelley, 1818                            | `mary-shelley/frankenstein`                            | 52a3e09  | _Portrait of Adam_, Giuseppe Arcimboldo, 1578       |
| `arthur-conan-doyle_the-adventures-of-sherlock-holmes.epub` | _The Adventures of Sherlock Holmes_, Arthur Conan Doyle, 1892 | `arthur-conan-doyle/the-adventures-of-sherlock-holmes` | 6c94b03  | _Music_, Thomas Eakins, 1904                        |
| `robert-louis-stevenson_treasure-island.epub`               | _Treasure Island_, Robert Louis Stevenson, 1883               | `robert-louis-stevenson/treasure-island`               | 8bd59dd  | _One More Step, Mr. Hands_, N. C. Wyeth, 1911       |

SHA-256:

```
e27f560ac86ace1562b5bed6af83d80add46ce6afb97f951de2c3d04b9e2168c  h-g-wells_the-time-machine.epub
bc41e616c102d33c4c37b91baaa0c87af9c73838f32d4c75c600939b1c7ea587  jane-austen_pride-and-prejudice.epub
4cb9f313382570a470a7055b4696ec63068dfea304a0c7ef878890d2b4e3c3e2  mary-shelley_frankenstein.epub
e4db4d3abb36819041efa2ab774cd365493d9d80ecc8f09cd69c578eeb469df5  arthur-conan-doyle_the-adventures-of-sherlock-holmes.epub
c50f763b0619c545f2aff871a5a386e90b7d83f3a5722a1dbb5441213cd79026  robert-louis-stevenson_treasure-island.epub
```

## winsor-mccay_little-nemo-in-slumberland.cbz

- **Comic:** _Little Nemo in Slumberland_, Winsor McCay, the Sunday pages of
  15, 22 and 29 October 1905 in the _New York Herald_.
- **Source:** the Wikimedia Commons scans
  [Little Nemo 1905-10-15.jpg](https://commons.wikimedia.org/wiki/File:Little_Nemo_1905-10-15.jpg),
  [Little Nemo in Slumberland (1905-10-22).jpeg](<https://commons.wikimedia.org/wiki/File:Little_Nemo_in_Slumberland_(1905-10-22).jpeg>)
  and
  [Little Nemo 1905-10-29.jpg](https://commons.wikimedia.org/wiki/File:Little_Nemo_1905-10-29.jpg),
  from their 1280 px thumbnails.
- **Licence:** public domain. The pages were published in the United States in
  1905, and Winsor McCay died in 1934. Commons marks them PD-US and PD-old.
- **Build:** each page resized to 1080 px wide and saved as JPEG at quality 80,
  in the order of publication, with a `ComicInfo.xml` that gives the title,
  the author and the date.
- **SHA-256:** `f318103048098619afa9e3fafc0d024990e0ae922623c4f1da72d83f41de1462`

## ippei-okamoto_hito-no-issho.cbz

- **Manga:** _人の一生_ (_Hito no Isshō_), Okamoto Ippei, a manga novel
  published by Dai Nippon Yūbenkai Kōdansha on 25 February 1927: book pages
  4 to 6, the start of the chapter 出生前後, read right to left.
- **Source:** the National Diet Library Digital Collections scan of the
  twentieth printing (25 February 1929),
  [info:ndljp/pid/1225618](https://dl.ndl.go.jp/pid/1225618): frame 11 for
  pages 4 and 5 and frame 12 for page 6, at full resolution from the IIIF
  Image API.
- **Licence:** public domain. The book was published in Japan in 1927, and
  Okamoto Ippei died in 1948. The NDL marks the scan public domain, which "may
  be reused freely", and asks to be credited as the source.
- **Build:** each page cut from its spread around its panel frame,
  straightened, turned to greyscale with the paper levelled to white, resized
  to 1080 px wide and saved as JPEG at quality 80, in reading order, with a
  `ComicInfo.xml` that gives the title, the author, the date of the first
  printing and the right-to-left manga flag.
- **SHA-256:** `23c9a405df0ea3abb1db1bd597a2e541def3ff65a85bd0a3da9e71593cb88a11`

## h-g-wells_the-time-machine_librivox.zip

- **Audiobook:** _The Time Machine_, H. G. Wells, the LibriVox recording
  _The Time Machine (Version 2)_ read by Mark F. Smith, 2011: the first 30
  seconds of chapters 1 and 2.
- **Source:** the Internet Archive item
  [time_machine_ms_librivox](https://archive.org/details/time_machine_ms_librivox),
  [timemachine_01_wells.mp3](https://archive.org/download/time_machine_ms_librivox/timemachine_01_wells.mp3)
  and
  [timemachine_02_wells.mp3](https://archive.org/download/time_machine_ms_librivox/timemachine_02_wells.mp3),
  listed on the
  [LibriVox catalog page](https://librivox.org/the-time-machine-version-2-by-h-g-wells/).
- **Licence:** public domain. The item is marked CC0 1.0, and the recording's
  CD insert states that "this recording is in the public domain and may be
  reproduced, distributed, or modified without permission".
- **Build:** each chapter cut to its first 30 seconds and encoded as mono MP3
  at 64 kbps with ID3 tags for the chapter, the author, the book and the track
  number, stored in a zip. The zip holds no cover: prose-reader reads an image
  in an audio-only zip as a page after the tracks
  ([mbret/prose-reader#897](https://github.com/mbret/prose-reader/issues/897)).
- **SHA-256:** `4df267126355cfefa33388e09db38d80c73a625451d5ba2c113c68cbc05a0f20`
