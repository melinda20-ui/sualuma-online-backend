import './globals.css'
import AuthWelcomeEmail from "@/components/AuthWelcomeEmail";
import ChoosePlanPopup from "@/components/ChoosePlanPopup";
import AuthCookieBridge from "@/components/AuthCookieBridge";

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
      <body>
        
        
        <AuthCookieBridge />{children}          <AuthWelcomeEmail />
                  <ChoosePlanPopup />
        </body>
    </html>
  )
}