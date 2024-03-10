import type { Metadata } from "next"
import { Inter } from "next/font/google"
import "./globals.css"
import { AppRouterCacheProvider } from "@mui/material-nextjs/v13-appRouter"
import { CssBaseline, Stack, ThemeProvider } from "@mui/material"
import { theme } from "../theme"
import AppBar from "../features/home/AppBar"
import { Footer } from "../features/home/Footer"

const inter = Inter({ subsets: ["latin"] })

export const metadata: Metadata = {
  title: "oboku | Your digital library",
  description:
    "Your books, your cloud! Access, read and sync your personal library from your cloud, anytime, anywhere."
}

export default function RootLayout({
  children
}: Readonly<{
  children: React.ReactNode
}>) {
  return (
    <html lang="en">
      <head>
        <link rel="icon" href="/favicon.ico" sizes="any" />
        <link rel="preconnect" href="https://fonts.googleapis.com" />
        <link
          rel="preconnect"
          href="https://fonts.gstatic.com"
          crossOrigin="anonymous"
        />
        <link
          rel="stylesheet"
          href="https://fonts.googleapis.com/css2?family=Roboto:wght@300;400;500;700&display=swap"
        />
      </head>
      <body className={inter.className}>
        <CssBaseline />
        <AppRouterCacheProvider>
          <ThemeProvider theme={theme}>
            <Stack >
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
