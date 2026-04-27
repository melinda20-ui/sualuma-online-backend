import Link from "next/link";
import LeadCaptureForm from "@/components/LeadCaptureForm";

export default function HomePage() {
  return (
    <main className="page">
      <nav className="nav">
        <Link href="/" className="brand">
          <img src="/images/logodosite.png" alt="Sualuma Online" />
          <span>Sualuma Online</span>
        </Link>

        <div className="navLinks">
          <a href="#solucao">Solução</a>
          <a href="#ecossistema">Ecossistema</a>
          <a href="#como-funciona">Como funciona</a>
          <a href="https://blog.sualuma.online">Blog</a>
          <a href="https://dev.sualuma.online">Agentes</a>
          <a href="https://chat.sualuma.online">Chats</a>
          <a href="#lista" className="navCta">Entrar na lista</a>
          <a href="https://cliente.sualuma.online" className="loginBtn">Login</a>
        </div>
      </nav>

      <section className="hero">
        <div className="moneyLayer">
          <span className="coin c1">$</span>
          <span className="coin c2">$</span>
          <span className="coin c3">$</span>
          <span className="coin c4">$</span>
          <span className="bill b1">$</span>
          <span className="bill b2">$</span>
          <span className="coin c5">$</span>
          <span className="coin c6">$</span>
        </div>

        <div className="heroContent">
          <div className="heroText">
            <p className="badge">● Ecossistema em construção · Acesso antecipado</p>

            <h1>
              Venda mais.
              <br />
              Trabalhe menos.
              <br />
              Cresça com <span>IA.</span>
            </h1>

            <p className="subtitle">
              O ecossistema completo para autônomos que querem atrair clientes,
              automatizar tarefas e crescer com mais estrutura, sem precisar montar
              uma equipe agora.
            </p>

            <div className="actions">
              <a href="#lista" className="primaryBtn">Quero acesso antecipado</a>
              <a href="#ecossistema" className="ghostBtn">Ver ecossistema</a>
            </div>

            <div className="stats">
              <div>
                <strong>9+</strong>
                <small>Plataformas integradas</small>
              </div>
              <div>
                <strong>0</strong>
                <small>Equipe necessária</small>
              </div>
              <div>
                <strong>∞</strong>
                <small>Possibilidades</small>
              </div>
            </div>
          </div>

          <div className="heroVisual">
            <div className="bannerBox">
              <img src="/images/bannerhome01.png" alt="Sualuma Online" />
            </div>

            <div className="floatCard card1">
              <strong>Agente criou conteúdo</strong>
              <span>5 posts gerados · há 2 min</span>
            </div>

            <div className="floatCard card2">
              <strong>Automação ativada</strong>
              <span>Lead capturado → CRM atualizado</span>
            </div>

            <div className="floatCard card3">
              <strong>Novo cliente em potencial</strong>
              <span>Formulário preenchido · há 7 min</span>
            </div>
          </div>
        </div>
      </section>

      <section className="marquee">
        <div>
          <span>Mais vendas</span>
          <span>Mais organização</span>
          <span>Agentes de IA</span>
          <span>Automações inteligentes</span>
          <span>Serviços digitais</span>
          <span>Cursos práticos</span>
          <span>Marketplace</span>
          <span>Mais vendas</span>
          <span>Mais organização</span>
          <span>Agentes de IA</span>
        </div>
      </section>

      <section id="solucao" className="section">
        <p className="sectionLabel">Por que a Sualuma</p>
        <h2>O problema de trabalhar sozinha e a solução em um só ecossistema</h2>
        <p className="sectionSub">
          Você não precisa mais tentar fazer tudo no braço, pulando de ferramenta
          em ferramenta, sem clareza e sem processo.
        </p>

        <div className="split">
          <div className="glass">
            <h3>O problema</h3>
            <ul className="bad">
              <li>Não consegue postar conteúdo com frequência</li>
              <li>Demora para responder clientes</li>
              <li>Perde contatos e oportunidades</li>
              <li>Não tem presença profissional forte</li>
              <li>Faz tudo ao mesmo tempo, sem clareza</li>
            </ul>
          </div>

          <div className="glass">
            <h3>A solução</h3>
            <ul className="good">
              <li>Agentes de IA para conteúdo, atendimento e estratégia</li>
              <li>Área de cliente, serviços, cursos e automações</li>
              <li>Organização da operação em um ecossistema só</li>
              <li>Captação de leads direto no seu banco de dados</li>
              <li>Crescimento com tecnologia, sem equipe gigante</li>
            </ul>
          </div>
        </div>
      </section>

      <section id="ecossistema" className="section ecosystemSection">
        <p className="sectionLabel">O ecossistema</p>
        <h2>Uma plataforma, vários sistemas conectados</h2>
        <p className="sectionSub">
          A Sualuma Online conecta IA, serviços, conteúdo, automações, cursos,
          chat e área do cliente em uma estrutura feita para crescer.
        </p>

        <div className="grid">
          <a href="https://dev.sualuma.online" className="ecoCard">
            <span>⚡</span>
            <h3>Vitrine de Agentes</h3>
            <p>Explore agentes especializados por tema, função e objetivo.</p>
          </a>

          <a href="https://chat.sualuma.online" className="ecoCard">
            <span>🧠</span>
            <h3>Chats</h3>
            <p>Ambiente para conversar com IAs e acessar seus assistentes.</p>
          </a>

          <a href="https://cliente.sualuma.online" className="ecoCard">
            <span>💼</span>
            <h3>Área do Cliente</h3>
            <p>Dashboard com serviços, entregas, planos e acompanhamento.</p>
          </a>

          <a href="https://blog.sualuma.online" className="ecoCard">
            <span>📰</span>
            <h3>Blog</h3>
            <p>Conteúdos de IA, automação, tecnologia e negócios digitais.</p>
          </a>

          <a href="https://meuservico.sualuma.online" className="ecoCard">
            <span>🛠️</span>
            <h3>Serviços</h3>
            <p>Marketplace de prestadores, soluções e mão de obra digital.</p>
          </a>

          <a href="https://automacoes.sualuma.online" className="ecoCard">
            <span>⚙️</span>
            <h3>Automações</h3>
            <p>Robôs e fluxos para economizar tempo e organizar processos.</p>
          </a>
        </div>
      </section>

      <section id="como-funciona" className="section">
        <p className="sectionLabel">Como funciona</p>
        <h2>Simples de usar, poderoso para crescer</h2>

        <div className="steps">
          <div className="step">
            <strong>01</strong>
            <h3>Entre pela sua necessidade</h3>
            <p>Comece por agentes, serviços, cursos, blog ou área do cliente.</p>
          </div>

          <div className="step">
            <strong>02</strong>
            <h3>Monte sua estrutura</h3>
            <p>Organize tarefas, processos, captação de leads e automações.</p>
          </div>

          <div className="step">
            <strong>03</strong>
            <h3>Venda e escale</h3>
            <p>Use IA e sistemas para crescer com mais velocidade e clareza.</p>
          </div>
        </div>
      </section>

      <section id="lista" className="section leadSection">
        <div className="leadBox">
          <div className="leadHeader">
            <img src="/images/logodosite.png" alt="Sualuma Online" />
            <div>
              <p className="sectionLabel">Lista de espera</p>
              <h2>Entre no acesso antecipado</h2>
            </div>
          </div>

          <p className="leadText">
            Cadastre seu nome e e-mail para receber novidades, acesso antecipado
            e oportunidades do ecossistema Sualuma Online.
          </p>

          <LeadCaptureForm />

          <div className="tags">
            <span>Autônomos</span>
            <span>Prestadores</span>
            <span>Empreendedores</span>
            <span>IA para negócios</span>
          </div>
        </div>
      </section>

      <footer className="footer">
        <div>
          <img src="/images/logodosite.png" alt="Sualuma Online" />
          <strong>Sualuma Online</strong>
        </div>
        <p>© 2026 Sualuma Online. Ecossistema de IA para autônomos.</p>
      </footer>

      <style>{`
        * {
          box-sizing: border-box;
        }

        html {
          scroll-behavior: smooth;
        }

        body {
          margin: 0;
          background: #050714;
          color: #ffffff;
        }

        .page {
          min-height: 100vh;
          background:
            radial-gradient(circle at 80% 10%, rgba(124, 58, 237, 0.28), transparent 30%),
            radial-gradient(circle at 15% 25%, rgba(34, 211, 238, 0.13), transparent 30%),
            #050714;
          font-family: Inter, Arial, sans-serif;
          overflow: hidden;
        }

        .nav {
          position: sticky;
          top: 0;
          z-index: 50;
          min-height: 76px;
          padding: 14px min(5vw, 70px);
          display: flex;
          align-items: center;
          justify-content: space-between;
          gap: 24px;
          background: rgba(5, 7, 20, 0.78);
          backdrop-filter: blur(18px);
          border-bottom: 1px solid rgba(255,255,255,0.08);
        }

        .brand {
          display: flex;
          align-items: center;
          gap: 12px;
          text-decoration: none;
          color: white;
          font-weight: 900;
          letter-spacing: -0.03em;
        }

        .brand img {
          width: 44px;
          height: 44px;
          border-radius: 14px;
          object-fit: cover;
          box-shadow: 0 0 30px rgba(34,211,238,0.24);
        }

        .navLinks {
          display: flex;
          align-items: center;
          gap: 18px;
          flex-wrap: wrap;
          justify-content: flex-end;
        }

        .navLinks a {
          color: #aab6d8;
          text-decoration: none;
          font-size: 13px;
          font-weight: 700;
        }

        .navCta {
          padding: 10px 16px;
          border-radius: 999px;
          background: linear-gradient(135deg, #22d3ee, #7c3aed, #ff4fd8);
          color: white !important;
        }

        .loginBtn {
          padding: 9px 15px;
          border-radius: 999px;
          background: rgba(255,255,255,0.06);
          border: 1px solid rgba(255,255,255,0.12);
          color: white !important;
        }

        .hero {
          position: relative;
          padding: 72px min(5vw, 70px) 80px;
          overflow: hidden;
        }

        .hero::before {
          content: "";
          position: absolute;
          inset: 0;
          background-image:
            linear-gradient(rgba(34,211,238,0.05) 1px, transparent 1px),
            linear-gradient(90deg, rgba(34,211,238,0.05) 1px, transparent 1px);
          background-size: 48px 48px;
          opacity: 0.7;
        }

        .moneyLayer {
          position: absolute;
          inset: 0;
          pointer-events: none;
          overflow: hidden;
          z-index: 1;
        }

        .coin,
        .bill {
          position: absolute;
          top: -90px;
          display: grid;
          place-items: center;
          font-weight: 900;
          animation: fall linear infinite;
          opacity: 0;
        }

        .coin {
          width: 32px;
          height: 32px;
          border-radius: 50%;
          background: radial-gradient(circle at 30% 25%, #fff6c4, #ffd66b 35%, #a56309 80%);
          color: rgba(38,22,0,0.8);
          box-shadow: 0 0 28px rgba(255,214,107,0.32);
        }

        .bill {
          width: 48px;
          height: 24px;
          border-radius: 7px;
          background: linear-gradient(135deg, #c6ffe5, #22c98b);
          color: rgba(0,62,42,0.8);
        }

        .c1 { left: 8%; animation-duration: 13s; animation-delay: 0s; }
        .c2 { left: 22%; animation-duration: 10s; animation-delay: 2s; }
        .c3 { left: 42%; animation-duration: 15s; animation-delay: 1s; }
        .c4 { left: 62%; animation-duration: 11s; animation-delay: 3s; }
        .c5 { left: 78%; animation-duration: 14s; animation-delay: 1.5s; }
        .c6 { left: 92%; animation-duration: 9s; animation-delay: 2.7s; }
        .b1 { left: 35%; animation-duration: 12s; animation-delay: 0.8s; }
        .b2 { left: 70%; animation-duration: 16s; animation-delay: 2.3s; }

        @keyframes fall {
          0% {
            transform: translateY(-100px) rotate(0deg);
            opacity: 0;
          }
          10% {
            opacity: 0.9;
          }
          100% {
            transform: translateY(105vh) rotate(360deg);
            opacity: 0;
          }
        }

        .heroContent {
          position: relative;
          z-index: 2;
          max-width: 1280px;
          margin: 0 auto;
          display: grid;
          grid-template-columns: 1.02fr 0.98fr;
          align-items: center;
          gap: 44px;
        }

        .badge {
          display: inline-flex;
          margin: 0 0 22px;
          padding: 8px 14px;
          border-radius: 999px;
          border: 1px solid rgba(34,211,238,0.28);
          background: rgba(34,211,238,0.08);
          color: #9cf5ff;
          font-size: 12px;
          font-weight: 900;
          text-transform: uppercase;
          letter-spacing: 0.09em;
        }

        h1 {
          margin: 0 0 24px;
          max-width: 680px;
          font-size: clamp(54px, 6.5vw, 96px);
          line-height: 0.94;
          letter-spacing: -0.075em;
          font-weight: 950;
        }

        h1 span {
          background: linear-gradient(135deg, #22d3ee, #7c3aed, #ff4fd8);
          -webkit-background-clip: text;
          background-clip: text;
          color: transparent;
        }

        .subtitle {
          max-width: 610px;
          margin: 0 0 32px;
          color: #b3bfdd;
          font-size: 18px;
          line-height: 1.75;
        }

        .actions {
          display: flex;
          gap: 14px;
          flex-wrap: wrap;
          margin-bottom: 34px;
        }

        .primaryBtn,
        .ghostBtn {
          min-height: 52px;
          padding: 0 24px;
          border-radius: 16px;
          display: inline-flex;
          align-items: center;
          justify-content: center;
          text-decoration: none;
          font-weight: 900;
        }

        .primaryBtn {
          background: linear-gradient(135deg, #22d3ee, #7c3aed, #ff4fd8);
          color: white;
          box-shadow: 0 18px 50px rgba(124,58,237,0.3);
        }

        .ghostBtn {
          color: white;
          background: rgba(255,255,255,0.05);
          border: 1px solid rgba(255,255,255,0.14);
        }

        .stats {
          display: flex;
          gap: 28px;
          flex-wrap: wrap;
        }

        .stats div {
          display: grid;
          gap: 3px;
        }

        .stats strong {
          font-size: 28px;
          line-height: 1;
        }

        .stats small {
          color: #8794b8;
        }

        .heroVisual {
          position: relative;
        }

        .bannerBox {
          position: relative;
          border-radius: 32px;
          padding: 10px;
          background: linear-gradient(180deg, rgba(255,255,255,0.12), rgba(255,255,255,0.03));
          border: 1px solid rgba(255,255,255,0.13);
          box-shadow: 0 35px 100px rgba(0,0,0,0.45);
        }

        .bannerBox::before {
          content: "";
          position: absolute;
          inset: -35px;
          background:
            radial-gradient(circle at 20% 20%, rgba(34,211,238,0.28), transparent 30%),
            radial-gradient(circle at 80% 80%, rgba(255,79,216,0.22), transparent 30%);
          filter: blur(22px);
          z-index: -1;
        }

        .bannerBox img {
          width: 100%;
          display: block;
          border-radius: 24px;
        }

        .floatCard {
          position: absolute;
          z-index: 5;
          min-width: 210px;
          padding: 14px 16px;
          border-radius: 18px;
          background: rgba(7,10,25,0.84);
          border: 1px solid rgba(255,255,255,0.12);
          backdrop-filter: blur(14px);
          box-shadow: 0 22px 60px rgba(0,0,0,0.38);
        }

        .floatCard strong {
          display: block;
          font-size: 12px;
          margin-bottom: 2px;
        }

        .floatCard span {
          font-size: 11px;
          color: #9aa7c7;
        }

        .card1 { left: -20px; top: 36px; }
        .card2 { right: -22px; top: 45%; }
        .card3 { left: 30px; bottom: -18px; }

        .marquee {
          overflow: hidden;
          border-top: 1px solid rgba(255,255,255,0.08);
          border-bottom: 1px solid rgba(255,255,255,0.08);
          background: rgba(255,255,255,0.03);
        }

        .marquee div {
          display: flex;
          width: max-content;
          gap: 44px;
          padding: 18px 0;
          animation: marquee 24s linear infinite;
        }

        .marquee span {
          color: #9aa7c7;
          font-size: 12px;
          font-weight: 900;
          text-transform: uppercase;
          letter-spacing: 0.14em;
          white-space: nowrap;
        }

        @keyframes marquee {
          from { transform: translateX(0); }
          to { transform: translateX(-50%); }
        }

        .section {
          padding: 92px min(5vw, 70px);
          max-width: 1280px;
          margin: 0 auto;
        }

        .sectionLabel {
          margin: 0 0 13px;
          color: #67e8f9;
          font-size: 12px;
          font-weight: 900;
          text-transform: uppercase;
          letter-spacing: 0.14em;
        }

        .section h2 {
          margin: 0 0 18px;
          font-size: clamp(32px, 4vw, 56px);
          line-height: 1.04;
          letter-spacing: -0.055em;
        }

        .sectionSub,
        .leadText {
          max-width: 700px;
          color: #aeb9d8;
          line-height: 1.75;
          font-size: 16px;
        }

        .split,
        .steps {
          display: grid;
          grid-template-columns: repeat(2, 1fr);
          gap: 20px;
          margin-top: 42px;
        }

        .glass,
        .step,
        .ecoCard,
        .leadBox {
          background:
            radial-gradient(circle at top left, rgba(34,211,238,0.11), transparent 30%),
            rgba(12,17,38,0.78);
          border: 1px solid rgba(255,255,255,0.1);
          border-radius: 28px;
          box-shadow: 0 24px 80px rgba(0,0,0,0.25);
          backdrop-filter: blur(16px);
        }

        .glass {
          padding: 30px;
        }

        .glass h3,
        .step h3,
        .ecoCard h3 {
          margin: 0 0 14px;
        }

        ul {
          margin: 0;
          padding: 0;
          list-style: none;
          display: grid;
          gap: 12px;
        }

        li {
          color: #aeb9d8;
          line-height: 1.6;
        }

        .bad li::before {
          content: "× ";
          color: #ff6b8d;
          font-weight: 900;
        }

        .good li::before {
          content: "✓ ";
          color: #22d3ee;
          font-weight: 900;
        }

        .grid {
          margin-top: 42px;
          display: grid;
          grid-template-columns: repeat(3, 1fr);
          gap: 18px;
        }

        .ecoCard {
          min-height: 210px;
          padding: 26px;
          text-decoration: none;
          color: white;
          transition: 0.25s ease;
        }

        .ecoCard:hover {
          transform: translateY(-5px);
          border-color: rgba(34,211,238,0.35);
        }

        .ecoCard span {
          display: block;
          font-size: 28px;
          margin-bottom: 16px;
        }

        .ecoCard p,
        .step p {
          color: #aab6d8;
          line-height: 1.7;
          margin: 0;
        }

        .steps {
          grid-template-columns: repeat(3, 1fr);
        }

        .step {
          padding: 28px;
        }

        .step strong {
          display: grid;
          place-items: center;
          width: 54px;
          height: 54px;
          border-radius: 50%;
          color: #67e8f9;
          border: 1px solid rgba(34,211,238,0.25);
          background: rgba(34,211,238,0.08);
          margin-bottom: 18px;
        }

        .leadSection {
          max-width: 900px;
        }

        .leadBox {
          padding: 34px;
          background:
            radial-gradient(circle at top left, rgba(34,211,238,0.18), transparent 34%),
            radial-gradient(circle at bottom right, rgba(168,85,247,0.22), transparent 38%),
            rgba(8,12,28,0.86);
        }

        .leadHeader {
          display: flex;
          align-items: center;
          gap: 18px;
          margin-bottom: 18px;
        }

        .leadHeader img {
          width: 76px;
          height: 76px;
          border-radius: 22px;
          object-fit: cover;
          border: 1px solid rgba(255,255,255,0.16);
          box-shadow: 0 0 34px rgba(34,211,238,0.24);
        }

        .leadHeader h2 {
          margin-bottom: 0;
        }

        .lead-form {
          display: grid;
          grid-template-columns: 1fr 1fr auto;
          gap: 12px;
          margin-top: 26px;
        }

        .lead-form input {
          min-height: 56px;
          border-radius: 16px;
          border: 1px solid rgba(255,255,255,0.14);
          background: rgba(255,255,255,0.055);
          color: white;
          padding: 0 16px;
          font-size: 15px;
          outline: none;
        }

        .lead-form input::placeholder {
          color: #7f8cab;
        }

        .lead-form input:focus {
          border-color: rgba(34,211,238,0.55);
          box-shadow: 0 0 0 4px rgba(34,211,238,0.08);
        }

        .lead-form button {
          min-height: 56px;
          border: 0;
          border-radius: 16px;
          padding: 0 22px;
          cursor: pointer;
          font-weight: 900;
          color: white;
          background: linear-gradient(135deg, #22d3ee, #7c3aed 52%, #ff4fd8);
          box-shadow: 0 18px 45px rgba(124,58,237,0.32);
        }

        .lead-form button:disabled {
          opacity: 0.65;
          cursor: not-allowed;
        }

        .lead-message {
          grid-column: 1 / -1;
          margin: 2px 0 0;
          font-size: 14px;
          color: #8eeeff;
        }

        .tags {
          display: flex;
          flex-wrap: wrap;
          gap: 8px;
          margin-top: 20px;
        }

        .tags span {
          padding: 7px 12px;
          border-radius: 999px;
          background: rgba(255,255,255,0.055);
          border: 1px solid rgba(255,255,255,0.09);
          color: #9aa7c7;
          font-size: 12px;
        }

        .footer {
          padding: 42px min(5vw, 70px);
          border-top: 1px solid rgba(255,255,255,0.08);
          display: flex;
          align-items: center;
          justify-content: space-between;
          gap: 20px;
          color: #8f9cbc;
        }

        .footer div {
          display: flex;
          align-items: center;
          gap: 12px;
          color: white;
        }

        .footer img {
          width: 42px;
          height: 42px;
          border-radius: 14px;
          object-fit: cover;
        }

        @media (max-width: 980px) {
          .navLinks {
            display: none;
          }

          .heroContent {
            grid-template-columns: 1fr;
          }

          .heroVisual {
            order: -1;
          }

          .floatCard {
            display: none;
          }

          .split,
          .steps,
          .grid {
            grid-template-columns: 1fr;
          }

          h1 {
            font-size: clamp(44px, 13vw, 68px);
          }

          .lead-form {
            grid-template-columns: 1fr;
          }

          .lead-form button {
            width: 100%;
          }

          .footer {
            flex-direction: column;
            align-items: flex-start;
          }
        }
      `}</style>
    </main>
  );
}
