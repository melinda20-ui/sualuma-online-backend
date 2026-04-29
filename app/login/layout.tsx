import LoginMobileTitleFix from "@/components/LoginMobileTitleFix";
import LoginMobileRobotBelowText from "@/components/LoginMobileRobotBelowText";

import type { ReactNode } from "react";
import LoginSignupRedirect from "./LoginSignupRedirect";

export default function LoginLayout({ children }: { children: ReactNode }) {
  return (
    <>
      <LoginMobileTitleFix />
      <LoginMobileRobotBelowText />
      
      {children}
      <LoginSignupRedirect />
    </>
  );
}
