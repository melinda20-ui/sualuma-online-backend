import './globals.css'

export const metadata = {
  title: 'Luma OS',
  description: 'Sistema operacional criativo',
}

export default function RootLayout({
  children,
}: {
  children: React.ReactNode
}) {
  return (
    <html lang="pt-br">
      <body>{children}</body>
    </html>
  )
}
