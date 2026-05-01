"use client";

import { useEffect, useMemo, useRef, useState } from "react";

type MiaData = {
  usage_logs?: any[];
  costs?: any[];
  source?: string;
  tableNames?: string[];
  ok: boolean;
  message?: string;
  generated_at?: string;
  metrics?: Record<string, any>;
  providers?: any[];
  models?: any[];
  skills?: any[];
  prompts?: any[];
  voices?: any[];
  usageLogs?: any[];
  transcriptions?: any[];
  settings?: any[];
  error?: string;
};

const NAV_ITEMS = [
  { id: "visao-geral", label: "Visão Geral", icon: "⊞" },
  { id: "cerebro", label: "Cérebro da Mia", icon: "🧠" },
  { id: "apis", label: "APIs Conectadas", icon: "⟳" },
  { id: "modelos", label: "Modelos", icon: "◈" },
  { id: "prompt-studio", label: "Prompt Studio", icon: "⌥" },
  { id: "skills", label: "Skills", icon: "✦" },
  { id: "transcricao", label: "Transcrição", icon: "↯" },
  { id: "vozes", label: "Vozes", icon: "◎" },
  { id: "memoria", label: "Memória", icon: "⬡" },
  { id: "gastos", label: "Gastos", icon: "◉" },
  { id: "performance", label: "Performance", icon: "▲" },
  { id: "logs", label: "Logs", icon: "≡" },
  { id: "testes", label: "Testes", icon: "⬢" },
  { id: "configuracoes", label: "Configurações", icon: "⚙" },
];

function money(value: any) {
  const n = Number(value || 0);
  return n.toLocaleString("pt-BR", { style: "currency", currency: "BRL" });
}

function n(value: any) {
  const number = Number(value || 0);
  return Number.isFinite(number) ? number : 0;
}

function statusLabel(status: string) {
  if (status === "active" || status === "enabled") return "Ativo";
  if (status === "paused") return "Pausado";
  if (status === "error") return "Erro";
  return status || "Indefinido";
}

function statusClass(status: string) {
  if (status === "active" || status === "enabled" || status === "success") return "green";
  if (status === "paused" || status === "warning") return "yellow";
  if (status === "error" || status === "failed") return "red";
  return "";
}

function shortDate(value: any) {
  if (!value) return "—";
  try {
    return new Date(value).toLocaleString("pt-BR");
  } catch {
    return "—";
  }
}

function HolographicBrain() {
  const canvasRef = useRef<HTMLCanvasElement | null>(null);
  const animationRef = useRef<number | null>(null);

  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;

    const rawCtx = canvas.getContext("2d", { alpha: true });
    if (!rawCtx) return;
    const ctx: CanvasRenderingContext2D = rawCtx;

    const width = 720;
    const height = 430;
    const dpr = Math.min(window.devicePixelRatio || 1, 2);

    canvas.width = width * dpr;
    canvas.height = height * dpr;
    canvas.style.width = "100%";
    canvas.style.height = "100%";
    ctx.setTransform(dpr, 0, 0, dpr, 0, 0);

    type BrainNode = {
      x: number;
      y: number;
      z: number;
      r: number;
      phase: number;
    };

    let seed = 987654321;
    const rand = () => {
      seed = (seed * 9301 + 49297) % 233280;
      return seed / 233280;
    };

    const nodes: BrainNode[] = [];

    for (let i = 0; i < 320; i++) {
      const a = rand() * Math.PI * 2;
      const b = Math.pow(rand(), 0.55);

      let x = Math.cos(a) * 128 * b * (0.88 + rand() * 0.35);
      let y = Math.sin(a) * 96 * b * (0.92 + rand() * 0.28) - 20;
      const z = (rand() * 2 - 1) * 82 * (0.65 + rand() * 0.6);

      if (Math.abs(x) > 50) y += (Math.abs(x) - 50) * 0.08;

      nodes.push({
        x: x + (rand() - 0.5) * 16,
        y: y + (rand() - 0.5) * 18,
        z,
        r: 1.05 + rand() * 2.6,
        phase: rand() * Math.PI * 2 + i,
      });
    }

    let t = 0;

    function draw() {
      t += 0.007;

      ctx.clearRect(0, 0, width, height);

      const cx = width / 2;
      const cy = height / 2 - 10;
      const rot = t * 0.25;

      const cos = Math.cos(rot);
      const sin = Math.sin(rot);

      const aura = ctx.createRadialGradient(cx, cy, 30, cx, cy, 270);
      aura.addColorStop(0, "rgba(255, 65, 150, 0.28)");
      aura.addColorStop(0.45, "rgba(190, 40, 230, 0.13)");
      aura.addColorStop(1, "transparent");
      ctx.fillStyle = aura;
      ctx.fillRect(0, 0, width, height);

      for (let i = 0; i < 5; i++) {
        ctx.beginPath();
        ctx.ellipse(cx, cy + 158, 130 - i * 17, 20 - i * 2.4, 0, 0, Math.PI * 2);
        ctx.strokeStyle = `rgba(255, 79, 163, ${0.23 - i * 0.035})`;
        ctx.lineWidth = i === 0 ? 2 : 1;
        ctx.stroke();
      }

      const projected = nodes.map((node) => {
        const xr = node.x * cos + node.z * sin;
        const zr = node.z * cos - node.x * sin;
        const pers = 1 + zr / 290;

        return {
          x: cx + xr * pers * 0.97,
          y: cy + node.y * pers * 0.99,
          z: zr,
          r: Math.max(0.95, node.r * pers * 0.96),
          phase: node.phase,
        };
      });

      ctx.lineWidth = 0.8;
      for (let i = 0; i < projected.length; i += 2) {
        for (let j = i + 1; j < projected.length; j += 4) {
          const a = projected[i];
          const b = projected[j];
          const dist = Math.hypot(a.x - b.x, a.y - b.y);
          if (dist < 72 && dist > 6) {
            const alpha = (1 - dist / 72) * 0.26;
            ctx.strokeStyle = `rgba(255, 90, 190, ${alpha})`;
            ctx.beginPath();
            ctx.moveTo(a.x, a.y);
            ctx.lineTo(b.x, b.y);
            ctx.stroke();
          }
        }
      }

      projected
        .sort((a, b) => a.z - b.z)
        .forEach((node, idx) => {
          const pulse = 0.78 + Math.sin(t * 4.8 + node.phase) * 0.42;
          const col = idx % 3 === 0 ? "255,75,165" : "215,50,245";

          const glow = ctx.createRadialGradient(node.x, node.y, 0, node.x, node.y, node.r * 10);
          glow.addColorStop(0, `rgba(${col},0.38)`);
          glow.addColorStop(1, "transparent");
          ctx.fillStyle = glow;
          ctx.beginPath();
          ctx.arc(node.x, node.y, node.r * 10, 0, Math.PI * 2);
          ctx.fill();

          ctx.fillStyle = `rgba(${col},0.96)`;
          ctx.beginPath();
          ctx.arc(node.x, node.y, node.r * pulse, 0, Math.PI * 2);
          ctx.fill();
        });

      const scanY = cy - 155 + ((t * 48) % 320);
      ctx.fillStyle = "rgba(255, 110, 200, 0.16)";
      ctx.fillRect(cx - 230, scanY, 460, 2.5);

      animationRef.current = requestAnimationFrame(draw);
    }

    animationRef.current = requestAnimationFrame(draw);

    return () => {
      if (animationRef.current) cancelAnimationFrame(animationRef.current);
    };
  }, []);

  return (
    <div className="brain-stage">
      <div className="brain-tag tag-1">Modelos de IA</div>
      <div className="brain-tag tag-2">Voz & Áudio</div>
      <div className="brain-tag tag-3">Memória</div>
      <div className="brain-tag tag-4">Dados</div>
      <div className="brain-tag tag-5">Prompt Studio</div>
      <div className="brain-tag tag-6">Skills</div>
      <div className="brain-tag tag-7">APIs</div>
      <div className="brain-tag tag-8">Automação</div>
      <canvas ref={canvasRef} className="brain-canvas" />
    </div>
  );
}

