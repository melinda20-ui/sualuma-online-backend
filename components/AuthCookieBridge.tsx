"use client";

import { useEffect } from "react";
import { createClient } from "@/lib/supabase/client";

export default function AuthCookieBridge() {
  useEffect(() => {
    const supabase = createClient();
    let lastSync = "";

    async function syncSession(session: any) {
      try {
        if (!session?.access_token || !session?.refresh_token) return;

        const syncKey = `${session.access_token.slice(0, 18)}:${session.refresh_token.slice(0, 18)}`;
        if (syncKey === lastSync) return;
        lastSync = syncKey;

        await fetch("/api/auth/sync", {
          method: "POST",
          headers: {
            "Content-Type": "application/json",
          },
          credentials: "include",
          body: JSON.stringify({
            access_token: session.access_token,
            refresh_token: session.refresh_token,
          }),
        });
      } catch {
        // Silencioso para não quebrar a navegação do usuário.
      }
    }

    supabase.auth.getSession().then(({ data }) => {
      syncSession(data.session);
    });

    const { data } = supabase.auth.onAuthStateChange((_event, session) => {
      syncSession(session);
    });

    return () => {
      data.subscription.unsubscribe();
    };
  }, []);

  return null;
}
