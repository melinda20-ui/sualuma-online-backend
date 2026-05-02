import Link from "next/link";
import TemplateUseButton from "../../components/TemplateUseButton";
import { getTemplateBySlug } from "../../lib/templates";

type PageProps = {
  searchParams: Promise<{
    kind?: string;
    slug?: string;
    session_id?: string;
  }>;
};

export const dynamic = "force-dynamic";

export default async function Page({ searchParams }: PageProps) {
  const params = await searchParams;
  const kind = String(params.kind || "");
  const slug = String(params.slug || "");
  const sessionId = String(params.session_id || "");

  const template = kind === "template" ? getTemplateBySlug(slug) : null;

  return (
    <main className="fm-commerce">
      <section className="fm-checkout-success">
        <div className="fm-checkout-success-icon">✅</div>
        <span>CHECKOUT FLOWMATIC</span>
        <h1>Checkout concluído.</h1>
        <p>
          A Stripe redirecionou você de volta para o Flowmatic. O próximo passo
          técnico será validar webhooks para liberar automaticamente planos e
          templates por usuário.
        </p>

        {sessionId && (
          <small>
            Sessão Stripe: <code>{sessionId}</code>
          </small>
        )}

        {template ? (
          <div className="fm-checkout-next-box">
            <h2>Ativar template comprado</h2>
            <p>
              Enquanto o webhook definitivo não está ligado, este botão ativa o
              template no workspace demo.
            </p>
            <TemplateUseButton
              slug={template.slug}
              name={template.name}
              price="Grátis"
            />
          </div>
        ) : (
          <div className="fm-checkout-next-box">
            <h2>Plano recebido</h2>
            <p>
              O checkout do plano foi iniciado com sucesso. Na próxima etapa,
              vamos gravar a assinatura no Supabase via webhook da Stripe.
            </p>
          </div>
        )}

        <div className="fm-checkout-success-actions">
          <Link href="/flowmind" className="fm-commerce-btn primary">
            Ir para o app
          </Link>
          <Link href="/flowmind/meus-templates" className="fm-commerce-btn">
            Meus templates
          </Link>
        </div>
      </section>
    </main>
  );
}
