import type { ReactNode } from "react";
import PlanGate from "@/components/PlanGate";

export default function PortalLayout({ children }: { children: ReactNode }) {
  return (
    <>
      {children}
      <PlanGate />
    </>
  );
}
