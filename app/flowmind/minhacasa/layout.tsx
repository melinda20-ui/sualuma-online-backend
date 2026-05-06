import LogoutFloatingButton from "@/components/system/LogoutFloatingButton";

export default function DashboardLogoutLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <>
      <LogoutFloatingButton />
      {children}
    </>
  );
}
