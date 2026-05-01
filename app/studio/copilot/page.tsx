import { CopilotMiaSuggestions } from "@/components/studio/CopilotMiaSuggestions";

export const dynamic = "force-dynamic";

export default function StudioCopilotPage() {
  return (
    <main style={{ minHeight: "100vh", padding: 24, background: "#020617" }}>
      <CopilotMiaSuggestions />
    </main>
  );
}
