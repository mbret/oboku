import {
  AdminPanelSettingsRounded,
  AspectRatioRounded,
  AutoAwesomeRounded,
  AutoStoriesRounded,
  BlurOnRounded,
  BorderColorRounded,
  CloudRounded,
  CloudSyncRounded,
  CloudUploadRounded,
  CodeRounded,
  CollectionsBookmarkRounded,
  CompressRounded,
  ContrastRounded,
  DevicesOtherRounded,
  DevicesRounded,
  DnsRounded,
  DownloadForOfflineRounded,
  DriveFileRenameOutlineRounded,
  EditNoteRounded,
  FilterListRounded,
  FolderSharedRounded,
  FullscreenRounded,
  HistoryRounded,
  ImageRounded,
  InstallMobileRounded,
  KeyRounded,
  LocalOfferRounded,
  LockRounded,
  PasswordRounded,
  RssFeedRounded,
  SearchRounded,
  ShareRounded,
  ShieldRounded,
  StorageRounded,
  SwapHorizRounded,
  SwapVertRounded,
  SyncRounded,
  TaskAltRounded,
  UploadFileRounded,
  VisibilityOffRounded,
  VolunteerActivismRounded,
  WifiOffRounded,
} from "@mui/icons-material"
import type { SvgIconComponent } from "@mui/icons-material"
import { Link } from "@mui/material"
import type { ReactNode } from "react"
import type { PhoneScreenshotSet } from "../common/PhoneScreenshots"
import addDataSourceScreenshot from "../common/app-screenshots/add-data-source.png"
import bookDetailsScreenshot from "../common/app-screenshots/book-details.png"
import dataSourcesScreenshot from "../common/app-screenshots/data-sources.png"
import epubReaderScreenshot from "../common/app-screenshots/epub-reader.png"
import homeScreenshot from "../common/app-screenshots/home.png"
import libraryScreenshot from "../common/app-screenshots/library.png"
import libraryEInkScreenshot from "../common/app-screenshots/library-e-ink.png"
import manageStorageScreenshot from "../common/app-screenshots/manage-storage.png"
import mangaReaderScreenshot from "../common/app-screenshots/manga-reader.png"
import profileScreenshot from "../common/app-screenshots/profile.png"
import { supportedExtensions, syncProviders } from "../home/content"

type Feature = {
  title: string
  description: string
  Icon: SvgIconComponent
}

type FeatureChip = {
  label: string
  href?: string
}

export type FeatureGroup = {
  id: string
  Icon: SvgIconComponent
  navLabel: string
  overline: string
  title: string
  description: ReactNode
  features: Feature[]
  screenshots?: PhoneScreenshotSet
  chips?: FeatureChip[]
}

export const featureHighlights = [
  { value: "Free", label: "No ads, no paywall" },
  { value: "Offline", label: "Read without a connection" },
  { value: "Any device", label: "Phone, tablet, desktop, e-ink" },
  { value: "GPL-3.0", label: "Open source, self-hostable" },
]

