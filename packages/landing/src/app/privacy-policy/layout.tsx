import type { Metadata } from "next"

// biome-ignore lint/correctness/noEmptyPattern: <explanation>
// biome-ignore lint/complexity/noBannedTypes: <explanation>
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
