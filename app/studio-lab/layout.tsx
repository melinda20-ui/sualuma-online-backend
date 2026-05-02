import HideLegacySupportButton from "./HideLegacySupportButton";
import MiaStudioChat from "./MiaStudioChat";

export default function StudioLabLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <>
      {children}
      <HideLegacySupportButton />
      <MiaStudioChat />
    </>
  );
}
