import type { Metadata } from "next"
import { Inter, Roboto } from "next/font/google"
import "./globals.css"
import { AppRouterCacheProvider } from "@mui/material-nextjs/v15-appRouter"
import { CssBaseline, Stack, ThemeProvider } from "@mui/material"
import { theme } from "../theme"
import AppBar from "../features/home/AppBar"
import { Footer } from "../features/home/Footer"

const inter = Inter({ subsets: ["latin"] })
const roboto = Roboto({
  subsets: ["latin"],
  weight: ["300", "400", "500", "700"],
  display: "swap",
})

export const metadata: Metadata = {
  title: "oboku | Your digital library",
  description:
    "Your books, your cloud! Access, read and sync your personal library from your cloud, anytime, anywhere.",
}

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode
}>) {
  return (
    <html lang="en">
      <head>
        <link rel="icon" href="/favicon.ico" sizes="any" />
      </head>
      <body className={`${inter.className} ${roboto.className}`}>
        <CssBaseline />
        <AppRouterCacheProvider>
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
