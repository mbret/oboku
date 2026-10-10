import {
  AdminPanelSettingsRounded,
  AspectRatioRounded,
  AutoAwesomeRounded,
  AutoStoriesRounded,
  BlurOnRounded,
  CloudRounded,
  CloudUploadRounded,
  CodeRounded,
  CollectionsBookmarkRounded,
  CompressRounded,
  ContrastRounded,
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
import type { StaticImageData } from "next/image"
import { links } from "@oboku/shared"
import comicReaderScreenshot from "../home/assets/oboku-git-develop-mbret.vercel.app_library_books(iPhone SE) (1).png"
import libraryScreenshot from "../home/assets/oboku-git-develop-mbret.vercel.app_library_books(iPhone SE).png"
import epubReaderScreenshot from "../home/assets/image1.png"
import bookDetailsScreenshot from "../home/assets/image2.png"
import storageScreenshot from "../home/assets/image3.png"
import dataSourcesScreenshot from "../home/assets/image4.png"
import profileScreenshot from "../home/assets/image7.png"
import addDataSourceScreenshot from "../home/assets/image8.png"
import einkScreenshot from "../home/assets/image9.png"
import { supportedExtensions, syncProviders } from "../home/content"

type Feature = {
  title: string
  description: string
  Icon: SvgIconComponent
}

type Screenshot = {
  src: StaticImageData
  alt: string
}

type FeatureChip = {
  label: string
  href?: string
}

export type FeatureGroup = {
  id: string
  navLabel: string
  overline: string
  title: string
  description: string
  features: Feature[]
  screenshots: Screenshot[]
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
    navLabel: "Reader",
    overline: "Reader",
    title: "One reader for every kind of book",
    description:
      "Novels reflow to your screen, manga turns right to left, webtoons scroll. The reader is built on Prose, an engine designed to open any kind of content.",
    screenshots: [
      {
        src: comicReaderScreenshot,
        alt: "A comic page open in the oboku reader with the progress bar",
      },
      {
        src: epubReaderScreenshot,
        alt: "oboku reader displaying a chapter of an EPUB novel",
      },
    ],
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
    navLabel: "Sync",
    overline: "Your storage",
    title: "Your books stay where they already are",
    description:
      "Connect the storage you already use and oboku builds your library from it. Book files are never stored on oboku's servers: only your library, collections and progress are synced.",
    screenshots: [
      {
        src: dataSourcesScreenshot,
        alt: "oboku data sources screen with a Google Drive library being synchronized",
      },
      {
        src: addDataSourceScreenshot,
        alt: "Adding an oboku data source from Dropbox or Google Drive",
      },
    ],
    chips: syncProviders.map(({ label, docsPath }) => ({
      label,
      href: `${links.documentation}/${docsPath}`,
    })),
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
    navLabel: "Library",
    overline: "Library",
    title: "A library that organizes itself",
    description:
      "Covers, titles, authors and series details are filled in for you. Organize the rest with collections, tags and filters.",
    screenshots: [
      {
        src: libraryScreenshot,
        alt: "oboku library grid with books, collections and tags tabs",
      },
      {
        src: bookDetailsScreenshot,
        alt: "oboku book details page with cover, authors and download button",
      },
    ],
    features: [
      {
        Icon: AutoAwesomeRounded,
        title: "Automatic metadata",
        description:
          "Read from the file itself, then completed from Google Books, MangaDex, MangaUpdates, ComicVine and more.",
      },
      {
        Icon: CollectionsBookmarkRounded,
        title: "Collections and series",
        description:
          "Folders become collections. Turn one into a series to get its publisher, status, start year and rating.",
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
          "Find any book or collection, and filter your library by tag, reading state or what is downloaded.",
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
    navLabel: "Offline",
    overline: "Offline & devices",
    title: "Offline-first, on every device",
    description:
      "oboku is a progressive web app: anything with a modern browser runs it, and it keeps working when the connection drops.",
    screenshots: [
      {
        src: storageScreenshot,
        alt: "oboku storage screen listing books downloaded for offline reading",
      },
      {
        src: einkScreenshot,
        alt: "oboku library in e-ink mode, with a high-contrast monochrome interface",
      },
    ],
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
          "Your library, collections and progress are synced between all your devices.",
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
    id: "privacy",
    navLabel: "Privacy",
    overline: "Privacy & control",
    title: "Private by design, safe to share",
    description:
      "Share an account with your family without sharing everything in it. Sensitive content stays hidden, and your credentials stay yours.",
    screenshots: [
      {
        src: profileScreenshot,
        alt: "oboku profile screen with the app password and hidden protected contents",
      },
    ],
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
    navLabel: "Optimize",
    overline: "Book tools",
    title: "Make your books lighter and cleaner",
    description:
      "Inspect any book, shrink oversized comics, fix its identifiers, and save the result back to where it came from.",
    screenshots: [],
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
    navLabel: "Open source",
    overline: "Open source",
    title: "Free, open source and self-hostable",
    description:
      "No ads, no paywall. Use the cloud version, or run everything on your own hardware.",
    screenshots: [],
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
          "Create user accounts and configure server sync from a dedicated admin panel.",
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
