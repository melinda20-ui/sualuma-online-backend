"use server";

import { createClient } from "@/lib/supabase/server";

export async function createLead(formData: FormData) {
  const supabase = await createClient();

  const nome = String(formData.get("nome") || "").trim();
  const email = String(formData.get("email") || "").trim().toLowerCase();

  if (!nome || !email || !email.includes("@")) {
    return {
      ok: false,
      message: "Preencha seu nome e um e-mail válido.",
    };
  }

  const { error } = await supabase.from("leads").insert({
    nome,
    email,
    origem: "Home Sualuma Online",
    status: "novo",
  });

  if (error) {
    return {
      ok: false,
      message: "Não conseguimos salvar agora. Tente novamente.",
    };
  }

  return {
    ok: true,
    message: "Cadastro recebido com sucesso!",
  };
}
