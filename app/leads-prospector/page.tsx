import LeadProspectorAgentPanel from "@/components/leads-prospector/LeadProspectorAgentPanel";
import LeadsProspectorCRM from "@/components/leads-prospector/LeadsProspectorCRM";

export const dynamic = "force-dynamic";

export default function LeadsProspectorPage() {
  return <LeadProspectorAgentPanel />
      <LeadsProspectorCRM />;
}
