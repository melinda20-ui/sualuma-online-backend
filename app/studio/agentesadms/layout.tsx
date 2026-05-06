import TaskAgentChat from "@/components/studio/TaskAgentChat";

export default function AgentesAdmsLayout({
  children
}: {
  children: React.ReactNode;
}) {
  return (
    <>
      {children}
      <TaskAgentChat />
    </>
  );
}
