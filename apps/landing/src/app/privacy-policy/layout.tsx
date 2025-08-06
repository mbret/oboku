import type { Metadata } from "next"

// biome-ignore lint/correctness/noEmptyPattern: TODO
// biome-ignore lint/complexity/noBannedTypes: TODO
export async function generateMetadata({}: {}): Promise<Metadata> {
  return {
    title: `oboku | Terms and conditions`,
  }
}

export default async function RootLayout({
  children,
}: {
  children: React.ReactNode
}) {
  return <>{children}</>
}
