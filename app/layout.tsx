import TemporaryDisablePlanPopup from "@/components/TemporaryDisablePlanPopup";
import StudioMenuCollapse from "@/components/StudioMenuCollapse";
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
        
        
        <AuthCookieBridge /><TemporaryDisablePlanPopup />
          {children}          <AuthWelcomeEmail />
                  <ChoosePlanPopup />
                <StudioMenuCollapse />
      </body>
    </html>
  )
}