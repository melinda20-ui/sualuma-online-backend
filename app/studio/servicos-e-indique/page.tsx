"use client";

const resumoCards = [
  {
    label: "Modelo principal",
    title: "Venda de serviços",
    text: "A Sua Luma ganha com serviços como sites, automações, conteúdo e marketing.",
  },
  {
    label: "Motor de escala",
    title: "Indicações",
    text: "Pessoas e parceiros trazem novos clientes através de links e campanhas.",
  },
  {
    label: "Receita da plataforma",
    title: "Taxa administrativa",
    text: "Parte do valor mantém a operação, suporte, organização, tecnologia e crescimento.",
  },
  {
    label: "Objetivo",
    title: "Tudo simples",
    text: "Você precisa entender rápido o que entra, o que sai e o que precisa ser feito.",
  },
];

const passos = [
  {
    n: "01",
    title: "O cliente chega",
    text: "Uma pessoa quer site, automação, conteúdo, estratégia ou outro serviço.",
  },
  {
    n: "02",
    title: "O pedido é organizado",
    text: "A plataforma registra o que a pessoa quer e direciona para o fluxo certo.",
  },
  {
    n: "03",
    title: "O prestador executa",
    text: "O profissional certo recebe a demanda e entrega o serviço.",
  },
  {
    n: "04",
    title: "A plataforma recebe a taxa",
    text: "Uma parte do valor fica com a Sua Luma para manter o sistema funcionando.",
  },
  {
    n: "05",
    title: "A indicação pode ganhar",
    text: "Se alguém trouxe esse cliente, essa pessoa pode receber comissão.",
  },
];

const servicos = [
  {
    icon: "🌐",
    title: "Sites e landing pages",
    price: "R$ 500+",
    text: "Páginas de vendas, captura, institucionais e sites completos.",
    badge: "Alta procura",
  },
  {
    icon: "🤖",
    title: "Automações e IA",
    price: "R$ 790+",
    text: "Fluxos automáticos, agentes, atendimento, processos e funis.",
    badge: "Escalável",
  },
  {
    icon: "🎬",
    title: "Conteúdo e vídeos",
    price: "R$ 450+",
    text: "Cortes, edição, thumbnails, roteiros e organização de conteúdo.",
    badge: "Recorrente",
  },
  {
    icon: "📈",
    title: "Marketing e estratégia",
    price: "R$ 790/mês+",
    text: "Linha editorial, calendário, planejamento e direção estratégica.",
    badge: "Assinatura",
  },
];

const indicacoes = [
  {
    icon: "🔗",
    title: "Link de indicação",
    text: "Cada parceiro recebe um link único para divulgar os serviços.",
  },
  {
    icon: "📍",
    title: "Origem rastreada",
    text: "O painel precisa mostrar de onde veio o lead ou cliente.",
  },
  {
    icon: "💸",
    title: "Comissão por resultado",
    text: "A indicação ganha quando a venda ou contrato realmente acontece.",
  },
];

const proximosPassos = [
  "Criar links únicos para cada indicação.",
  "Mostrar quanto entrou de serviço, taxa e comissão.",
  "Listar quais prestadores executam cada tipo de serviço.",
  "Centralizar dúvidas do chat dentro do painel.",
  "Conectar tudo com WhatsApp e notificações.",
];

const perguntas = [
  {
    q: "O que essa página mostra?",
    a: "Ela mostra como a Sua Luma ganha dinheiro com serviços, prestadores e indicações.",
  },
  {
    q: "Quem executa o trabalho?",
    a: "O prestador. Pode ser editor, designer, desenvolvedor, estrategista ou outro profissional.",
  },
  {
    q: "O que é taxa administrativa?",
    a: "É a parte que mantém a plataforma viva: suporte, tecnologia, gestão e estrutura.",
  },
  {
    q: "O que é indicação?",
    a: "É quando alguém traz um cliente. Se esse cliente fechar, pode gerar comissão.",
  },
];

