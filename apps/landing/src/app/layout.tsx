import type { Metadata } from "next"
import { Inter, Roboto } from "next/font/google"
import "./globals.css"
import { AppRouterCacheProvider } from "@mui/material-nextjs/v15-appRouter"
import { CssBaseline, Stack, ThemeProvider } from "@mui/material"
import { theme } from "../theme"
import AppBar from "../features/home/AppBar"
import { landingDescription, landingTagline } from "../features/home/content"
import { Footer } from "../features/home/Footer"
import { links } from "@oboku/shared"

const inter = Inter({ subsets: ["latin"] })
const roboto = Roboto({
  subsets: ["latin"],
  weight: ["300", "400", "500", "700"],
  display: "swap",
})

// Every page inherits this. `./` resolves against each page's own pathname,
// and Next.js fills the Open Graph and Twitter title and description from each
// page's own: absolute values here would make every page claim the home page's.
export const metadata: Metadata = {
  metadataBase: new URL(links.site),
  title: {
    default: `oboku – ${landingTagline}`,
    template: "%s | oboku",
  },
  description: landingDescription,
  openGraph: {
    url: "./",
    siteName: "oboku",
    locale: "en_US",
    type: "website",
  },
  alternates: {
    canonical: "./",
  },
}

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode
}>) {
  return (
    <html lang="en" className={`${inter.className} ${roboto.className}`}>
      <head>
        <link rel="icon" href="/favicon.ico" sizes="any" />
      </head>
      <body>
        <AppRouterCacheProvider>
          <CssBaseline />
          <ThemeProvider theme={theme}>
            <Stack>
              <AppBar />
              {children}
              <Footer />
            </Stack>
          </ThemeProvider>
        </AppRouterCacheProvider>
      </body>
    </html>
  )
}
