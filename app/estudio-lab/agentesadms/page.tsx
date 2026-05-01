import "./agentesadms.css";
import "./adms-robot-overlay.css";
import AgentesAdmsClient from "./AgentesAdmsClient";
import AdmsVoiceRobotOverlay from "./AdmsVoiceRobotOverlay";

export default function Page() {
  return (
    <>
      <AgentesAdmsClient />
      <AdmsVoiceRobotOverlay />
    </>
  );
}
