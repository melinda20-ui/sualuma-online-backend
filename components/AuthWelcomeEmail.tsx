"use client";

import { useEffect } from "react";
import { createClient as createBrowserSupabaseClient } from "@/lib/supabase/client";

export default function AuthWelcomeEmail() {
  useEffect(() => {
    const supabase = createBrowserSupabaseClient();

    async function sendWelcomeEmail() {
      try {
        const { data } = await supabase.auth.getUser();
        const user = data?.user;

        if (!user?.email) return;

        const storageKey = `sualuma_welcome_email_sent_v1:${user.email}`;

        if (typeof window !== "undefined" && localStorage.getItem(storageKey)) {
          return;
        }

        const name =
          user.user_metadata?.name ||
          user.user_metadata?.full_name ||
          user.user_metadata?.display_name ||
          "";

        const response = await fetch("/api/auth/welcome-email", {
          method: "POST",
          headers: {
            "Content-Type": "application/json",
          },
          body: JSON.stringify({
            email: user.email,
            name,
          }),
        });

        if (response.ok && typeof window !== "undefined") {
          localStorage.setItem(storageKey, "1");
        }
      } catch {
        // Não trava a plataforma se o e-mail falhar.
      }
    }

    sendWelcomeEmail();

    const { data: listener } = supabase.auth.onAuthStateChange((event) => {
      if (event === "SIGNED_IN") {
        sendWelcomeEmail();
      }
    });

    return () => {
      listener.subscription.unsubscribe();
    };
  }, []);

  return null;
}
