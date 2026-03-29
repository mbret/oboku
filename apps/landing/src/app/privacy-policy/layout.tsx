import type { Metadata } from "next"

export const metadata: Metadata = {
  title: "Privacy Policy",
  description:
    "Learn how oboku handles your data, what information is collected, and your privacy rights.",
}

export default async function RootLayout({
  children,
}: {
  children: React.ReactNode
}) {
  return <>{children}</>
}
