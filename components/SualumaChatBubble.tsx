"use client";

import { useState } from "react";
import SualumaChatCore from "./SualumaChatCore";

export default function SualumaChatBubble({
  channel = "dashboard",
  agentSlug = "mia",
}: {
  channel?: string;
  agentSlug?: string;
}) {
  const [open, setOpen] = useState(false);

  return (
    <>
      {open && (
        <div className="fixed bottom-24 right-5 z-50 h-[680px] w-[min(420px,calc(100vw-40px))] overflow-hidden rounded-3xl border border-white/10 bg-black shadow-2xl">
          <SualumaChatCore
            variant="embedded"
            channel={channel}
            agentSlug={agentSlug}
          />
        </div>
      )}

      <button
        onClick={() => setOpen((value) => !value)}
        className="fixed bottom-5 right-5 z-50 grid h-16 w-16 place-items-center rounded-full bg-gradient-to-r from-violet-500 to-cyan-400 text-2xl shadow-2xl shadow-cyan-500/20"
        aria-label="Abrir chat SuaLuma"
      >
        {open ? "×" : "💬"}
      </button>
    </>
  );
}
