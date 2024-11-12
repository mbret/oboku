import { Metadata } from "next"

export async function generateMetadata(): Promise<Metadata> {
  return {
    title: `oboku | Contact`
  }
}

export default function RootLayout({
  children
}: {
  children: React.ReactNode
}) {
  return <>{children}</>
}
