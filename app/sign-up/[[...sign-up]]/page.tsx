import { SignUp } from "@clerk/nextjs";

export default function Page() {
  return (
    <main className="min-h-screen bg-[#050507] text-white flex items-center justify-center p-6">
      <div className="w-full max-w-md rounded-[32px] border border-white/10 bg-white/[0.04] p-6 shadow-[0_0_40px_rgba(122,0,255,0.08)] backdrop-blur-xl">
        <SignUp />
      </div>
    </main>
  );
}
