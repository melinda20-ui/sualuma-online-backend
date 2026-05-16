import { redirect } from "next/navigation";
import { createClient } from "@/lib/supabase/server";
import { signOut } from "@/app/auth/actions/auth";

export default async function Page() {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) {
    redirect("/sign-in?next=/provider-services&role=provider");
  }

  const css = `
    :root{
      --bg:#060717;--card:rgba(17,22,61,.76);--card2:rgba(31,39,104,.72);
      --stroke:rgba(151,171,255,.20);--text:#f8f9ff;--muted:#bac7ff;
      --cyan:#18f2ff;--violet:#8d5cff;--pink:#ff4fd8;--green:#44f5b2;
      --yellow:#ffd166;--danger:#ff6b91;--radius:26px;--shadow:0 26px 90px rgba(0,0,0,.45);
    }
    *{box-sizing:border-box}
    body{
      margin:0;min-height:100vh;color:var(--text);
      font-family:Inter,ui-sans-serif,system-ui,-apple-system,sans-serif;
      background:
        radial-gradient(circle at 12% 8%,rgba(24,242,255,.23),transparent 27%),
        radial-gradient(circle at 80% 5%,rgba(141,92,255,.35),transparent 28%),
        radial-gradient(circle at 45% 95%,rgba(255,79,216,.13),transparent 34%),
        linear-gradient(135deg,#050612,#0b1034 52%,#050510);
      overflow-x:hidden;
    }
    body:before{
      content:"";position:fixed;inset:0;pointer-events:none;opacity:.20;
      background-image:linear-gradient(rgba(255,255,255,.05) 1px,transparent 1px),linear-gradient(90deg,rgba(255,255,255,.05) 1px,transparent 1px);
      background-size:48px 48px;mask-image:linear-gradient(to bottom,black,transparent 76%);
    }
    a{color:inherit;text-decoration:none}
    button,input,textarea,select{font:inherit}
    .pwrap{width:min(1180px,calc(100vw - 32px));margin:auto}
    .ptop{
      position:sticky;top:0;z-index:20;backdrop-filter:blur(22px);
      background:rgba(7,9,27,.72);border-bottom:1px solid var(--stroke);
    }
    .ptop-inner{height:82px;display:flex;align-items:center;justify-content:space-between;gap:18px}
    .pbrand{display:flex;align-items:center;gap:13px}
    .pbrand-logo{
      width:48px;height:48px;border-radius:16px;
      background:linear-gradient(135deg,var(--violet),var(--cyan));
      box-shadow:0 0 34px rgba(24,242,255,.24);
      display:grid;place-items:center;font-weight:950;font-size:18px;color:white;flex:none;
    }
    .pbrand h1{font-size:17px;margin:0}
    .pbrand p{font-size:12px;margin:3px 0 0;color:var(--muted)}
    .pnav{display:flex;gap:8px;align-items:center;flex-wrap:wrap}
    .pnav a{
      padding:10px 12px;border-radius:999px;color:#dce4ff;font-size:13px;font-weight:850;
      border:1px solid transparent;transition:.2s ease;cursor:pointer;
    }
    .pnav a:hover,.pnav a.active{border-color:rgba(255,255,255,.14);background:rgba(255,255,255,.07)}
    .pbtn{
      display:inline-flex;align-items:center;justify-content:center;gap:8px;cursor:pointer;
      border:0;border-radius:17px;padding:13px 18px;font-weight:950;color:white;
      background:linear-gradient(135deg,var(--violet),var(--cyan));
      box-shadow:0 16px 42px rgba(24,242,255,.18);transition:.2s ease;
    }
    .pbtn:hover{transform:translateY(-2px)}
    .pbtn.secondary{background:rgba(255,255,255,.07);border:1px solid rgba(255,255,255,.14);box-shadow:none}
    .pbtn.danger{background:linear-gradient(135deg,#ff4fd8,#ff6b91);box-shadow:0 14px 42px rgba(255,79,216,.20)}
    .phero{
      position:relative;overflow:hidden;border:1px solid var(--stroke);border-radius:36px;
      background:
        linear-gradient(135deg,rgba(20,25,67,.90),rgba(13,17,49,.56)),
        radial-gradient(circle at 82% 18%,rgba(24,242,255,.32),transparent 28%),
        radial-gradient(circle at 10% 82%,rgba(141,92,255,.32),transparent 30%);
      padding:52px 42px;margin:28px 0 22px;box-shadow:var(--shadow);
    }
    .phero small{color:var(--cyan);font-weight:950;text-transform:uppercase;letter-spacing:.10em}
    .phero h2{font-size:clamp(32px,5vw,72px);line-height:.96;margin:14px 0 20px}
    .pgradient{background:linear-gradient(135deg,#fff,var(--cyan),var(--violet));-webkit-background-clip:text;color:transparent}
    .phero p{max-width:700px;color:#d8e1ff;font-size:17px;line-height:1.65;margin:0}
    .pgrid{display:grid;gap:18px}
    .pcols-2{grid-template-columns:1.15fr .85fr}
    .pcols-3{grid-template-columns:repeat(3,1fr)}
    .pcols-4{grid-template-columns:repeat(4,1fr)}
    .pcard{
      border:1px solid var(--stroke);border-radius:var(--radius);
      background:linear-gradient(135deg,var(--card),rgba(12,16,48,.55));
      box-shadow:0 16px 55px rgba(0,0,0,.24);padding:22px;overflow:hidden;
    }
    .pcard h3{margin:0 0 8px;font-size:21px}
    .pcard p{margin:0;color:#cad5ff;line-height:1.62}
    .picon{width:44px;height:44px;border-radius:16px;display:grid;place-items:center;margin-bottom:14px;background:linear-gradient(135deg,rgba(141,92,255,.34),rgba(24,242,255,.18));font-size:22px}
    .pmetric{min-height:130px;display:flex;flex-direction:column;justify-content:space-between;background:linear-gradient(135deg,rgba(141,92,255,.25),rgba(24,242,255,.10))}
    .pmetric b{font-size:34px;line-height:1}
    .pmetric span{color:var(--muted);font-weight:850}
    .plist{display:grid;gap:12px;margin-top:14px}
    .pitem{
      display:flex;align-items:flex-start;justify-content:space-between;gap:14px;
      padding:16px;border:1px solid rgba(255,255,255,.10);border-radius:18px;background:rgba(255,255,255,.045);
    }
    .pitem h4{margin:0 0 5px;font-size:15px}
    .pitem p{font-size:13px;color:var(--muted);margin:0}
    .pbadge{
      flex:none;border-radius:999px;padding:7px 10px;font-size:11px;font-weight:950;
      background:rgba(24,242,255,.13);color:#a8f8ff;border:1px solid rgba(24,242,255,.22);white-space:nowrap;
    }
    .pbadge.ok{background:rgba(68,245,178,.12);color:#aaffdc;border-color:rgba(68,245,178,.24)}
    .pbadge.warn{background:rgba(255,209,102,.12);color:#ffe39e;border-color:rgba(255,209,102,.24)}
    .psection{display:none;padding-bottom:42px}
    .psection.active{display:block}
    .ppanel-shell{display:grid;grid-template-columns:270px 1fr;gap:18px;margin-top:24px}
    .psidepanel{
      border:1px solid var(--stroke);border-radius:28px;padding:16px;background:rgba(8,11,34,.70);
      height:max-content;position:sticky;top:100px;
    }
    .psidepanel a{display:flex;align-items:center;gap:10px;padding:13px 12px;border-radius:15px;color:#dbe4ff;font-weight:850;font-size:14px;cursor:pointer;}
    .psidepanel a:hover,.psidepanel a.active{background:linear-gradient(135deg,rgba(141,92,255,.28),rgba(24,242,255,.10));border-radius:15px;}
    .pconfig-box{
      border:1px solid var(--stroke);border-radius:var(--radius);
      background:linear-gradient(135deg,var(--card),rgba(17,22,60,.50));
      box-shadow:0 16px 50px rgba(0,0,0,.20);padding:28px;max-width:540px;
    }
    .pconfig-box h3{margin:0 0 6px;font-size:20px}
    .pconfig-box p{margin:0 0 22px;color:var(--muted);font-size:14px;line-height:1.6}
    .pconfig-row{
      display:flex;align-items:center;justify-content:space-between;gap:16px;
      padding:18px 0;border-bottom:1px solid rgba(255,255,255,.07);
    }
    .pconfig-row:last-child{border-bottom:0;padding-bottom:0}
    .pconfig-row label{font-size:14px;color:#dbe2ff;font-weight:700}
    .pconfig-row small{display:block;color:var(--muted);font-size:12px;margin-top:3px}
    .ppill{
      display:inline-flex;gap:8px;align-items:center;border-radius:999px;
      padding:10px 13px;border:1px solid rgba(255,255,255,.14);
      color:#eaf1ff;background:rgba(255,255,255,.06);font-weight:800;font-size:12px;
    }
    @media(max-width:980px){
      .ptop-inner{height:auto;padding:16px 0;align-items:flex-start;flex-direction:column}
      .pnav{width:100%}
      .phero{padding:28px 22px}
      .pcols-2,.pcols-3,.pcols-4,.ppanel-shell{grid-template-columns:1fr}
      .psidepanel{position:relative;top:0}
    }
  `;

  return (
    <>
      <style dangerouslySetInnerHTML={{ __html: css }} />

      {/* Header */}
      <header className="ptop">
        <div className="pwrap ptop-inner">
          <div className="pbrand">
            <div className="pbrand-logo">S</div>
            <div>
              <h1>Meu Serviço</h1>
              <p>Marketplace e painel de prestadores</p>
            </div>
          </div>
          <nav className="pnav" id="ptopNav">
            <a href="#inicio" data-page="inicio">Início</a>
            <a href="#marketplace" data-page="marketplace">Ver prestadores</a>
            <a href="#empresa" data-page="empresa">Sou empresa</a>
            <a href="#prestador" data-page="prestador">Sou prestador</a>
            <a href="#indicacoes" data-page="indicacoes">Indicações</a>
            <a href="#configuracoes" data-page="configuracoes">⚙️ Conta</a>
          </nav>
        </div>
      </header>

      <main className="pwrap">

        {/* INÍCIO */}
        <section className="psection active" id="pinicio">
          <div className="phero">
            <small>Marketplace de serviços da Sualuma</small>
            <h2>Conecte empresas e prestadores com <span className="pgradient">clareza, entrega e acompanhamento</span></h2>
            <p>O Meu Serviço é a área onde empresas encontram prestadores, enviam propostas e acompanham tudo com transparência e apoio de IA.</p>
            <div style={{ display: "flex", gap: 12, flexWrap: "wrap", marginTop: 24 }}>
              <a className="pbtn" href="#marketplace">Ver prestadores</a>
              <a className="pbtn secondary" href="#prestador">Entrar como prestador</a>
              <a className="pbtn secondary" href="/member-user">Dashboard do cliente</a>
            </div>
          </div>
          <div className="pgrid pcols-3">
            <div className="pcard"><div className="picon">🤝</div><h3>Conexão direta</h3><p>Empresas encontram profissionais e acompanham tudo pelo dashboard.</p></div>
            <div className="pcard"><div className="picon">📦</div><h3>Propostas e entregas</h3><p>Envie propostas, acompanhe projetos e registre entregas com kanban.</p></div>
            <div className="pcard"><div className="picon">🤖</div><h3>IA na operação</h3><p>Agentes ajudam a criar propostas, organizar tarefas e atender melhor.</p></div>
          </div>
        </section>

        {/* MARKETPLACE */}
        <section className="psection" id="pmarketplace">
          <div className="phero">
            <small>Marketplace Sualuma</small>
            <h2>Escolha um prestador e envie uma <span className="pgradient">proposta de serviço</span></h2>
            <p>Veja prestadores, analise especialidades e portfólio, e envie proposta. Para acompanhar, use o Dashboard do Cliente.</p>
          </div>
          <div className="pgrid pcols-3">
            <div className="pcard"><div className="picon">💻</div><h3>Sites e páginas</h3><p>Prestadores especializados em criação de sites, landing pages e sistemas web.</p></div>
            <div className="pcard"><div className="picon">📱</div><h3>Social media</h3><p>Gestão de redes sociais, criação de conteúdo e estratégia digital.</p></div>
            <div className="pcard"><div className="picon">⚡</div><h3>Automações e IA</h3><p>Agentes, fluxos automatizados e integrações para escalar operações.</p></div>
          </div>
        </section>

        {/* EMPRESA */}
        <section className="psection" id="pempresa">
          <div className="phero">
            <small>Área da empresa</small>
            <h2>Contrate com <span className="pgradient">mais clareza e segurança</span></h2>
            <p>Encontre prestadores, envie propostas e acompanhe projetos pelo dashboard do cliente.</p>
            <div style={{ display: "flex", gap: 12, marginTop: 24 }}>
              <a className="pbtn" href="/member-user">Abrir dashboard do cliente</a>
            </div>
          </div>
          <div className="pgrid pcols-3">
            <div className="pcard"><div className="picon">1</div><h3>Escolhe prestador</h3><p>Filtra por especialidade e analisa portfólio.</p></div>
            <div className="pcard"><div className="picon">2</div><h3>Envia proposta</h3><p>Informa demanda e acompanha resposta.</p></div>
            <div className="pcard"><div className="picon">3</div><h3>Acompanha entrega</h3><p>Kanban, arquivos, reuniões e chat direto.</p></div>
          </div>
        </section>

        {/* PRESTADOR */}
        <section className="psection" id="pprestador">
          <div className="ppanel-shell">
            <div className="psidepanel" id="pprestadorSide">
              <a href="#prestador" data-sub="painel">🏠 Painel</a>
              <a href="#prestador-propostas" data-sub="propostas">📨 Propostas</a>
              <a href="#prestador-portfolio" data-sub="portfolio">🖼️ Portfólio</a>
              <a href="#indicacoes" data-sub="indicacoes">🎁 Indicações</a>
            </div>
            <div>
              <div className="phero" style={{ marginTop: 0 }}>
                <small>Dashboard do prestador</small>
                <h2>Bem-vindo, <span className="pgradient">prestador</span></h2>
                <p>Gerencie propostas, portfólio, projetos e recebimentos em um só lugar.</p>
              </div>
              <div className="pgrid pcols-3">
                <div className="pcard pmetric"><span>Propostas recebidas</span><b>—</b></div>
                <div className="pcard pmetric"><span>Projetos ativos</span><b>—</b></div>
                <div className="pcard pmetric"><span>Faturamento mês</span><b>—</b></div>
              </div>
              <div className="pgrid pcols-2" style={{ marginTop: 18 }}>
                <div className="pcard">
                  <h3>Acesso rápido</h3>
                  <div className="plist">
                    <div className="pitem"><div><h4>Propostas</h4><p>Veja e responda propostas recebidas.</p></div><a className="pbadge" href="#prestador-propostas">Abrir</a></div>
                    <div className="pitem"><div><h4>Portfólio</h4><p>Atualize seus projetos e casos.</p></div><a className="pbadge" href="#prestador-portfolio">Abrir</a></div>
                    <div className="pitem"><div><h4>Indicações</h4><p>Monitore ganhos por indicação.</p></div><a className="pbadge" href="#indicacoes">Abrir</a></div>
                  </div>
                </div>
                <div className="pcard">
                  <h3>Links úteis</h3>
                  <div className="plist">
                    <div className="pitem"><div><h4>Dashboard do cliente</h4><p>Acesse sua área de cliente.</p></div><a className="pbadge" href="/member-user">Abrir</a></div>
                    <div className="pitem"><div><h4>Comunidade</h4><p>Troque experiências com outros prestadores.</p></div><a className="pbadge" href="https://trabalhosja.sualuma.online" target="_blank" rel="noopener noreferrer">Abrir</a></div>
                    <div className="pitem"><div><h4>Sualuma Online</h4><p>Site principal da plataforma.</p></div><a className="pbadge" href="https://sualuma.online" target="_blank" rel="noopener noreferrer">Abrir</a></div>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </section>

        {/* PROPOSTAS */}
        <section className="psection" id="pprestador-propostas">
          <div className="pcard">
            <h3>📨 Propostas recebidas</h3>
            <div className="plist" style={{ marginTop: 14 }}>
              <div className="pitem"><div><h4>Nenhuma proposta ainda</h4><p>Quando empresas enviarem propostas, elas aparecerão aqui.</p></div><span className="pbadge ok">Livre</span></div>
            </div>
          </div>
        </section>

        {/* PORTFÓLIO */}
        <section className="psection" id="pprestador-portfolio">
          <div className="pcard">
            <h3>🖼️ Portfólio</h3>
            <p style={{ marginTop: 8 }}>Adicione projetos, casos de sucesso e referências para atrair mais clientes.</p>
            <div className="plist" style={{ marginTop: 14 }}>
              <div className="pitem"><div><h4>Nenhum projeto cadastrado</h4><p>Adicione seu primeiro projeto de portfólio.</p></div><span className="pbadge">Em breve</span></div>
            </div>
          </div>
        </section>

        {/* INDICAÇÕES */}
        <section className="psection" id="pindicacoes">
          <div className="phero">
            <small>Programa de indicações</small>
            <h2>Ganhe indicando serviços, planos e outros prestadores</h2>
            <p>R$300 por site/página direta, 10% por assinatura da Sualuma e 5% nas duas primeiras propostas aceitas de prestadores indicados.</p>
          </div>
          <div className="pgrid pcols-3">
            <div className="pcard pmetric"><span>Indicações ativas</span><b>—</b></div>
            <div className="pcard pmetric"><span>Ganhos este mês</span><b>R$ —</b></div>
            <div className="pcard pmetric"><span>Total acumulado</span><b>R$ —</b></div>
          </div>
        </section>

        {/* CONFIGURAÇÕES */}
        <section className="psection" id="pconfiguracoes">
          <div className="pconfig-box">
            <h3>⚙️ Configurações da conta</h3>
            <p>Gerencie suas informações e sessão.</p>
            <div className="pconfig-row">
              <div>
                <label>E-mail</label>
                <small>{user!.email}</small>
              </div>
            </div>
            <div className="pconfig-row">
              <div>
                <label>Perfil</label>
                <small>Prestador de serviço</small>
              </div>
            </div>
            <div className="pconfig-row">
              <div>
                <label>Sair da conta</label>
                <small>Encerra sua sessão neste dispositivo.</small>
              </div>
              <form action={signOut} style={{ margin: 0 }}>
                <button type="submit" className="pbtn danger" style={{ padding: "10px 18px", fontSize: 13 }}>
                  Sair
                </button>
              </form>
            </div>
          </div>
        </section>

      </main>

      <script dangerouslySetInnerHTML={{ __html: `
        const pageMap = {
          inicio: 'pinicio',
          marketplace: 'pmarketplace',
          empresa: 'pempresa',
          prestador: 'pprestador',
          'prestador-propostas': 'pprestador-propostas',
          'prestador-portfolio': 'pprestador-portfolio',
          indicacoes: 'pindicacoes',
          configuracoes: 'pconfiguracoes',
        };

        function pnavigate() {
          const hash = location.hash.replace('#','') || 'inicio';
          document.querySelectorAll('.psection').forEach(el => el.classList.remove('active'));
          const id = pageMap[hash] || 'pinicio';
          const target = document.getElementById(id);
          if (target) target.classList.add('active');
          document.querySelectorAll('[data-page]').forEach(a => {
            a.classList.toggle('active', a.dataset.page === hash);
          });
        }

        window.addEventListener('hashchange', pnavigate);
        pnavigate();
      `}} />
    </>
  );
}
