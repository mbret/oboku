import type { Metadata } from "next"

export const metadata: Metadata = {
  title: "Delete your account",
  description:
    "How to delete your oboku account and its data, in the app or by email.",
}

export default function RootLayout({
  children,
}: {
  children: React.ReactNode
}) {
  return <>{children}</>
}
