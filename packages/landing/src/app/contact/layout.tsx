import { Metadata } from "next"

export async function generateMetadata({}: {}): Promise<Metadata> {
  return {
    title: `oboku | Contact`
  }
}

export default async function RootLayout({
  children
}: {
  children: React.ReactNode
  params: { locale: string }
}) {
  return <>{children}</>
}
