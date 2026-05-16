import { redirect } from "next/navigation";
import { createClient } from "@/lib/supabase/server";
import { signOut } from "@/app/auth/actions/auth";

export default async function Page() {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) {
    redirect("/sign-in?next=/member-user&role=client");
  }

  const css = `
    :root{
      --bg:#070817;--card:rgba(18,22,58,.76);--stroke:rgba(139,164,255,.20);--text:#f7f8ff;--muted:#b8c4ff;
      --cyan:#18f2ff;--violet:#865dff;--shadow:0 26px 80px rgba(0,0,0,.42);--radius:26px;
    }
    *{box-sizing:border-box}
    body{
      margin:0;min-height:100vh;color:var(--text);
      font-family:Inter,ui-sans-serif,system-ui,-apple-system,sans-serif;
      background:
        radial-gradient(circle at 8% 8%,rgba(24,242,255,.28),transparent 28%),
        radial-gradient(circle at 78% 15%,rgba(134,93,255,.32),transparent 30%),
        radial-gradient(circle at 50% 100%,rgba(255,79,216,.12),transparent 35%),
        linear-gradient(135deg,#070817,#0b0f2c 55%,#050510);
      overflow-x:hidden;
    }
    body:before{
      content:"";position:fixed;inset:0;pointer-events:none;opacity:.22;
      background-image:linear-gradient(rgba(255,255,255,.05) 1px,transparent 1px),linear-gradient(90deg,rgba(255,255,255,.05) 1px,transparent 1px);
      background-size:46px 46px;mask-image:linear-gradient(to bottom,black,transparent 78%);
    }
    a{color:inherit;text-decoration:none}
    button,input,textarea{font:inherit}
    .shell{display:grid;grid-template-columns:282px 1fr;min-height:100vh}
    .sidebar{
      position:sticky;top:0;height:100vh;padding:22px 18px;
      border-right:1px solid var(--stroke);
      background:rgba(8,10,28,.72);backdrop-filter:blur(22px);overflow:auto;
    }
    .brand{display:flex;gap:13px;align-items:center;margin-bottom:28px}
    .brand-logo{
      width:48px;height:48px;border-radius:16px;
      background:linear-gradient(135deg,var(--violet),var(--cyan));
      box-shadow:0 0 32px rgba(24,242,255,.26);
      display:grid;place-items:center;font-weight:900;font-size:20px;color:white;flex:none;
    }
    .brand h1{font-size:17px;margin:0}
    .brand p{font-size:12px;color:var(--muted);margin:3px 0 0}
    .nav-title{font-size:11px;text-transform:uppercase;letter-spacing:.18em;color:#7f8ee8;margin:24px 10px 10px}
    .lnav{display:grid;gap:6px}
    .lnav a{
      display:flex;align-items:center;gap:12px;padding:13px 14px;border-radius:17px;
      color:#dbe2ff;border:1px solid transparent;transition:.2s ease;font-weight:750;font-size:14px;cursor:pointer;
    }
    .lnav a span{width:30px;height:30px;border-radius:11px;display:grid;place-items:center;background:rgba(255,255,255,.08);flex:none}
    .lnav a.active,.lnav a:hover{
      background:linear-gradient(135deg,rgba(134,93,255,.38),rgba(24,242,255,.14));
      border-color:rgba(143,166,255,.28);box-shadow:0 14px 40px rgba(0,0,0,.18);
    }
    .lmain{padding:26px;min-width:0}
    .topbar{
      display:flex;justify-content:space-between;gap:18px;align-items:center;margin-bottom:22px;
      padding:18px 20px;border:1px solid var(--stroke);border-radius:24px;
      background:rgba(255,255,255,.045);backdrop-filter:blur(18px);
    }
    .topbar h2{margin:0;font-size:16px}
    .topbar p{margin:4px 0 0;color:var(--muted);font-size:13px}
    .pill{
      display:inline-flex;gap:8px;align-items:center;border-radius:999px;
      padding:10px 13px;border:1px solid rgba(255,255,255,.14);
      color:#eaf1ff;background:rgba(255,255,255,.06);font-weight:800;font-size:12px;
    }
    .lbtn{
      cursor:pointer;border:0;border-radius:16px;padding:13px 18px;font-weight:900;color:white;
      background:linear-gradient(135deg,var(--violet),var(--cyan));
      box-shadow:0 14px 42px rgba(24,242,255,.20);transition:.2s ease;display:inline-block;
    }
    .lbtn:hover{transform:translateY(-2px)}
    .lbtn.secondary{background:rgba(255,255,255,.07);border:1px solid rgba(255,255,255,.14);box-shadow:none}
    .lbtn.danger{background:linear-gradient(135deg,#ff4fd8,#ff6b91);box-shadow:0 14px 42px rgba(255,79,216,.20)}
    .hero{
      position:relative;overflow:hidden;border-radius:34px;padding:34px;
      border:1px solid var(--stroke);
      background:linear-gradient(135deg,rgba(20,24,64,.86),rgba(15,20,55,.48)),
        radial-gradient(circle at 80% 10%,rgba(24,242,255,.30),transparent 28%),
        radial-gradient(circle at 15% 80%,rgba(134,93,255,.30),transparent 30%);
      box-shadow:var(--shadow);margin-bottom:22px;
    }
    .hero small{color:var(--cyan);font-weight:900;letter-spacing:.08em;text-transform:uppercase}
    .hero h1{font-size:clamp(28px,4vw,56px);line-height:.96;margin:13px 0 18px}
    .hero strong{background:linear-gradient(135deg,#fff,var(--cyan),var(--violet));-webkit-background-clip:text;color:transparent}
    .hero p{max-width:700px;color:#d9e1ff;font-size:16px;line-height:1.65;margin:0}
    .lgrid{display:grid;gap:18px}
    .lgrid.cols-2{grid-template-columns:1.25fr .9fr}
    .lgrid.cols-3{grid-template-columns:repeat(3,1fr)}
    .lcard{
      position:relative;overflow:hidden;
      border:1px solid var(--stroke);border-radius:var(--radius);
      background:linear-gradient(135deg,var(--card),rgba(17,22,60,.50));
      box-shadow:0 16px 50px rgba(0,0,0,.20);padding:22px;
    }
    .lcard h3{margin:0 0 8px;font-size:20px}
    .lcard p{margin:0;color:#cbd5ff;line-height:1.6}
    .metric{
      min-height:126px;display:flex;flex-direction:column;justify-content:space-between;
      background:linear-gradient(135deg,rgba(134,93,255,.24),rgba(24,242,255,.10));
    }
    .metric b{font-size:36px;line-height:1}
    .metric span{color:var(--muted);font-weight:750}
    .llist{display:grid;gap:12px;margin-top:14px}
    .litem{
      display:flex;gap:14px;align-items:flex-start;justify-content:space-between;
      padding:16px;border:1px solid rgba(255,255,255,.10);border-radius:18px;
      background:rgba(255,255,255,.045);
    }
    .litem h4{margin:0 0 5px;font-size:15px}
    .litem p{font-size:13px;color:var(--muted);margin:0}
    .lbadge{
      flex:none;border-radius:999px;padding:7px 10px;font-size:11px;font-weight:900;
      background:rgba(24,242,255,.13);color:#9ff8ff;border:1px solid rgba(24,242,255,.22);white-space:nowrap;
    }
    .config-box{
      border:1px solid var(--stroke);border-radius:var(--radius);
      background:linear-gradient(135deg,var(--card),rgba(17,22,60,.50));
      box-shadow:0 16px 50px rgba(0,0,0,.20);padding:28px;max-width:540px;
    }
    .config-box h3{margin:0 0 6px;font-size:20px}
    .config-box p{margin:0 0 22px;color:var(--muted);font-size:14px;line-height:1.6}
    .config-row{
      display:flex;align-items:center;justify-content:space-between;gap:16px;
      padding:18px 0;border-bottom:1px solid rgba(255,255,255,.07);
    }
    .config-row:last-child{border-bottom:0;padding-bottom:0}
    .config-row label{font-size:14px;color:#dbe2ff;font-weight:700}
    .config-row small{display:block;color:var(--muted);font-size:12px;margin-top:3px}
    .bell{
      position:fixed;right:24px;bottom:24px;z-index:6;width:58px;height:58px;border-radius:22px;
      display:grid;place-items:center;border:1px solid rgba(255,255,255,.18);
      background:linear-gradient(135deg,var(--violet),var(--cyan));box-shadow:0 18px 45px rgba(24,242,255,.26);
      cursor:pointer;font-size:23px;
    }
    .sualuma-client-service-switch{
      position:fixed;right:18px;top:18px;z-index:99998;border-radius:999px;padding:11px 14px;
      text-decoration:none;color:white;font-size:12px;font-weight:950;
      border:1px solid rgba(255,255,255,.14);
      background:linear-gradient(135deg,#8d5cff,#18f2ff);
      box-shadow:0 14px 38px rgba(24,242,255,.18);
    }
    .page{display:none}
    .page.active{display:block}
    @media(max-width:980px){
      .shell{grid-template-columns:1fr}
      .sidebar{position:fixed;z-index:10;left:-310px;width:285px;transition:.25s ease}
      .sidebar.open{left:0}
      .lmain{padding:18px}
      .lgrid.cols-2,.lgrid.cols-3{grid-template-columns:1fr}
      .hero{padding:24px}
      .topbar{align-items:flex-start;flex-direction:column}
      .sualuma-client-service-switch{top:auto;right:16px;left:16px;bottom:80px;text-align:center}
    }
  `;

  return (
    <>
      <style dangerouslySetInnerHTML={{ __html: css }} />

      <a className="sualuma-client-service-switch" href="https://meuservico.sualuma.online#prestador">
        Dashboard de serviço
      </a>

      <div className="shell">
        <aside className="sidebar" id="sidebar">
          <div className="brand">
            <div className="brand-logo">S</div>
            <div>
              <h1>Sualuma Online</h1>
              <p>Dashboard do cliente</p>
            </div>
          </div>

          <div className="nav-title">Painel</div>
          <nav className="lnav" id="mainnav">
            <a href="#visao" data-page="visao"><span>🏠</span>Visão geral</a>
            <a href="#projetos" data-page="projetos"><span>📁</span>Meus projetos</a>
            <a href="#mensagens" data-page="mensagens"><span>💬</span>Mensagens</a>
            <a href="#entregas" data-page="entregas"><span>📦</span>Entregas</a>
            <a href="#reunioes" data-page="reunioes"><span>🗓️</span>Reuniões</a>
            <a href="#servicos" data-page="servicos"><span>🛒</span>Marketplace</a>
            <a href="#agentes" data-page="agentes"><span>🤖</span>Vitrine de agentes</a>
            <a href="#chat" data-page="chat"><span>✨</span>Chat IA</a>
            <a href="#configuracoes" data-page="configuracoes"><span>⚙️</span>Configurações</a>
          </nav>

          <div className="nav-title">Ações rápidas</div>
          <nav className="lnav">
            <a href="https://meuservico.sualuma.online" target="_blank" rel="noopener noreferrer"><span>🚀</span>Ver prestadores</a>
            <a href="https://trabalhosja.sualuma.online" target="_blank" rel="noopener noreferrer"><span>🌐</span>Comunidade</a>
          </nav>
        </aside>

        <main className="lmain">
          <div className="topbar">
            <div>
              <h2 id="pageTitle">Dashboard do Cliente</h2>
              <p id="pageSub">Acompanhe projetos, entregas, mensagens e próximos passos.</p>
            </div>
            <div style={{ display: "flex", gap: 10, flexWrap: "wrap" }}>
              <span className="pill">🟢 Painel ativo</span>
            </div>
          </div>

          {/* Visão geral */}
          <div className="page active" id="page-visao">
            <div className="hero">
              <small>Dashboard Sualuma</small>
              <h1>Bem-vindo ao seu <strong>painel de cliente</strong></h1>
              <p>Acompanhe projetos, entregas, mensagens, reuniões e marketplace em um só lugar.</p>
              <div style={{ display: "flex", gap: 12, flexWrap: "wrap", marginTop: 22 }}>
                <a className="lbtn" href="https://meuservico.sualuma.online" target="_blank" rel="noopener noreferrer">Ver prestadores</a>
                <a className="lbtn secondary" href="https://sualuma.online" target="_blank" rel="noopener noreferrer">Site principal</a>
              </div>
            </div>
            <div className="lgrid cols-3" style={{ marginBottom: 18 }}>
              <div className="lcard metric"><span>Projetos ativos</span><b>—</b></div>
              <div className="lcard metric"><span>Entregas pendentes</span><b>—</b></div>
              <div className="lcard metric"><span>Notificações</span><b>—</b></div>
            </div>
            <div className="lgrid cols-2">
              <div className="lcard">
                <h3>Acesso rápido</h3>
                <div className="llist">
                  <div className="litem"><div><h4>Meus projetos</h4><p>Visualize status e progresso.</p></div><a className="lbadge" href="#projetos">Abrir</a></div>
                  <div className="litem"><div><h4>Entregas</h4><p>Aprovações e arquivos finais.</p></div><a className="lbadge" href="#entregas">Abrir</a></div>
                  <div className="litem"><div><h4>Reuniões</h4><p>Convites e confirmações.</p></div><a className="lbadge" href="#reunioes">Abrir</a></div>
                  <div className="litem"><div><h4>Chat IA</h4><p>Converse sobre seu projeto.</p></div><a className="lbadge" href="#chat">Abrir</a></div>
                </div>
              </div>
              <div className="lcard">
                <h3>Navegação</h3>
                <div className="llist">
                  <div className="litem"><div><h4>Marketplace</h4><p>Encontre prestadores.</p></div><a className="lbadge" href="#servicos">Abrir</a></div>
                  <div className="litem"><div><h4>Vitrine de agentes</h4><p>Agentes de IA.</p></div><a className="lbadge" href="#agentes">Abrir</a></div>
                  <div className="litem"><div><h4>Mensagens</h4><p>Central de conversa.</p></div><a className="lbadge" href="#mensagens">Abrir</a></div>
                  <div className="litem"><div><h4>Comunidade</h4><p>Acesse a comunidade.</p></div><a className="lbadge" href="https://trabalhosja.sualuma.online" target="_blank" rel="noopener noreferrer">Abrir</a></div>
                </div>
              </div>
            </div>
          </div>

          {/* Configurações */}
          <div className="page" id="page-configuracoes">
            <div className="config-box">
              <h3>⚙️ Configurações da conta</h3>
              <p>Gerencie suas informações e sessão.</p>

              <div className="config-row">
                <div>
                  <label>E-mail</label>
                  <small>{user!.email}</small>
                </div>
              </div>

              <div className="config-row">
                <div>
                  <label>Sair da conta</label>
                  <small>Encerra sua sessão neste dispositivo.</small>
                </div>
                <form action={signOut} style={{ margin: 0 }}>
                  <button type="submit" className="lbtn danger" style={{ padding: "10px 18px", fontSize: 13 }}>
                    Sair
                  </button>
                </form>
              </div>
            </div>
          </div>

          {/* Páginas placeholder */}
          {["projetos","mensagens","entregas","reunioes","servicos","agentes","chat"].map(p => (
            <div key={p} className="page" id={`page-${p}`}>
              <div className="lcard">
                <h3 style={{ textTransform: "capitalize" }}>{p}</h3>
                <p style={{ marginTop: 8 }}>Esta seção está sendo carregada.</p>
              </div>
            </div>
          ))}
        </main>
      </div>

      <button className="bell">🔔</button>

      <script dangerouslySetInnerHTML={{ __html: `
        const titles = {
          visao: ['Dashboard do Cliente','Acompanhe projetos, entregas e mensagens.'],
          projetos: ['Meus projetos','Status, progresso e próximos passos.'],
          mensagens: ['Mensagens','Central de conversa com a equipe.'],
          entregas: ['Entregas','Aprovações, materiais e arquivos finais.'],
          reunioes: ['Reuniões','Convites, datas e confirmações.'],
          servicos: ['Marketplace','Encontre prestadores e envie propostas.'],
          agentes: ['Vitrine de agentes','Agentes de IA para acelerar entregas.'],
          chat: ['Chat IA','Converse com a IA sobre seu projeto.'],
          configuracoes: ['Configurações','Gerencie sua conta e sessão.'],
        };
        function navigate() {
          const view = location.hash.replace('#','') || 'visao';
          document.querySelectorAll('.page').forEach(el => el.classList.remove('active'));
          const target = document.getElementById('page-' + view);
          if (target) target.classList.add('active');
          document.querySelectorAll('[data-page]').forEach(a => {
            a.classList.toggle('active', a.dataset.page === view);
          });
          const t = titles[view] || titles.visao;
          document.getElementById('pageTitle').textContent = t[0];
          document.getElementById('pageSub').textContent = t[1];
        }
        window.addEventListener('hashchange', navigate);
        navigate();
      `}} />
    </>
  );
}