function MiniBar({ value }: { value: number }) {
  const safe = Math.max(3, Math.min(100, Number(value || 0)));
  return (
    <div className="mini-bar">
      <div style={{ width: `${safe}%` }} />
    </div>
  );
}

function Empty({ text }: { text: string }) {
  return <div className="empty">{text}</div>;
}

export default function MiaBrainPage() {
  const [activeNav, setActiveNav] = useState("visao-geral");
  const [data, setData] = useState<MiaData | null>(null);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState("");

  async function loadData() {
    try {
      setError("");
      const res = await fetch("/api/studio/mia-brain", { cache: "no-store" });
      const json = await res.json();
      if (!json.ok) throw new Error(json.error || "Erro ao carregar Mia Brain.");
      setData(json);
    } catch (err: any) {
      setError(err?.message || String(err));
    } finally {
      setLoading(false);
    }
  }

  useEffect(() => {
    loadData();
    const id = setInterval(loadData, 15000);
    return () => clearInterval(id);
  }, []);

  const providers = data?.providers || [];
  const models = data?.models || [];
  const skills = data?.skills || [];
  const prompts = data?.prompts || [];
  const voices = data?.voices || [];
  const logs = data?.usageLogs || data?.usage_logs || [];
  const transcriptions = data?.transcriptions || [];
  const metrics = data?.metrics || {};

  const ranking = useMemo(() => {
    return [...models]
      .sort((a, b) => n(b.quality_score) - n(a.quality_score))
      .slice(0, 6);
  }, [models]);

  async function updateResource(resource: string, id: string, patch: Record<string, any>) {
    try {
      setSaving(true);
      setError("");

      const res = await fetch("/api/studio/mia-brain", {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ resource, id, patch }),
      });

      const json = await res.json();
      if (!json.ok) throw new Error(json.error || "Erro ao salvar.");
      await loadData();
    } catch (err: any) {
      setError(err?.message || String(err));
    } finally {
      setSaving(false);
    }
  }

  async function createTestLog() {
    try {
      setSaving(true);
      setError("");

      const res = await fetch("/api/studio/mia-brain", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          resource: "usage_log",
          data: {
            provider_slug: "mia-brain",
            model_slug: "dashboard",
            skill_slug: "painel-vivo",
            event_type: "dashboard_test",
            status: "success",
            message: "Teste manual feito pelo painel Mia Brain.",
            cost: 0,
            latency_ms: 120,
            metadata: { source: "button_test" },
          },
        }),
      });

      const json = await res.json();
      if (!json.ok) throw new Error(json.error || "Erro ao criar log.");
      await loadData();
      setActiveNav("logs");
    } catch (err: any) {
      setError(err?.message || String(err));
    } finally {
      setSaving(false);
    }
  }

  const cardMetrics = [
    {
      icon: "◈",
      label: "APIs Ativas",
      val: String(metrics.providers_active ?? providers.filter((p) => p.status === "active").length),
      sub: `${metrics.providers_total ?? providers.length} conectadas no banco`,
    },
    {
      icon: "⚡",
      label: "Skills Ligadas",
      val: String(metrics.skills_active ?? skills.filter((s) => s.status === "active" || s.status === "enabled").length),
      sub: `${metrics.skills_total ?? skills.length} skills cadastradas`,
    },
    {
      icon: "◉",
      label: "Custo Hoje",
      val: money(metrics.today_cost || 0),
      sub: "calculado pelos logs e providers",
    },
    {
      icon: "⏱",
      label: "Tempo Médio",
      val: `${metrics.avg_latency_ms || 0}ms`,
      sub: `${metrics.total_requests || 0} eventos registrados`,
    },
  ];

  function SectionTitle({ title, subtitle, action }: { title: string; subtitle?: string; action?: React.ReactNode }) {
    return (
      <div className="section-title">
        <div>
          <h2>{title}</h2>
          {subtitle ? <p>{subtitle}</p> : null}
        </div>
        {action}
      </div>
    );
  }

  function ProvidersTable() {
    return (
      <div className="grid-cards">
        {providers.length ? (
          providers.map((api) => (
            <div className="glass item-card" key={api.id}>
              <div className="item-top">
                <div className="item-icon">⟳</div>
                <div>
                  <h3>{api.name}</h3>
                  <p>{api.category || "provider"} • {api.model_default || "sem modelo padrão"}</p>
                </div>
                <span className={`pill ${statusClass(api.status)}`}>{statusLabel(api.status)}</span>
              </div>

              <div className="kv">
                <span>Prioridade</span>
                <strong>{api.priority ?? "—"}</strong>
              </div>
              <div className="kv">
                <span>Latência média</span>
                <strong>{api.avg_latency_ms ?? 0}ms</strong>
              </div>
              <div className="kv">
                <span>Custo hoje</span>
                <strong>{money(api.today_cost || 0)}</strong>
              </div>
              <div className="kv">
                <span>Gratuita?</span>
                <strong>{api.is_free ? "Sim" : "Não"}</strong>
              </div>

              <div className="card-actions">
                <button
                  className="btn"
                  disabled={saving}
                  onClick={() => updateResource("provider", api.id, { status: api.status === "active" ? "paused" : "active" })}
                >
                  {api.status === "active" ? "Pausar" : "Ativar"}
                </button>
                <button className="btn ghost" onClick={() => setActiveNav("performance")}>Ver desempenho</button>
              </div>
            </div>
          ))
        ) : (
          <Empty text="Nenhuma API encontrada no banco." />
        )}
      </div>
    );
  }

  function SkillsTable() {
    return (
      <div className="grid-cards">
        {skills.length ? (
          skills.map((skill) => (
            <div className="glass item-card" key={skill.id}>
              <div className="item-top">
                <div className="item-icon">✦</div>
                <div>
                  <h3>{skill.name || skill.slug || "Skill"}</h3>
                  <p>{skill.category || skill.type || "skill"} • {skill.description || "sem descrição"}</p>
                </div>
                <span className={`pill ${statusClass(skill.status)}`}>{statusLabel(skill.status)}</span>
              </div>

              <div className="kv">
                <span>Execuções</span>
                <strong>{skill.total_runs ?? skill.runs ?? 0}</strong>
              </div>
              <div className="kv">
                <span>Sucesso</span>
                <strong>{skill.success_rate ?? skill.quality_score ?? 0}%</strong>
              </div>
              <div className="kv">
                <span>Latência</span>
                <strong>{skill.avg_latency_ms ?? 0}ms</strong>
              </div>

              <MiniBar value={Number(skill.success_rate || skill.quality_score || 70)} />

              <div className="card-actions">
                <button
                  className="btn"
                  disabled={saving}
                  onClick={() => updateResource("skill", skill.id, { status: skill.status === "active" ? "paused" : "active" })}
                >
                  {skill.status === "active" ? "Pausar" : "Ativar"}
                </button>
                <button className="btn ghost" onClick={() => setActiveNav("logs")}>Ver logs</button>
              </div>
            </div>
          ))
        ) : (
          <Empty text="Nenhuma skill encontrada no banco." />
        )}
      </div>
    );
  }

  function ModelsTable() {
    return (
      <div className="grid-cards">
        {models.length ? (
          models.map((model) => (
            <div className="glass item-card" key={model.id}>
              <div className="item-top">
                <div className="item-icon">◈</div>
                <div>
                  <h3>{model.name || model.model_slug}</h3>
                  <p>{model.provider_slug} • {model.type || "chat"}</p>
                </div>
                <span className={`pill ${statusClass(model.status)}`}>{statusLabel(model.status)}</span>
              </div>
              <div className="kv"><span>Score</span><strong>{model.quality_score ?? 0}</strong></div>
              <div className="kv"><span>Contexto</span><strong>{model.context_window ?? "—"}</strong></div>
              <div className="kv"><span>Latência</span><strong>{model.avg_latency_ms ?? 0}ms</strong></div>
              <MiniBar value={Number(model.quality_score || 0)} />
            </div>
          ))
        ) : (
          <Empty text="Nenhum modelo encontrado no banco." />
        )}
      </div>
    );
  }

  function PromptsTable() {
    return (
      <div className="table-card glass">
        <div className="table-head">
          <span>Nome</span>
          <span>Tipo</span>
          <span>Versão</span>
          <span>Atualizado</span>
        </div>
        {prompts.length ? (
          prompts.map((prompt) => (
            <div className="table-row" key={prompt.id}>
              <span>{prompt.name || prompt.title || "Prompt"}</span>
              <span>{prompt.type || prompt.category || "sistema"}</span>
              <span>{prompt.version || "v1"}</span>
              <span>{shortDate(prompt.updated_at || prompt.created_at)}</span>
            </div>
          ))
        ) : (
          <Empty text="Nenhum prompt encontrado no banco." />
        )}
      </div>
    );
  }

  function VoicesTable() {
    return (
      <div className="grid-cards">
        {voices.length ? (
          voices.map((voice) => (
            <div className="glass item-card" key={voice.id}>
              <div className="item-top">
                <div className="item-icon">◎</div>
                <div>
                  <h3>{voice.name || voice.voice_slug || "Voz"}</h3>
                  <p>{voice.provider_slug || "TTS"} • {voice.language || voice.locale || "pt-BR"}</p>
                </div>
                <span className={`pill ${statusClass(voice.status)}`}>{statusLabel(voice.status)}</span>
              </div>
              <div className="wave">
                {Array.from({ length: 32 }).map((_, i) => <i key={i} style={{ height: `${8 + Math.abs(Math.sin(i * 0.7)) * 28}px` }} />)}
              </div>
              <div className="card-actions">
                <button
                  className="btn"
                  disabled={saving}
                  onClick={() => updateResource("voice", voice.id, { status: voice.status === "active" ? "paused" : "active" })}
                >
                  {voice.status === "active" ? "Pausar voz" : "Ativar voz"}
                </button>
              </div>
            </div>
          ))
        ) : (
          <Empty text="Nenhuma voz encontrada no banco." />
        )}
      </div>
    );
  }

  function LogsTable() {
    return (
      <div className="table-card glass">
        <div className="table-head logs-head">
          <span>Status</span>
          <span>Provider</span>
          <span>Mensagem</span>
          <span>Custo</span>
          <span>Data</span>
        </div>
        {logs.length ? (
          logs.slice(0, 80).map((log, index) => (
            <div className="table-row logs-row" key={log.id || index}>
              <span><b className={`dot ${statusClass(log.status)}`} /> {statusLabel(log.status)}</span>
              <span>{log.provider_slug || log.provider || "—"}</span>
              <span>{log.message || log.event_type || log.skill_slug || "Evento registrado"}</span>
              <span>{money(log.cost || log.total_cost || log.estimated_cost || 0)}</span>
              <span>{shortDate(log.created_at)}</span>
            </div>
          ))
        ) : (
          <Empty text="Nenhum log encontrado. Clique em 'Registrar teste' para criar o primeiro evento." />
        )}
      </div>
    );
  }

  function RenderActiveSection() {
    if (activeNav === "visao-geral") {
      return (
        <>
          <div className="metrics">
            {cardMetrics.map((m) => (
              <div className="glass metric-card" key={m.label}>
                <div className="metric-icon">{m.icon}</div>
                <div>
                  <span>{m.label}</span>
                  <strong>{m.val}</strong>
                  <small>{m.sub}</small>
                </div>
              </div>
            ))}
          </div>

          <div className="hero-grid">
            <div className="glass api-list">
              <SectionTitle title="APIs Conectadas" subtitle="Dados reais vindos do banco" action={<button className="link-btn" onClick={() => setActiveNav("apis")}>Ver todas</button>} />
              {providers.slice(0, 8).map((api) => (
                <div className="compact-row" key={api.id}>
                  <span className={`dot ${statusClass(api.status)}`} />
                  <div>
                    <strong>{api.name}</strong>
                    <small>{api.category}</small>
                  </div>
                  <em>{statusLabel(api.status)}</em>
                </div>
              ))}
            </div>

            <div className="glass brain-card">
              <HolographicBrain />
            </div>

            <div className="glass ranking">
              <SectionTitle title="Melhor desempenho" subtitle="Ranking por score" />
              {ranking.map((model, index) => (
                <div className="ranking-row" key={model.id || index}>
                  <span>{index + 1}</span>
                  <div>
                    <strong>{model.name || model.model_slug}</strong>
                    <small>{model.provider_slug}</small>
                  </div>
                  <b>{model.quality_score ?? 0}</b>
                </div>
              ))}
            </div>
          </div>

          <div className="bottom-grid">
            <div className="glass">
              <SectionTitle title="Skills mais importantes" subtitle="Clique em Skills para gerenciar" />
              {skills.slice(0, 5).map((skill) => (
                <div className="skill-line" key={skill.id}>
                  <div>
                    <strong>{skill.name || skill.slug}</strong>
                    <small>{statusLabel(skill.status)}</small>
                  </div>
                  <MiniBar value={Number(skill.success_rate || skill.quality_score || 70)} />
                </div>
              ))}
            </div>

            <div className="glass">
              <SectionTitle title="Logs recentes" subtitle={`${logs.length} eventos no banco`} action={<button className="link-btn" onClick={() => setActiveNav("logs")}>Ver logs</button>} />
              {logs.slice(0, 6).map((log, index) => (
                <div className="compact-row" key={log.id || index}>
                  <span className={`dot ${statusClass(log.status)}`} />
                  <div>
                    <strong>{log.message || log.event_type || "Evento"}</strong>
                    <small>{shortDate(log.created_at)}</small>
                  </div>
                  <em>{money(log.cost || 0)}</em>
                </div>
              ))}
              {!logs.length && <Empty text="Ainda sem logs reais." />}
            </div>
          </div>
        </>
      );
    }

    if (activeNav === "cerebro") {
      return (
        <div className="single-grid">
          <div className="glass brain-big">
            <SectionTitle title="Cérebro da Mia" subtitle="Núcleo visual de orquestração das IAs, skills e APIs" />
            <HolographicBrain />
          </div>
          <div className="glass">
            <SectionTitle title="Estado do cérebro" subtitle="Resumo vivo do banco" />
            <div className="state-grid">
              <div><strong>{providers.length}</strong><span>APIs</span></div>
              <div><strong>{models.length}</strong><span>Modelos</span></div>
              <div><strong>{skills.length}</strong><span>Skills</span></div>
              <div><strong>{prompts.length}</strong><span>Prompts</span></div>
              <div><strong>{voices.length}</strong><span>Vozes</span></div>
              <div><strong>{logs.length}</strong><span>Logs</span></div>
            </div>
          </div>
        </div>
      );
    }

    if (activeNav === "apis") {
      return (
        <>
          <SectionTitle title="APIs Conectadas" subtitle="Ative, pause e acompanhe os providers da Mia" />
          <ProvidersTable />
        </>
      );
    }

    if (activeNav === "modelos") {
      return (
        <>
          <SectionTitle title="Modelos" subtitle="Modelos disponíveis por provider" />
          <ModelsTable />
        </>
      );
    }

    if (activeNav === "skills") {
      return (
        <>
          <SectionTitle title="Skills" subtitle="Habilidades operacionais da Mia" />
          <SkillsTable />
        </>
      );
    }

    if (activeNav === "prompt-studio") {
      return (
        <>
          <SectionTitle title="Prompt Studio" subtitle="Prompts salvos no banco da Mia" />
          <PromptsTable />
        </>
      );
    }

    if (activeNav === "vozes") {
      return (
        <>
          <SectionTitle title="Vozes" subtitle="Vozes TTS cadastradas" />
          <VoicesTable />
        </>
      );
    }

    if (activeNav === "transcricao") {
      return (
        <>
          <SectionTitle title="Transcrição" subtitle="Histórico de áudios transcritos" />
          {transcriptions.length ? <LogsTable /> : <Empty text="Ainda não há transcrições salvas no banco." />}
        </>
      );
    }

    if (activeNav === "gastos") {
      return (
        <>
          <SectionTitle title="Gastos" subtitle="Custo calculado por provider e logs de uso" />
          <div className="metrics">
            <div className="glass metric-card"><div className="metric-icon">◉</div><div><span>Custo hoje</span><strong>{money(metrics.today_cost || 0)}</strong><small>baseado no banco</small></div></div>
            <div className="glass metric-card"><div className="metric-icon">≡</div><div><span>Eventos</span><strong>{logs.length}</strong><small>logs registrados</small></div></div>
            <div className="glass metric-card"><div className="metric-icon">⟳</div><div><span>APIs pagas</span><strong>{providers.filter((p) => !p.is_free).length}</strong><small>providers não gratuitos</small></div></div>
            <div className="glass metric-card"><div className="metric-icon">✦</div><div><span>APIs gratuitas</span><strong>{providers.filter((p) => p.is_free).length}</strong><small>providers gratuitos</small></div></div>
          </div>
          <ProvidersTable />
        </>
      );
    }

    if (activeNav === "performance") {
      return (
        <>
          <SectionTitle title="Performance" subtitle="Latência e score dos modelos" />
          <ModelsTable />
        </>
      );
    }

    if (activeNav === "logs") {
      return (
        <>
          <SectionTitle title="Logs" subtitle="Eventos reais salvos no banco" action={<button className="btn" disabled={saving} onClick={createTestLog}>Registrar teste</button>} />
          <LogsTable />
        </>
      );
    }

    if (activeNav === "testes") {
      return (
        <div className="glass test-panel">
          <SectionTitle title="Testes" subtitle="Use para verificar se o painel consegue escrever no banco" />
          <button className="btn big" disabled={saving} onClick={createTestLog}>
            {saving ? "Registrando..." : "Registrar evento de teste no banco"}
          </button>
          <p>Depois do teste, abra a aba Logs. O evento deve aparecer automaticamente.</p>
        </div>
      );
    }

    if (activeNav === "memoria") {
      return (
        <div className="glass test-panel">
          <SectionTitle title="Memória" subtitle="Área reservada para memórias, arquivos e instruções da Mia" />
          <p>Próximo passo: criar tabela de memórias da Mia e conectar upload de documentos, prompts fixos e contexto do sistema.</p>
        </div>
      );
    }

    return (
      <div className="glass test-panel">
        <SectionTitle title="Configurações" subtitle="Configurações operacionais da Mia Brain" />
        <div className="state-grid">
          <div><strong>{data?.source || "postgres"}</strong><span>Fonte</span></div>
          <div><strong>{data?.ok ? "Online" : "Erro"}</strong><span>API</span></div>
          <div><strong>{shortDate(data?.generated_at)}</strong><span>Última leitura</span></div>
        </div>
      </div>
    );
  }

  return (
    <>
      <style>{`
        @import url('https://fonts.googleapis.com/css2?family=Syne:wght@400;500;600;700;800&family=JetBrains+Mono:wght@400;500;600&display=swap');

        *{box-sizing:border-box}
        :root{
          --bg:#05060b;
          --panel:#090a12;
          --card:rgba(15,16,27,.86);
          --card2:rgba(255,255,255,.035);
          --border:rgba(255,79,163,.18);
          --red:#ff3b5f;
          --pink:#ff4fa3;
          --mag:#d946ef;
          --text:#f5f2ff;
          --muted:#9b97b4;
          --green:#4ade80;
          --yellow:#fbbf24;
          --blue:#38bdf8;
        }

        body{margin:0;background:var(--bg);font-family:Syne,system-ui,sans-serif;color:var(--text)}
        button{font-family:inherit}

        .shell{height:100vh;display:flex;overflow:hidden;background:
          radial-gradient(circle at 60% 20%,rgba(255,79,163,.16),transparent 34%),
          radial-gradient(circle at 20% 80%,rgba(217,70,239,.12),transparent 30%),
          #05060b;
        }

        .sidebar{width:245px;min-width:245px;background:rgba(6,7,14,.97);border-right:1px solid var(--border);display:flex;flex-direction:column}
        .logo{height:72px;padding:16px;border-bottom:1px solid var(--border);display:flex;align-items:center;gap:12px}
        .logo-icon{width:40px;height:40px;border-radius:14px;background:linear-gradient(135deg,rgba(255,59,95,.35),rgba(217,70,239,.25));border:1px solid rgba(255,79,163,.45);display:flex;align-items:center;justify-content:center;box-shadow:0 0 22px rgba(255,79,163,.22)}
        .logo strong{display:block;font-size:15px;background:linear-gradient(135deg,var(--red),var(--pink));-webkit-background-clip:text;-webkit-text-fill-color:transparent}
        .logo span{font-size:11px;color:var(--muted)}

        .nav{flex:1;overflow:auto;padding:10px}
        .nav button{width:100%;border:1px solid transparent;background:transparent;color:var(--muted);display:flex;align-items:center;gap:10px;padding:10px 11px;border-radius:12px;cursor:pointer;font-size:13px;margin-bottom:4px;text-align:left;transition:.2s}
        .nav button:hover{background:rgba(255,79,163,.08);color:white}
        .nav button.active{background:linear-gradient(135deg,rgba(255,59,95,.22),rgba(255,79,163,.12));border-color:rgba(255,79,163,.35);color:white;box-shadow:0 0 18px rgba(255,79,163,.12)}
        .nav i{font-style:normal;width:22px;text-align:center}

        .sidebar-foot{margin:10px;padding:12px;border:1px solid var(--border);border-radius:14px;background:rgba(255,79,163,.06)}
        .sidebar-foot strong{font-size:12px}
        .sidebar-foot span{display:flex;align-items:center;gap:6px;font-size:11px;color:var(--green);margin-top:8px}

        .main{flex:1;display:flex;flex-direction:column;min-width:0}
        .topbar{height:68px;min-height:68px;border-bottom:1px solid var(--border);background:rgba(6,7,14,.9);backdrop-filter:blur(14px);display:flex;align-items:center;padding:0 22px;gap:16px}
        .topbar h1{font-size:22px;margin:0}
        .topbar h1 span{background:linear-gradient(135deg,var(--red),var(--pink));-webkit-background-clip:text;-webkit-text-fill-color:transparent}
        .topbar p{margin:2px 0 0;color:var(--muted);font-size:11px}
        .top-actions{margin-left:auto;display:flex;gap:8px;align-items:center}

        .content{flex:1;overflow:auto;padding:18px 22px 28px}
        .glass{background:var(--card);border:1px solid var(--border);border-radius:18px;box-shadow:0 0 24px rgba(255,79,163,.06);backdrop-filter:blur(14px)}
        .metrics{display:grid;grid-template-columns:repeat(4,minmax(0,1fr));gap:12px;margin-bottom:14px}
        .metric-card{padding:16px;display:flex;gap:13px;align-items:center}
        .metric-icon{width:42px;height:42px;border-radius:14px;background:linear-gradient(135deg,rgba(255,59,95,.22),rgba(255,79,163,.12));border:1px solid rgba(255,79,163,.3);display:flex;align-items:center;justify-content:center;font-size:18px;box-shadow:0 0 16px rgba(255,79,163,.12)}
        .metric-card span{display:block;color:var(--muted);font-size:11px}
        .metric-card strong{display:block;font-size:23px;line-height:1.1;margin-top:3px}
        .metric-card small{display:block;color:var(--pink);font-size:10px;margin-top:4px}

        .hero-grid{display:grid;grid-template-columns:250px 1fr 280px;gap:12px;margin-bottom:12px}
        .api-list,.ranking{padding:14px}
        .brain-card{position:relative;min-height:390px;overflow:hidden;background:
          linear-gradient(rgba(255,79,163,.035) 1px,transparent 1px),
          linear-gradient(90deg,rgba(255,79,163,.035) 1px,transparent 1px),
          rgba(12,13,22,.82);
          background-size:32px 32px;
        }

        .brain-stage{height:100%;min-height:370px;position:relative;display:flex;align-items:center;justify-content:center;overflow:hidden}
        .brain-canvas{width:100%;height:100%;display:block}
        .brain-tag{position:absolute;z-index:3;background:rgba(8,9,16,.82);border:1px solid rgba(255,79,163,.32);color:var(--pink);font-size:11px;border-radius:999px;padding:7px 11px;box-shadow:0 0 14px rgba(255,79,163,.12);white-space:nowrap}
        .tag-1{left:20px;top:14%}.tag-2{left:16px;top:31%}.tag-3{left:24px;top:50%}.tag-4{left:38px;top:70%}
        .tag-5{right:20px;top:14%}.tag-6{right:42px;top:31%}.tag-7{right:50px;top:50%}.tag-8{right:24px;top:70%}

        .section-title{display:flex;align-items:flex-start;justify-content:space-between;gap:14px;margin-bottom:12px}
        .section-title h2{font-size:15px;margin:0}
        .section-title p{font-size:11px;color:var(--muted);margin:4px 0 0}

        .compact-row{display:flex;align-items:center;gap:9px;padding:9px;border-radius:12px;background:rgba(255,255,255,.025);border:1px solid rgba(255,255,255,.04);margin-bottom:8px}
        .compact-row div{flex:1;min-width:0}
        .compact-row strong{display:block;font-size:12px;white-space:nowrap;overflow:hidden;text-overflow:ellipsis}
        .compact-row small{display:block;font-size:10px;color:var(--muted);margin-top:2px}
        .compact-row em{font-style:normal;font-size:10px;color:var(--pink)}

        .dot{width:8px;height:8px;border-radius:999px;display:inline-block;background:var(--blue);box-shadow:0 0 8px var(--blue);flex-shrink:0}
        .dot.green,.pill.green{background:rgba(74,222,128,.12);color:var(--green);border-color:rgba(74,222,128,.3)}
        .dot.green{background:var(--green);box-shadow:0 0 8px var(--green)}
        .dot.yellow,.pill.yellow{background:rgba(251,191,36,.12);color:var(--yellow);border-color:rgba(251,191,36,.3)}
        .dot.yellow{background:var(--yellow);box-shadow:0 0 8px var(--yellow)}
        .dot.red,.pill.red{background:rgba(255,59,95,.12);color:var(--red);border-color:rgba(255,59,95,.3)}
        .dot.red{background:var(--red);box-shadow:0 0 8px var(--red)}

        .ranking-row{display:flex;align-items:center;gap:10px;padding:9px 0;border-bottom:1px solid rgba(255,255,255,.06)}
        .ranking-row span{color:var(--muted);font-size:12px;width:18px}
        .ranking-row div{flex:1}
        .ranking-row strong{display:block;font-size:12px}
        .ranking-row small{display:block;font-size:10px;color:var(--muted)}
        .ranking-row b{font-family:JetBrains Mono,monospace;color:var(--pink);font-size:12px}

        .bottom-grid{display:grid;grid-template-columns:1fr 1fr;gap:12px}
        .bottom-grid>.glass{padding:14px}

        .skill-line{margin-bottom:12px}
        .skill-line strong{font-size:12px}
        .skill-line small{display:block;font-size:10px;color:var(--muted);margin-top:2px}

        .mini-bar{height:7px;background:rgba(255,255,255,.07);border-radius:999px;overflow:hidden;margin-top:6px}
        .mini-bar div{height:100%;border-radius:999px;background:linear-gradient(90deg,var(--red),var(--pink),var(--mag));box-shadow:0 0 10px rgba(255,79,163,.4)}

        .grid-cards{display:grid;grid-template-columns:repeat(3,minmax(0,1fr));gap:12px}
        .item-card{padding:15px}
        .item-top{display:flex;align-items:flex-start;gap:11px;margin-bottom:14px}
        .item-top h3{font-size:14px;margin:0}
        .item-top p{font-size:11px;color:var(--muted);margin:3px 0 0}
        .item-icon{width:38px;height:38px;border-radius:13px;background:rgba(255,79,163,.12);border:1px solid rgba(255,79,163,.28);display:flex;align-items:center;justify-content:center;box-shadow:0 0 14px rgba(255,79,163,.12)}
        .pill{border:1px solid rgba(255,255,255,.12);border-radius:999px;padding:5px 8px;font-size:10px;margin-left:auto;background:rgba(255,255,255,.05);color:var(--muted);white-space:nowrap}
        .kv{display:flex;justify-content:space-between;gap:10px;font-size:11px;padding:8px 0;border-top:1px solid rgba(255,255,255,.06)}
        .kv span{color:var(--muted)}
        .kv strong{font-family:JetBrains Mono,monospace}

        .card-actions{display:flex;gap:8px;margin-top:12px}
        .btn,.link-btn{border:1px solid rgba(255,79,163,.38);background:linear-gradient(135deg,rgba(255,59,95,.16),rgba(255,79,163,.1));color:white;border-radius:11px;padding:9px 12px;font-size:12px;font-weight:700;cursor:pointer;box-shadow:0 0 14px rgba(255,79,163,.12);transition:.2s}
        .btn:hover,.link-btn:hover{border-color:var(--pink);transform:translateY(-1px)}
        .btn:disabled{opacity:.55;cursor:not-allowed}
        .btn.ghost{background:rgba(255,255,255,.04);color:var(--muted)}
        .btn.big{font-size:14px;padding:13px 16px}
        .link-btn{font-size:11px;padding:7px 10px;color:var(--pink)}

        .table-card{padding:12px;overflow:hidden}
        .table-head,.table-row{display:grid;grid-template-columns:2fr 1fr 1fr 1.3fr;gap:10px;align-items:center;padding:11px 12px;border-radius:12px;font-size:12px}
        .table-head{color:var(--muted);font-size:10px;text-transform:uppercase;letter-spacing:.06em}
        .table-row{background:rgba(255,255,255,.025);border:1px solid rgba(255,255,255,.045);margin-bottom:6px}
        .logs-head,.logs-row{grid-template-columns:1fr 1fr 2.5fr 1fr 1.5fr}

        .wave{display:flex;align-items:center;gap:3px;height:44px;margin:12px 0;padding:8px;background:rgba(255,255,255,.025);border-radius:12px;border:1px solid rgba(255,255,255,.04)}
        .wave i{width:4px;border-radius:999px;background:linear-gradient(to top,var(--red),var(--pink));animation:wave 1.4s ease-in-out infinite}
        .wave i:nth-child(2n){animation-delay:.12s}.wave i:nth-child(3n){animation-delay:.24s}
        @keyframes wave{50%{transform:scaleY(1.45);opacity:.7}}

        .single-grid{display:grid;grid-template-columns:2fr 1fr;gap:12px}
        .brain-big{min-height:560px;padding:16px}
        .state-grid{display:grid;grid-template-columns:repeat(2,1fr);gap:10px;padding:12px}
        .state-grid div{padding:16px;border-radius:14px;background:rgba(255,255,255,.035);border:1px solid rgba(255,255,255,.06);text-align:center}
        .state-grid strong{display:block;font-size:22px;color:var(--pink)}
        .state-grid span{font-size:10px;color:var(--muted)}

        .test-panel{padding:22px;max-width:760px}
        .test-panel p{color:var(--muted);font-size:13px;line-height:1.6}

        .empty{padding:18px;border:1px dashed rgba(255,79,163,.24);border-radius:14px;color:var(--muted);font-size:13px;background:rgba(255,255,255,.02)}
        .error{border:1px solid rgba(255,59,95,.35);background:rgba(255,59,95,.08);color:#ffd7df;border-radius:14px;padding:11px 13px;margin-bottom:12px;font-size:12px}
        .loading{padding:40px;color:var(--muted)}

        @media(max-width:1100px){
          .sidebar{width:76px;min-width:76px}
          .logo div:not(.logo-icon),.nav span,.sidebar-foot strong,.sidebar-foot span{display:none}
          .nav button{justify-content:center}
          .hero-grid,.bottom-grid,.single-grid{grid-template-columns:1fr}
          .metrics,.grid-cards{grid-template-columns:repeat(2,1fr)}
        }

        @media(max-width:760px){
          .shell{height:auto;min-height:100vh}
          .sidebar{display:none}
          .topbar{height:auto;padding:14px;align-items:flex-start;flex-direction:column}
          .top-actions{margin-left:0}
          .metrics,.grid-cards{grid-template-columns:1fr}
          .content{padding:14px}
          .hero-grid{grid-template-columns:1fr}
          .brain-tag{display:none}
          .table-head,.table-row,.logs-head,.logs-row{grid-template-columns:1fr}
        }
      `}</style>

      <div className="shell">
        <aside className="sidebar">
          <div className="logo">
            <div className="logo-icon">🧠</div>
            <div>
              <strong>Mia Brain</strong>
              <span>Estúdio Sualuma</span>
            </div>
          </div>

          <nav className="nav">
            {NAV_ITEMS.map((item) => (
              <button
                key={item.id}
                className={activeNav === item.id ? "active" : ""}
                onClick={() => setActiveNav(item.id)}
              >
                <i>{item.icon}</i>
                <span>{item.label}</span>
              </button>
            ))}
          </nav>

          <div className="sidebar-foot">
            <strong>Banco vivo</strong>
            <span><b className="dot green" /> PostgreSQL/Supabase</span>
          </div>
        </aside>

        <main className="main">
          <header className="topbar">
            <div>
              <h1><span>Mia</span> Brain</h1>
              <p>
                {loading ? "Carregando banco vivo..." : `Última leitura: ${shortDate(data?.generated_at)}`}
              </p>
            </div>

            <div className="top-actions">
              <button className="btn ghost" onClick={loadData} disabled={loading || saving}>
                Atualizar
              </button>
              <button className="btn" onClick={createTestLog} disabled={saving}>
                {saving ? "Salvando..." : "Registrar teste"}
              </button>
            </div>
          </header>

          <section className="content">
            {error ? <div className="error">Erro: {error}</div> : null}
            {loading ? <div className="loading">Carregando dados reais da Mia Brain...</div> : <RenderActiveSection />}
          </section>
        </main>
      </div>
    </>
  );
}