export const featureGroups: FeatureGroup[] = [
  {
    id: "reader",
    Icon: AutoStoriesRounded,
    navLabel: "Reader",
    overline: "Reader",
    title: "One reader for every kind of book",
    description: (
      <>
        Novels reflow to your screen, manga turns right to left, webtoons
        scroll. The reader is built on{" "}
        <Link href="https://prose-reader.com/" target="_blank" rel="noreferrer">
          Prose
        </Link>
        , an engine designed to open any kind of content.
      </>
    ),
    screenshots: {
      primary: {
        src: epubReaderScreenshot,
        alt: "oboku reader displaying a chapter of an EPUB novel, with its menu and progress bar",
      },
      secondary: {
        src: mangaReaderScreenshot,
        alt: "Black and white manga page open in the oboku reader",
      },
    },
    chips: supportedExtensions.map((extension) => ({ label: extension })),
    features: [
      {
        Icon: AutoStoriesRounded,
        title: "Ebooks, comics, PDF and more",
        description:
          "EPUB, CBZ, CBR, PDF, plain text, and ZIP or RAR archives of images or audio.",
      },
      {
        Icon: SwapHorizRounded,
        title: "Manga read the right way",
        description:
          "Comic archives open right to left by default, and the reading direction can be set per book.",
      },
      {
        Icon: SwapVertRounded,
        title: "Webtoon mode",
        description:
          "Long strips are displayed vertically with free scrolling, the way they were drawn.",
      },
      {
        Icon: SearchRounded,
        title: "Search inside a book",
        description: "Find a passage or a word anywhere in the book.",
      },
      {
        Icon: BorderColorRounded,
        title: "Bookmarks, highlights and notes",
        description:
          "Bookmark a page, highlight a passage and add a note to it. They sync to all your devices.",
      },
      {
        Icon: FullscreenRounded,
        title: "Distraction-free",
        description:
          "Open books in fullscreen, keep the screen awake, and choose whether to show the time and your progress.",
      },
      {
        Icon: HistoryRounded,
        title: "Pick up where you left off",
        description:
          "Your reading position follows you from one device to the next.",
      },
    ],
  },
  {
    id: "sources",
    Icon: CloudRounded,
    navLabel: "Sync",
    overline: "Your storage",
    title: "Your books stay where they already are",
    description:
      "Connect the storage you already use and oboku builds your library from it. Book files are never stored on oboku's servers: only your library, your reading progress and your annotations are synced.",
    screenshots: {
      primary: {
        src: dataSourcesScreenshot,
        alt: "oboku data sources screen with a Google Drive library being synchronized",
      },
      secondary: {
        src: addDataSourceScreenshot,
        alt: "Adding an oboku data source from Dropbox or Google Drive",
      },
    },
    chips: syncProviders,
    features: [
      {
        Icon: CloudRounded,
        title: "Cloud drives",
        description:
          "Link folders from Google Drive, Dropbox or OneDrive in a few taps.",
      },
      {
        Icon: StorageRounded,
        title: "NAS and servers",
        description: "Read straight from Synology Drive or any WebDAV server.",
      },
      {
        Icon: RssFeedRounded,
        title: "OPDS catalogs",
        description:
          "Sync the books of a Komga, Calibre-Web or Kavita catalog.",
      },
      {
        Icon: UploadFileRounded,
        title: "Upload from your device",
        description: "Add books stored on your phone or computer.",
      },
      {
        Icon: SyncRounded,
        title: "Synchronize in one tap",
        description:
          "New books and folders in your data sources are picked up on every sync.",
      },
      {
        Icon: ShareRounded,
        title: "Share a library",
        description:
          "Share a folder from your drive and your friends can build their own library from it.",
      },
    ],
  },
  {
    id: "library",
    Icon: CollectionsBookmarkRounded,
    navLabel: "Library",
    overline: "Library",
    title: "A library that organizes itself",
    description:
      "Covers, titles, authors and series details are filled in for you. Organize the rest with shelves, tags and filters.",
    screenshots: {
      primary: {
        src: libraryScreenshot,
        alt: "oboku library grid with books, collections and tags tabs",
      },
      secondary: {
        src: bookDetailsScreenshot,
        alt: "oboku book details page with cover, authors and download button",
      },
      tertiary: {
        src: homeScreenshot,
        alt: "oboku home screen with continue reading and recently added books",
      },
    },
    features: [
      {
        Icon: AutoAwesomeRounded,
        title: "Automatic metadata",
        description:
          "Read from the file itself, then completed from Google Books, Open Library, MangaDex, MangaUpdates, ComicVine and more.",
      },
      {
        Icon: CollectionsBookmarkRounded,
        title: "Shelves and series",
        description:
          "Shelves keep related books together, and series get their publisher, status, start year and rating.",
      },
      {
        Icon: LocalOfferRounded,
        title: "Tags",
        description:
          "Group books your way, and decide how tagged books behave: protected, or with blurred covers.",
      },
      {
        Icon: DriveFileRenameOutlineRounded,
        title: "Directives",
        description:
          'Name a file "[oboku~tags~manga]" or "[oboku~webtoon]" and oboku tags or displays it accordingly on sync.',
      },
      {
        Icon: FilterListRounded,
        title: "Search, sort and filter",
        description:
          "Find any book or shelf, and filter your library by tag, reading state or what is downloaded.",
      },
      {
        Icon: TaskAltRounded,
        title: "Track what you read",
        description:
          "Mark books as finished or not interested, and see where you stand in every series.",
      },
    ],
  },
  {
    id: "offline",
    Icon: WifiOffRounded,
    navLabel: "Offline",
    overline: "Offline & devices",
    title: "Offline-first, on every device",
    description:
      "oboku is a progressive web app: anything with a modern browser runs it, and it keeps working when the connection drops.",
    screenshots: {
      primary: {
        src: manageStorageScreenshot,
        alt: "oboku storage screen listing books downloaded for offline reading",
      },
      secondary: {
        src: libraryEInkScreenshot,
        alt: "oboku library in e-ink mode, with a high-contrast monochrome interface",
      },
    },
    features: [
      {
        Icon: WifiOffRounded,
        title: "Read without a connection",
        description:
          "Download a book once and read it anywhere. Changes made offline sync when you are back online.",
      },
      {
        Icon: InstallMobileRounded,
        title: "Install it like an app",
        description:
          "Add oboku to your home screen on iOS, Android or desktop and launch it from its own icon.",
      },
      {
        Icon: DevicesRounded,
        title: "The same library everywhere",
        description:
          "Your library, reading progress and annotations are synced between all your devices.",
      },
      {
        Icon: ContrastRounded,
        title: "E-ink mode",
        description:
          "Higher contrast and no animations, made for e-ink tablets and readers.",
      },
      {
        Icon: DownloadForOfflineRounded,
        title: "Manage your downloads",
        description:
          "See what is stored on the device and free space whenever you need it.",
      },
      {
        Icon: ShieldRounded,
        title: "Storage protection",
        description:
          "Ask the browser to never clear oboku's data on its own to reclaim space.",
      },
    ],
  },
  {
    id: "opds",
    Icon: RssFeedRounded,
    navLabel: "OPDS",
    overline: "OPDS server",
    title: "Browse your library from your e-reader",
    description:
      "Serve your Google Drive and WebDAV books as an OPDS catalog. KOReader and other reading apps browse it and download its books through oboku's server. No server to install: it comes with oboku, in the cloud or self-hosted.",
    chips: [
      { label: "KOReader" },
      { label: "OPDS 1.2" },
      { label: "OPDS 2.0" },
    ],
    features: [
      {
        Icon: CollectionsBookmarkRounded,
        title: "All books and shelves",
        description:
          "Browse every book, newest first, or your shelves as the app shows them. Each book comes with its cover.",
      },
      {
        Icon: CloudRounded,
        title: "Google Drive and WebDAV",
        description:
          "Catalogs serve the books oboku reads from Google Drive and from connected WebDAV servers. Other sources are not available yet.",
      },
      {
        Icon: RssFeedRounded,
        title: "OPDS 1.2 and 2.0",
        description:
          "Each server has a catalog address for each version, so apps that read either one can connect.",
      },
      {
        Icon: DevicesOtherRounded,
        title: "One server per device",
        description:
          "Create several servers, each with its own address and password. Rename one, replace its password or delete it without touching the others.",
      },
      {
        Icon: PasswordRounded,
        title: "A password for your devices",
        description:
          "Reading apps sign in with a generated password that only opens the catalog, never with your account password.",
      },
      {
        Icon: VisibilityOffRounded,
        title: "Private books stay out",
        description:
          "Books under a protected tag and books marked not interested never show up in a catalog.",
      },
    ],
  },
  {
    id: "koreader",
    Icon: CloudSyncRounded,
    navLabel: "KOReader",
    overline: "KOReader sync",
    title: "Sync with KOReader, both ways",
    description:
      "Point KOReader at oboku and every device running it keeps the same reading position, whichever one you pick up. No server to install and no extra account: it comes with oboku, in the cloud or self-hosted. Turn on progress sync and oboku's own reader joins in.",
    chips: [
      { label: "KOReader" },
      { label: "Readest" },
      { label: "CrossPoint" },
    ],
    features: [
      {
        Icon: SyncRounded,
        title: "Set up from Integrations",
        description:
          "Generate a password in oboku, then enter it in KOReader's progress sync settings with the server and your username.",
      },
      {
        Icon: DevicesOtherRounded,
        title: "Not just KOReader",
        description:
          "Readest, CrossPoint and the other apps that support KOReader sync connect the same way.",
      },
      {
        Icon: PasswordRounded,
        title: "A password for your devices",
        description:
          "Devices sign in with a password generated for them, not your account password. Replace it or turn the server off at any time.",
      },
      {
        Icon: AutoStoriesRounded,
        title: "oboku's reader syncs too",
        description:
          "Turn on KOReader progress sync in Integrations: EPUBs, PDFs and comics open where your e-reader left them, and the other way round, even after reading offline.",
      },
      {
        Icon: DnsRounded,
        title: "Any KOReader sync server",
        description:
          "oboku's reader syncs through oboku's own server, KOReader's public one, or one you host, as long as oboku can reach it.",
      },
    ],
  },
  {
    id: "privacy",
    Icon: LockRounded,
    navLabel: "Privacy",
    overline: "Privacy & control",
    title: "Private by design, safe to share",
    description:
      "Share an account with your family without sharing everything in it. Sensitive content stays hidden, and your credentials stay yours.",
    screenshots: {
      primary: {
        src: profileScreenshot,
        alt: "oboku profile screen with the app password and hidden protected contents",
      },
    },
    features: [
      {
        Icon: LockRounded,
        title: "App password",
        description:
          "Lock hidden content and confirm destructive actions, on every device of your account.",
      },
      {
        Icon: VisibilityOffRounded,
        title: "Protected content",
        description:
          "Protected books and tags are hidden until unlocked, and never sent to external metadata services by default.",
      },
      {
        Icon: BlurOnRounded,
        title: "Blurred covers",
        description: "Blur the covers of every book carrying a given tag.",
      },
      {
        Icon: KeyRounded,
        title: "Encrypted secrets",
        description:
          "Credentials for your data sources are encrypted with a master password only you know.",
      },
    ],
  },
  {
    id: "optimize",
    Icon: CompressRounded,
    navLabel: "Optimize",
    overline: "Book tools",
    title: "Make your books lighter and cleaner",
    description:
      "Inspect any book, shrink oversized comics, fix its identifiers, and save the result back to where it came from.",
    features: [
      {
        Icon: CompressRounded,
        title: "Compress images",
        description:
          "Re-encode the pages of heavy comics to save space and download time.",
      },
      {
        Icon: ImageRounded,
        title: "Modern image formats",
        description: "Convert pages to WebP or AVIF, or keep the originals.",
      },
      {
        Icon: AspectRatioRounded,
        title: "Resize pages",
        description:
          "Cap the width and height of oversized scans to fit your screens.",
      },
      {
        Icon: EditNoteRounded,
        title: "Fix identifiers",
        description:
          "Add or correct a book's ISBN and other identifiers so its metadata matches.",
      },
      {
        Icon: CloudUploadRounded,
        title: "Save back to the source",
        description:
          "Upload the optimized book back to its data source, or download it to your device.",
      },
    ],
  },
  {
    id: "open-source",
    Icon: CodeRounded,
    navLabel: "Open source",
    overline: "Open source",
    title: "Free, open source and self-hostable",
    description:
      "No ads, no paywall. Use the cloud version, or run everything on your own hardware.",
    features: [
      {
        Icon: CodeRounded,
        title: "Open source",
        description:
          "The whole project is public under the GPL-3.0 license. Contributions are welcome.",
      },
      {
        Icon: DnsRounded,
        title: "Self-host with Docker",
        description:
          "Run your own instance with Docker Compose and keep every piece of data under your control.",
      },
      {
        Icon: FolderSharedRounded,
        title: "Server sync",
        description:
          "A self-hosted instance can expose books stored on the server or your NAS as a data source.",
      },
      {
        Icon: AdminPanelSettingsRounded,
        title: "Admin panel",
        description:
          "Manage users, instance settings, usage and more from a dedicated admin panel.",
      },
      {
        Icon: VolunteerActivismRounded,
        title: "Driven by its readers",
        description:
          "Features ship regularly and follow what users ask for on Discord and Reddit.",
      },
    ],
  },
]
