import { Metadata } from "next"

export async function generateMetadata({}: {}): Promise<Metadata> {
  return {
    title: `oboku | Terms and conditions`
  }
}

export default async function RootLayout({
  children
}: {
  children: React.ReactNode
}) {
  return <>{children}</>
}
