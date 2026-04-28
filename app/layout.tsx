import './globals.css'
import AuthWelcomeEmail from "@/components/AuthWelcomeEmail";
import ChoosePlanPopup from "@/components/ChoosePlanPopup";
import AuthCookieBridge from "@/components/AuthCookieBridge";
import LoginMobileSafeFix from "@/components/LoginMobileSafeFix";

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
        <LoginMobileSafeFix />
        
        <AuthCookieBridge />{children}          <AuthWelcomeEmail />
                  <ChoosePlanPopup />
        </body>
    </html>
  )
}