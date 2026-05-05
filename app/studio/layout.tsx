import TaskAgentSmartChat from "@/components/studio/TaskAgentSmartChat";

export default function StudioLayout({ children }: { children: React.ReactNode }) {
  return (
    <>
      {children}
      <TaskAgentSmartChat />
    </>
  );
}