export default function ServicosEIndiquePage() {
  return (
    <main className="page">
      <div className="glow glow1" />
      <div className="glow glow2" />

      <section className="hero">
        <div className="heroLeft">
          <span className="eyebrow">Studio • Serviços e Indicações</span>
          <h1>Dashboard da economia interna</h1>
          <p className="heroText">
            Aqui você entende de forma simples como os serviços entram, como os prestadores executam,
            como a plataforma ganha e como as indicações ajudam a escalar.
          </p>

          <div className="heroButtons">
            <a href="/studio-lab" className="btnPrimary">Voltar ao Studio Lab</a>
            <a href="/studio/indique" className="btnSecondary">Abrir área de indicações</a>
          </div>
        </div>

        <div className="heroRight">
          <div className="focusBox">
            <span className="focusTag">Leitura rápida</span>
            <h2>Leia assim:</h2>
            <ul>
              <li>1. Veja o resumo</li>
              <li>2. Entenda o caminho do dinheiro</li>
              <li>3. Veja os serviços</li>
              <li>4. Veja como a indicação cresce</li>
              <li>5. Veja o que falta fazer</li>
            </ul>
          </div>
        </div>
      </section>

      <section className="grid4">
        {resumoCards.map((card) => (
          <article className="card summaryCard" key={card.title}>
            <span className="cardLabel">{card.label}</span>
            <h3>{card.title}</h3>
            <p>{card.text}</p>
          </article>
        ))}
      </section>

      <section className="panel">
        <div className="panelHeader">
          <div>
            <span className="eyebrow">Mapa simples</span>
            <h2>Como o dinheiro circula</h2>
          </div>
          <span className="tag">Cliente → Serviço → Prestador → Plataforma → Indicação</span>
        </div>

        <div className="flowGrid">
          {passos.map((item) => (
            <article className="card flowCard" key={item.n}>
              <div className="number">{item.n}</div>
              <h3>{item.title}</h3>
              <p>{item.text}</p>
            </article>
          ))}
        </div>
      </section>

      <section className="split">
        <div className="panel">
          <div className="panelHeader">
            <div>
              <span className="eyebrow">Serviços</span>
              <h2>O que gera receita</h2>
            </div>
          </div>

          <div className="serviceGrid">
            {servicos.map((item) => (
              <article className="card serviceCard" key={item.title}>
                <div className="serviceTop">
                  <span className="serviceIcon">{item.icon}</span>
                  <span className="miniTag">{item.badge}</span>
                </div>
                <h3>{item.title}</h3>
                <strong>{item.price}</strong>
                <p>{item.text}</p>
              </article>
            ))}
          </div>
        </div>

        <aside className="panel sidePanel">
          <span className="eyebrow">Resumo infantil</span>
          <h2>Em português claro</h2>

          <div className="plainBox">
            <p><b>1.</b> O cliente pede ajuda.</p>
            <p><b>2.</b> A Sua Luma organiza.</p>
            <p><b>3.</b> O prestador faz.</p>
            <p><b>4.</b> O cliente recebe.</p>
            <p><b>5.</b> A plataforma ganha uma parte.</p>
            <p><b>6.</b> Quem indicou também pode ganhar.</p>
          </div>
        </aside>
      </section>

      <section className="split reverse">
        <div className="panel">
          <div className="panelHeader">
            <div>
              <span className="eyebrow">Indicações</span>
              <h2>Como crescer sem depender só de anúncios</h2>
            </div>
          </div>

          <div className="refGrid">
            {indicacoes.map((item) => (
              <article className="card refCard" key={item.title}>
                <span className="refIcon">{item.icon}</span>
                <h3>{item.title}</h3>
                <p>{item.text}</p>
              </article>
            ))}
          </div>
        </div>

        <div className="panel">
          <div className="panelHeader">
            <div>
              <span className="eyebrow">Próximos passos</span>
              <h2>O que ainda falta</h2>
            </div>
          </div>

          <div className="todoList">
            {proximosPassos.map((item, index) => (
              <div className="todoItem" key={item}>
                <span>{index + 1}</span>
                <p>{item}</p>
              </div>
            ))}
          </div>
        </div>
      </section>

      <section className="panel">
        <div className="panelHeader">
          <div>
            <span className="eyebrow">Perguntas rápidas</span>
            <h2>Sem confusão</h2>
          </div>
        </div>

        <div className="faqGrid">
          {perguntas.map((item) => (
            <article className="card faqCard" key={item.q}>
              <h3>{item.q}</h3>
              <p>{item.a}</p>
            </article>
          ))}
        </div>
      </section>

      <style jsx>{`
        * {
          box-sizing: border-box;
        }

        .page {
          min-height: 100vh;
          padding: 28px 18px 80px;
          color: #f5f3ff;
          background:
            radial-gradient(circle at top left, rgba(168, 85, 247, 0.22), transparent 30%),
            radial-gradient(circle at bottom right, rgba(139, 92, 246, 0.18), transparent 30%),
            linear-gradient(135deg, #05050a 0%, #0b0714 45%, #12081f 100%);
          position: relative;
          overflow: hidden;
          font-family:
            Inter,
            ui-sans-serif,
            system-ui,
            -apple-system,
            BlinkMacSystemFont,
            "Segoe UI",
            sans-serif;
        }

        .glow {
          position: fixed;
          width: 340px;
          height: 340px;
          border-radius: 999px;
          filter: blur(60px);
          opacity: 0.22;
          pointer-events: none;
          animation: floaty 7s ease-in-out infinite alternate;
        }

        .glow1 {
          top: 70px;
          left: -120px;
          background: #a855f7;
        }

        .glow2 {
          right: -120px;
          bottom: 120px;
          background: #7c3aed;
          animation-delay: 1.5s;
        }

        @keyframes floaty {
          from { transform: translateY(0px) scale(1); }
          to { transform: translateY(-18px) scale(1.08); }
        }

        .hero,
        .grid4,
        .panel,
        .split {
          width: min(1180px, 100%);
          margin: 0 auto 18px;
          position: relative;
          z-index: 1;
        }

        .hero {
          display: grid;
          grid-template-columns: 1.5fr 0.8fr;
          gap: 18px;
        }

        .heroLeft,
        .heroRight,
        .panel {
          border-radius: 28px;
          border: 1px solid rgba(196, 181, 253, 0.16);
          background: linear-gradient(180deg, rgba(14, 10, 24, 0.95), rgba(8, 7, 15, 0.9));
          box-shadow: 0 28px 80px rgba(0, 0, 0, 0.35);
          backdrop-filter: blur(14px);
        }

        .heroLeft {
          padding: 34px;
        }

        .heroRight {
          padding: 24px;
          display: flex;
          align-items: stretch;
        }

        .focusBox {
          width: 100%;
          border-radius: 22px;
          padding: 22px;
          background: rgba(168, 85, 247, 0.08);
          border: 1px solid rgba(196, 181, 253, 0.18);
        }

        .focusBox ul {
          margin: 14px 0 0;
          padding-left: 18px;
          color: #ddd6fe;
          line-height: 1.8;
        }

        .focusTag,
        .tag,
        .miniTag,
        .cardLabel {
          display: inline-flex;
          align-items: center;
          width: fit-content;
          border-radius: 999px;
          padding: 7px 12px;
          font-size: 0.75rem;
          font-weight: 800;
        }

        .focusTag,
        .tag {
          color: #f3e8ff;
          background: rgba(168, 85, 247, 0.14);
          border: 1px solid rgba(192, 132, 252, 0.25);
        }

        .miniTag,
        .cardLabel {
          color: #ddd6fe;
          background: rgba(255, 255, 255, 0.05);
          border: 1px solid rgba(255, 255, 255, 0.08);
        }

        .eyebrow {
          display: inline-block;
          margin-bottom: 10px;
          font-size: 0.78rem;
          text-transform: uppercase;
          letter-spacing: 0.14em;
          font-weight: 900;
          color: #c4b5fd;
        }

        h1, h2, h3, p {
          margin-top: 0;
        }

        h1 {
          margin-bottom: 14px;
          font-size: clamp(2.2rem, 6vw, 4.6rem);
          line-height: 0.95;
          letter-spacing: -0.06em;
        }

        h2 {
          margin-bottom: 10px;
          font-size: clamp(1.35rem, 3vw, 2.1rem);
          letter-spacing: -0.04em;
        }

        h3 {
          margin-bottom: 8px;
          font-size: 1.02rem;
        }

        .heroText,
        .card p,
        .plainBox p,
        .todoItem p {
          color: #d6d3f1;
          line-height: 1.7;
        }

        .heroButtons {
          display: flex;
          flex-wrap: wrap;
          gap: 12px;
          margin-top: 24px;
        }

        .btnPrimary,
        .btnSecondary {
          display: inline-flex;
          align-items: center;
          justify-content: center;
          min-height: 48px;
          padding: 13px 18px;
          border-radius: 999px;
          font-weight: 800;
          text-decoration: none;
          transition: 0.25s ease;
        }

        .btnPrimary {
          color: #ffffff;
          background: linear-gradient(135deg, #7c3aed, #a855f7);
          box-shadow: 0 16px 40px rgba(124, 58, 237, 0.3);
        }

        .btnSecondary {
          color: #f5f3ff;
          background: rgba(255, 255, 255, 0.05);
          border: 1px solid rgba(255, 255, 255, 0.1);
        }

        .btnPrimary:hover,
        .btnSecondary:hover {
          transform: translateY(-2px);
        }

        .grid4 {
          display: grid;
          grid-template-columns: repeat(4, minmax(0, 1fr));
          gap: 14px;
        }

        .card {
          border-radius: 22px;
          border: 1px solid rgba(196, 181, 253, 0.12);
          background: rgba(255, 255, 255, 0.03);
          padding: 20px;
          transition: 0.25s ease;
        }

        .card:hover {
          transform: translateY(-3px);
          border-color: rgba(192, 132, 252, 0.28);
          background: rgba(255, 255, 255, 0.05);
        }

        .summaryCard h3 {
          margin-top: 10px;
        }

        .panel {
          padding: 24px;
        }

        .panelHeader {
          display: flex;
          align-items: flex-start;
          justify-content: space-between;
          gap: 14px;
          margin-bottom: 18px;
        }

        .flowGrid {
          display: grid;
          grid-template-columns: repeat(5, minmax(0, 1fr));
          gap: 14px;
        }

        .flowCard .number {
          width: 46px;
          height: 46px;
          display: grid;
          place-items: center;
          border-radius: 14px;
          margin-bottom: 14px;
          font-size: 0.95rem;
          font-weight: 900;
          color: #ffffff;
          background: linear-gradient(135deg, #7c3aed, #a855f7);
        }

        .split {
          display: grid;
          grid-template-columns: 1.2fr 0.8fr;
          gap: 18px;
          align-items: start;
        }

        .serviceGrid,
        .refGrid,
        .faqGrid {
          display: grid;
          grid-template-columns: repeat(2, minmax(0, 1fr));
          gap: 14px;
        }

        .serviceTop {
          display: flex;
          align-items: center;
          justify-content: space-between;
          gap: 10px;
          margin-bottom: 12px;
        }

        .serviceIcon,
        .refIcon {
          font-size: 1.9rem;
        }

        .serviceCard strong {
          display: block;
          margin-bottom: 10px;
          color: #e9d5ff;
          font-size: 1rem;
        }

        .sidePanel {
          position: sticky;
          top: 16px;
        }

        .plainBox {
          display: grid;
          gap: 10px;
        }

        .plainBox p {
          margin: 0;
          padding: 12px 14px;
          border-radius: 16px;
          background: rgba(168, 85, 247, 0.08);
          border: 1px solid rgba(196, 181, 253, 0.12);
        }

        .todoList {
          display: grid;
          gap: 12px;
        }

        .todoItem {
          display: grid;
          grid-template-columns: 40px 1fr;
          gap: 12px;
          align-items: start;
          padding: 14px;
          border-radius: 18px;
          background: rgba(255, 255, 255, 0.03);
          border: 1px solid rgba(196, 181, 253, 0.1);
        }

        .todoItem span {
          width: 40px;
          height: 40px;
          display: grid;
          place-items: center;
          border-radius: 14px;
          font-weight: 900;
          background: linear-gradient(135deg, #7c3aed, #a855f7);
          color: #fff;
        }

        .todoItem p {
          margin: 0;
        }

        @media (max-width: 980px) {
          .hero,
          .split,
          .grid4,
          .flowGrid,
          .serviceGrid,
          .refGrid,
          .faqGrid {
            grid-template-columns: 1fr;
          }

          .panelHeader {
            display: grid;
          }

          .sidePanel {
            position: static;
          }
        }

        @media (max-width: 640px) {
          .page {
            padding: 16px 12px 60px;
          }

          .heroLeft,
          .heroRight,
          .panel {
            border-radius: 22px;
            padding: 18px;
          }

          h1 {
            font-size: 2.35rem;
          }
        }
      `}</style>
    </main>
  );
}
