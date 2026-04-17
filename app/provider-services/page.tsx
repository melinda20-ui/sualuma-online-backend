import { auth } from "@clerk/nextjs/server";
import { redirect } from "next/navigation";

export default async function ProviderDashboard() {
  const { userId } = await auth();

  if (!userId) {
    redirect("/sign-in");
  }

  return (
    <main className="min-h-screen bg-[#050507] text-white p-4">

      <h1 className="text-2xl font-bold mb-4">Painel do Prestador</h1>

      {/* 🔥 GRID PRINCIPAL */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-4">

        {/* 🧩 KANBAN */}
        <div className="col-span-2 bg-[#0b0d12] rounded-xl p-4">
          <h2 className="mb-3 font-semibold">Projetos</h2>

          <div className="grid grid-cols-3 gap-3">

            {["A Fazer", "Em Andamento", "Finalizando"].map((col) => (
              <div key={col} className="bg-black/40 rounded-lg p-2">
                <h3 className="text-sm mb-2">{col}</h3>

                <div className="space-y-2">
                  <div className="bg-[#111] p-2 rounded text-xs">
                    Site imobiliária
                  </div>

                  <div className="bg-[#111] p-2 rounded text-xs">
                    Página vendas IA
                  </div>
                </div>
              </div>
            ))}

          </div>
        </div>

        {/* 💰 FINANCEIRO */}
        <div className="bg-[#0b0d12] rounded-xl p-4">
          <h2 className="mb-3 font-semibold">Financeiro</h2>

          <p className="text-sm">Vendas: R$ 4.500</p>
          <p className="text-sm">A receber: R$ 2.000</p>
          <p className="text-sm">Comissão: R$ 500</p>
        </div>

        {/* 💬 CHAT CLIENTE */}
        <div className="col-span-2 bg-[#0b0d12] rounded-xl p-4">
          <h2 className="mb-3 font-semibold">Chat com cliente</h2>

          <div className="h-40 overflow-y-auto text-xs space-y-2">
            <div className="bg-[#111] p-2 rounded">Cliente: Quero algo moderno</div>
            <div className="bg-[#222] p-2 rounded">Você: Perfeito, vou montar opções</div>
          </div>

          <input
            placeholder="Responder..."
            className="mt-2 w-full bg-black/40 p-2 rounded text-xs"
          />
        </div>

        {/* 🤖 IA */}
        <div className="bg-[#0b0d12] rounded-xl p-4">
          <h2 className="mb-3 font-semibold">Assistente IA</h2>

          <div className="text-xs mb-2">
            Sugestão: criar landing page moderna
          </div>

          <input
            placeholder="Fale com IA..."
            className="w-full bg-black/40 p-2 rounded text-xs"
          />
        </div>

        {/* 📁 PROJETOS */}
        <div className="col-span-3 bg-[#0b0d12] rounded-xl p-4">
          <h2 className="mb-3 font-semibold">Projetos Recentes</h2>

          <div className="grid grid-cols-2 md:grid-cols-4 gap-3">

            {["Loja Moda", "Site Coach", "Landing IA", "Ecommerce"].map((p) => (
              <div key={p} className="bg-black/40 p-3 rounded text-xs">
                {p}
              </div>
            ))}

          </div>
        </div>

        {/* 🔘 AÇÕES */}
        <div className="col-span-3 flex gap-2">

          {["Marketplace", "Agentes", "Edição Vídeo"].map((btn) => (
            <button
              key={btn}
              className="bg-[#7A00FF] px-4 py-2 rounded text-xs"
            >
              {btn}
            </button>
          ))}

        </div>

      </div>

    </main>
  );
}
