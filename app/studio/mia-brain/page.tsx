"use client";

import { useEffect, useMemo, useRef, useState } from "react";

type NavItem = {
  id: string;
  label: string;
  icon: string;
};

type ApiItem = {
  name: string;
  icon: string;
  color: string;
  status: "Ativa" | "Pausada" | "Erro";
};

type RankingItem = {
  name: string;
  score: number;
  icon: string;
  color: string;
};

type PromptItem = {
  name: string;
  tag?: string;
  type: string;
  updated: string;
  version: string;
};

type SkillItem = {
  name: string;
  pct: number;
};

type LogItem = {
  msg: string;
  time: string;
  status: "ok" | "warn" | "err";
};

type PerfItem = {
  model: string;
  latency: number;
  precision: number;
};

const NAV_ITEMS: NavItem[] = [
  { id: "visao-geral", label: "Visão Geral", icon: "⌂" },
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

const APIS: ApiItem[] = [
  { name: "Gemini", icon: "✦", color: "#4285f4", status: "Ativa" },
  { name: "OpenRouter", icon: "◁", color: "#ff4fa3", status: "Ativa" },
  { name: "Ollama", icon: "◎", color: "#ff3b5f", status: "Ativa" },
  { name: "Whisper", icon: "◈", color: "#d946ef", status: "Ativa" },
  { name: "Edge TTS", icon: "⊞", color: "#22d3ee", status: "Ativa" },
  { name: "WhatsApp", icon: "◉", color: "#25d366", status: "Ativa" },
  { name: "Supabase", icon: "⬡", color: "#3ecf8e", status: "Ativa" },
];

const RANKINGS: RankingItem[] = [
  { name: "Gemini 2.5", score: 96.4, icon: "✦", color: "#4285f4" },
  { name: "Ollama Local", score: 93.1, icon: "◎", color: "#ff3b5f" },
  { name: "OpenRouter", score: 91.7, icon: "◁", color: "#ff4fa3" },
  { name: "Whisper Large", score: 89.3, icon: "◈", color: "#d946ef" },
  { name: "Edge TTS", score: 88.2, icon: "⊞", color: "#22d3ee" },
];

const PROMPTS: PromptItem[] = [
  { name: "Atendimento IA v2.3", tag: "Padrão", type: "Sistema", updated: "há 2h", version: "v2.3" },
  { name: "Resumidor de Áudio v1.7", type: "Áudio", updated: "há 1d", version: "v1.7" },
  { name: "Gerador de Conteúdo v3.1", type: "Texto", updated: "há 2d", version: "v3.1" },
  { name: "Análise de Dados v1.2", type: "Dados", updated: "há 3d", version: "v1.2" },
];

const SKILLS: SkillItem[] = [
  { name: "Transcrição", pct: 32 },
  { name: "Atendimento IA", pct: 24 },
  { name: "Resumo de Áudio", pct: 18 },
  { name: "Geração de Conteúdo", pct: 14 },
  { name: "Análise de Dados", pct: 12 },
];

const LOGS: LogItem[] = [
  { msg: "Skill de transcrição executada", time: "18:43:21", status: "ok" },
  { msg: "Fallback de modelo ativado", time: "18:42:07", status: "warn" },
  { msg: "Nova chave de API salva", time: "18:40:55", status: "ok" },
  { msg: "Prompt Atendimento IA v2.3 atualizado", time: "18:39:18", status: "ok" },
  { msg: "Conexão com Supabase estabelecida", time: "18:37:33", status: "ok" },
  { msg: "Uso de API acima do limite 80%", time: "18:35:09", status: "warn" },
  { msg: "Skill de resumo executada", time: "18:33:44", status: "ok" },
  { msg: "Erro de timeout em OpenRouter", time: "18:31:22", status: "err" },
];

const PERF_DATA: PerfItem[] = [
  { model: "Gemini 2.5", latency: 1200, precision: 96 },
  { model: "Ollama Local", latency: 850, precision: 93 },
  { model: "OpenRouter", latency: 1500, precision: 91 },
];

const SYSTEM_METRICS = [
  { label: "CPU", value: "23%", color: "#4ade80" },
  { label: "Memória", value: "41%", color: "#22d3ee" },
  { label: "Requests/min", value: "124", color: "#ff4fa3" },
  { label: "Fila de Execução", value: "7", color: "#fbbf24" },
  { label: "Uptime", value: "99.9%", color: "#4ade80" },
  { label: "Latência Média", value: "1.4s", color: "#ff3b5f" },
];

function seededRandom(seed: number) {
  let value = seed;
  return () => {
    value = (value * 9301 + 49297) % 233280;
    return value / 233280;
  };
}

function Sparkline({ color = "#ff4fa3" }: { color?: string }) {
  const pts = "0,11 8,7 16,12 24,5 32,9 40,4 48,8 56,3 64,7 72,2";

  return (
    <svg width="72" height="16" viewBox="0 0 72 16" aria-hidden="true">
      <polyline
        points={pts}
        fill="none"
        stroke={color}
        strokeWidth="1.5"
        strokeLinecap="round"
        strokeLinejoin="round"
        opacity="0.9"
      />
    </svg>
  );
}

const AUDIO_BARS = [
  8, 18, 10, 24, 14, 27, 12, 21, 9, 25, 15, 28, 11, 19,
  8, 23, 17, 29, 13, 26, 10, 20, 15, 24, 9, 18, 12, 27,
];

function AudioWave({ color1 = "#ff3b5f", color2 = "#ff4fa3" }: { color1?: string; color2?: string }) {
  return (
    <div className="audio-wave">
      {AUDIO_BARS.map((height, index) => (
        <span
          key={index}
          style={{
            height,
            background: `linear-gradient(to top, ${color1}, ${color2})`,
            animationDelay: `${index * 0.05}s`,
          }}
        />
      ))}
    </div>
  );
}

function HolographicBrain() {
  const canvasRef = useRef<HTMLCanvasElement | null>(null);
  const animationRef = useRef<number | null>(null);

  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;

    const ctx = canvas.getContext("2d", { alpha: true }) as CanvasRenderingContext2D;

    const width = 720;
    const height = 430;
    const dpr = Math.min(window.devicePixelRatio || 1, 2);

    canvas.width = width * dpr;
    canvas.height = height * dpr;
    canvas.style.width = "100%";
    canvas.style.height = "100%";
    ctx.setTransform(dpr, 0, 0, dpr, 0, 0);

    type BrainNode = {
      x: number; y: number; z: number; r: number; phase: number;
    };

    let seed = 987654321;
    const rand = () => {
      seed = (seed * 9301 + 49297) % 233280;
      return seed / 233280;
    };

    const nodes: BrainNode[] = [];

    // Nós mais orgânicos e densos (próximo do estilo da imagem)
    for (let i = 0; i < 320; i++) {
      const a = rand() * Math.PI * 2;
      const b = Math.pow(rand(), 0.55);

      let x = Math.cos(a) * 128 * b * (0.88 + rand() * 0.35);
      let y = Math.sin(a) * 96 * b * (0.92 + rand() * 0.28) - 20;
      let z = (rand() * 2 - 1) * 82 * (0.65 + rand() * 0.6);

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
      t += 0.007; // rotação bem lenta e suave

      ctx.clearRect(0, 0, width, height);

      const cx = width / 2;
      const cy = height / 2 - 10;
      const rot = t * 0.25; // giro lento

      const cos = Math.cos(rot);
      const sin = Math.sin(rot);

      // Aura forte estilo neon da imagem
      const aura = ctx.createRadialGradient(cx, cy, 30, cx, cy, 270);
      aura.addColorStop(0, "rgba(255, 65, 150, 0.28)");
      aura.addColorStop(0.45, "rgba(190, 40, 230, 0.13)");
      aura.addColorStop(1, "transparent");
      ctx.fillStyle = aura;
      ctx.fillRect(0, 0, width, height);

      const projected = nodes.map(node => {
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

      // Conexões neurais densas
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

      // Neurônios com glow
      projected.sort((a, b) => a.z - b.z).forEach((node, idx) => {
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

      // Scan line sutil
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
      {/* tags e conexões mantidas */}
      <div className="brain-connection left-one" />
      <div className="brain-connection left-two" />
      <div className="brain-connection left-three" />
      <div className="brain-connection left-four" />
      <div className="brain-connection right-one" />
      <div className="brain-connection right-two" />
      <div className="brain-connection right-three" />
      <div className="brain-connection right-four" />

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

function PerformanceChart({ data }: { data: PerfItem[] }) {
  const maxLatency = Math.max(...data.map((item) => item.latency));

  return (
    <div className="perf-chart">
      {data.map((item) => (
        <div key={item.model} className="perf-column">
          <div className="perf-bars">
            <div className="perf-bar-wrap">
              <span>{item.latency}</span>
              <div
                className="perf-bar latency"
                style={{ height: `${(item.latency / maxLatency) * 62}px` }}
              />
            </div>
            <div className="perf-bar-wrap">
              <span>{item.precision}%</span>
              <div
                className="perf-bar precision"
                style={{ height: `${(item.precision / 100) * 62}px` }}
              />
            </div>
          </div>
          <strong>{item.model}</strong>
        </div>
      ))}
    </div>
  );
}

function StatusDot({ status = "ok" }: { status?: "ok" | "warn" | "err" }) {
  return <span className={`status-dot ${status}`} />;
}

export default function MiaBrainPage() {
  const [activeNav, setActiveNav] = useState("visao-geral");
  const [collapsed, setCollapsed] = useState(false);

  const metricCards = useMemo(
    () => [
      { icon: "◈", label: "APIs Ativas", value: "7", sub: "+1 nas últimas 24h", tone: "green" },
      { icon: "⚡", label: "Skills Ligadas", value: "18", sub: "+3 nas últimas 24h", tone: "green" },
      { icon: "◉", label: "Custo Hoje", value: "R$ 12,47", sub: "-8% vs ontem", tone: "red" },
      { icon: "⏱", label: "Tempo Médio", value: "1.4s", sub: "-12% vs ontem", tone: "red" },
    ],
    []
  );

  return (
    <>
      <style>{`
        * {
          box-sizing: border-box;
        }

        :root {
          --bg: #05060b;
          --panel: rgba(12, 13, 22, 0.82);
          --panel-strong: rgba(16, 17, 29, 0.94);
          --line: rgba(255, 59, 95, 0.18);
          --line-strong: rgba(255, 79, 163, 0.34);
          --red: #ff3b5f;
          --pink: #ff4fa3;
          --mag: #d946ef;
          --cyan: #22d3ee;
          --green: #4ade80;
          --yellow: #fbbf24;
          --text: #f5f5fb;
          --muted: #8c8da8;
        }

        html,
        body {
          margin: 0;
          padding: 0;
          background: var(--bg);
        }

        .mia-page {
          min-height: 100vh;
          background:
            radial-gradient(circle at 38% 6%, rgba(255, 79, 163, 0.11), transparent 32%),
            radial-gradient(circle at 92% 32%, rgba(217, 70, 239, 0.08), transparent 28%),
            linear-gradient(135deg, #04050a 0%, #080913 45%, #05060b 100%);
          color: var(--text);
          font-family: Arial, Helvetica, sans-serif;
          display: flex;
          overflow: hidden;
        }

        .mono {
          font-family: "SFMono-Regular", Consolas, "Liberation Mono", monospace;
        }

        .sidebar {
          width: 248px;
          min-width: 248px;
          height: 100vh;
          background: rgba(5, 7, 15, 0.96);
          border-right: 1px solid var(--line);
          display: flex;
          flex-direction: column;
          transition: all 0.25s ease;
          overflow: hidden;
        }

        .sidebar.collapsed {
          width: 74px;
          min-width: 74px;
        }

        .sidebar-head {
          padding: 18px 16px 14px;
          border-bottom: 1px solid var(--line);
          display: flex;
          align-items: center;
          gap: 12px;
        }

        .logo-mark {
          width: 42px;
          height: 42px;
          border-radius: 14px;
          background: linear-gradient(135deg, rgba(255, 59, 95, 0.24), rgba(217, 70, 239, 0.16));
          border: 1px solid rgba(255, 79, 163, 0.4);
          display: grid;
          place-items: center;
          box-shadow: 0 0 22px rgba(255, 59, 95, 0.2);
          flex: 0 0 auto;
        }

        .sidebar-title {
          min-width: 0;
          flex: 1;
          opacity: 1;
          transition: all 0.2s ease;
        }

        .sidebar.collapsed .sidebar-title {
          opacity: 0;
          width: 0;
          overflow: hidden;
        }

        .sidebar-title h2 {
          font-size: 17px;
          margin: 0;
          line-height: 1.1;
        }

        .sidebar-title p {
          margin: 4px 0 0;
          color: var(--muted);
          font-size: 11px;
        }

        .collapse-btn {
          width: 26px;
          height: 26px;
          border: 1px solid rgba(255, 79, 163, 0.25);
          background: rgba(255, 59, 95, 0.08);
          color: var(--pink);
          border-radius: 8px;
          cursor: pointer;
        }

        .sidebar.collapsed .collapse-btn {
          display: none;
        }

        .nav {
          padding: 12px 10px;
          flex: 1;
          overflow-y: auto;
        }

        .nav button {
          width: 100%;
          border: 1px solid transparent;
          background: transparent;
          color: var(--muted);
          padding: 11px 12px;
          margin-bottom: 6px;
          border-radius: 11px;
          cursor: pointer;
          display: flex;
          align-items: center;
          gap: 12px;
          text-align: left;
          font-size: 14px;
          transition: all 0.18s ease;
          position: relative;
        }

        .sidebar.collapsed .nav button {
          justify-content: center;
          padding: 12px 8px;
        }

        .nav button:hover {
          color: white;
          background: rgba(255, 59, 95, 0.07);
        }

        .nav button.active {
          color: white;
          background: linear-gradient(135deg, rgba(255, 59, 95, 0.25), rgba(255, 79, 163, 0.11));
          border-color: rgba(255, 79, 163, 0.36);
          box-shadow: 0 0 18px rgba(255, 59, 95, 0.15);
        }

        .nav-icon {
          width: 20px;
          text-align: center;
          font-size: 16px;
          flex: 0 0 auto;
        }

        .nav-label {
          white-space: nowrap;
        }

        .sidebar.collapsed .nav-label,
        .sidebar.collapsed .studio-card {
          display: none;
        }

        .studio-card {
          margin: 12px;
          padding: 14px;
          border: 1px solid var(--line);
          background: rgba(255, 255, 255, 0.035);
          border-radius: 16px;
        }

        .studio-card-top {
          display: flex;
          align-items: center;
          gap: 10px;
        }

        .studio-avatar {
          width: 34px;
          height: 34px;
          border-radius: 12px;
          background: linear-gradient(135deg, var(--red), var(--mag));
          display: grid;
          place-items: center;
          font-weight: 800;
        }

        .pro-badge {
          margin-left: auto;
          border: 1px solid rgba(255, 79, 163, 0.4);
          color: var(--pink);
          border-radius: 7px;
          font-size: 10px;
          padding: 3px 7px;
        }

        .main {
          height: 100vh;
          flex: 1;
          min-width: 0;
          display: flex;
          flex-direction: column;
        }

        .header {
          height: 74px;
          min-height: 74px;
          border-bottom: 1px solid var(--line);
          background: rgba(5, 6, 11, 0.78);
          backdrop-filter: blur(16px);
          display: flex;
          align-items: center;
          padding: 0 26px;
          gap: 18px;
        }

        .header-title {
          flex: 1;
        }

        .header h1 {
          margin: 0;
          font-size: 30px;
          letter-spacing: -0.04em;
        }

        .header h1 span {
          background: linear-gradient(135deg, var(--red), var(--pink));
          -webkit-background-clip: text;
          color: transparent;
        }

        .header p {
          margin: 4px 0 0;
          font-size: 13px;
          color: var(--muted);
        }

        .search {
          width: 280px;
          height: 42px;
          border-radius: 13px;
          background: rgba(255, 255, 255, 0.04);
          border: 1px solid var(--line);
          display: flex;
          align-items: center;
          padding: 0 12px;
          gap: 10px;
          color: var(--muted);
          font-size: 13px;
        }

        .search kbd {
          margin-left: auto;
          background: rgba(255, 255, 255, 0.08);
          border-radius: 6px;
          padding: 4px 7px;
          color: var(--muted);
          font-size: 11px;
        }

        .header-icon {
          width: 42px;
          height: 42px;
          border-radius: 14px;
          border: 1px solid var(--line);
          background: rgba(255, 255, 255, 0.04);
          display: grid;
          place-items: center;
          position: relative;
        }

        .header-icon::after {
          content: "";
          position: absolute;
          top: 9px;
          right: 9px;
          width: 7px;
          height: 7px;
          border-radius: 50%;
          background: var(--red);
          box-shadow: 0 0 12px var(--red);
        }

        .profile {
          height: 46px;
          border-radius: 15px;
          border: 1px solid var(--line);
          display: flex;
          align-items: center;
          gap: 10px;
          padding: 0 12px;
          background: rgba(255, 255, 255, 0.035);
        }

        .profile-avatar {
          width: 33px;
          height: 33px;
          border-radius: 12px;
          background: linear-gradient(135deg, var(--red), var(--pink), var(--mag));
          display: grid;
          place-items: center;
          font-weight: 800;
        }

        .profile strong {
          display: block;
          font-size: 12px;
        }

        .profile span {
          color: var(--muted);
          font-size: 11px;
        }

        .content {
          flex: 1;
          overflow-y: auto;
          padding: 18px 26px 14px;
        }

        .grid-metrics {
          display: grid;
          grid-template-columns: repeat(4, 1fr);
          gap: 14px;
          margin-bottom: 14px;
        }

        .glass {
          background: var(--panel);
          border: 1px solid var(--line);
          border-radius: 18px;
          box-shadow:
            0 0 0 1px rgba(255, 255, 255, 0.015) inset,
            0 20px 60px rgba(0, 0, 0, 0.25);
          backdrop-filter: blur(16px);
          transition: border-color 0.2s ease, box-shadow 0.2s ease, transform 0.2s ease;
        }

        .glass:hover {
          border-color: rgba(255, 79, 163, 0.34);
          box-shadow:
            0 0 0 1px rgba(255, 79, 163, 0.08) inset,
            0 0 32px rgba(255, 59, 95, 0.09),
            0 20px 60px rgba(0, 0, 0, 0.28);
        }

        .metric-card {
          padding: 18px;
          min-height: 112px;
          display: flex;
          align-items: center;
          gap: 14px;
          position: relative;
          overflow: hidden;
        }

        .metric-card::before {
          content: "";
          position: absolute;
          inset: -80px auto auto -80px;
          width: 180px;
          height: 180px;
          background: radial-gradient(circle, rgba(255, 79, 163, 0.18), transparent 64%);
        }

        .metric-icon {
          width: 52px;
          height: 52px;
          border-radius: 17px;
          background: linear-gradient(135deg, rgba(255, 59, 95, 0.18), rgba(255, 79, 163, 0.1));
          border: 1px solid rgba(255, 79, 163, 0.26);
          display: grid;
          place-items: center;
          font-size: 24px;
          color: var(--pink);
          text-shadow: 0 0 18px rgba(255, 79, 163, 0.8);
        }

        .metric-content {
          position: relative;
        }

        .metric-content span {
          color: var(--muted);
          font-size: 13px;
        }

        .metric-content strong {
          display: block;
          font-size: 26px;
          margin: 5px 0;
        }

        .metric-content small {
          color: var(--green);
          font-size: 12px;
        }

        .metric-content small.red {
          color: var(--red);
        }

        .main-grid {
          display: grid;
          grid-template-columns: 300px minmax(420px, 1fr) 360px;
          gap: 14px;
          margin-bottom: 14px;
        }

        .card {
          padding: 18px;
        }

        .card-head {
          display: flex;
          align-items: center;
          justify-content: space-between;
          margin-bottom: 16px;
        }

        .card-head h3 {
          font-size: 16px;
          margin: 0;
        }

        .card-head button,
        .soft-link {
          border: 0;
          background: transparent;
          color: var(--pink);
          font-size: 12px;
          cursor: pointer;
        }

        .api-row {
          display: flex;
          align-items: center;
          gap: 10px;
          padding: 9px 10px;
          border-radius: 12px;
          background: rgba(255, 255, 255, 0.025);
          border: 1px solid rgba(255, 255, 255, 0.04);
          margin-bottom: 8px;
        }

        .api-row strong {
          flex: 1;
          font-size: 13px;
        }

        .api-row small {
          color: var(--green);
          font-size: 11px;
        }

        .status-dot {
          width: 8px;
          height: 8px;
          border-radius: 50%;
          display: inline-block;
          background: var(--green);
          box-shadow: 0 0 10px var(--green);
          animation: pulseDot 1.9s ease-in-out infinite;
        }

        .status-dot.warn {
          background: var(--yellow);
          box-shadow: 0 0 10px var(--yellow);
        }

        .status-dot.err {
          background: var(--red);
          box-shadow: 0 0 10px var(--red);
        }

        .brain-panel {
          position: relative;
          overflow: hidden;
          min-height: 430px;
          background:
            linear-gradient(rgba(255, 59, 95, 0.035) 1px, transparent 1px),
            linear-gradient(90deg, rgba(255, 59, 95, 0.035) 1px, transparent 1px),
            rgba(12, 13, 22, 0.68);
          background-size: 34px 34px;
        }

        .brain-stage {
          width: 100%;
          height: 430px;
          position: relative;
        }

        .brain-canvas {
          position: absolute;
          inset: 0;
          width: 100%;
          height: 100%;
          z-index: 2;
          filter: drop-shadow(0 0 26px rgba(255, 59, 95, 0.3));
        }

        .brain-stage::before {
          content: "";
          position: absolute;
          left: 50%;
          top: 50%;
          transform: translate(-50%, -50%);
          width: 360px;
          height: 360px;
          border-radius: 50%;
          background: radial-gradient(circle, rgba(255, 79, 163, 0.16), rgba(255, 59, 95, 0.06) 43%, transparent 70%);
          filter: blur(18px);
          animation: brainAura 4s ease-in-out infinite;
        }

        .brain-tag {
          position: absolute;
          z-index: 4;
          padding: 8px 12px;
          border-radius: 10px;
          background: rgba(7, 8, 16, 0.78);
          border: 1px solid rgba(255, 79, 163, 0.24);
          color: rgba(255, 230, 238, 0.92);
          font-size: 12px;
          white-space: nowrap;
          backdrop-filter: blur(10px);
          box-shadow: 0 0 18px rgba(255, 59, 95, 0.08);
        }

        .tag-1 { top: 56px; left: 32px; }
        .tag-2 { top: 140px; left: 22px; }
        .tag-3 { top: 225px; left: 36px; }
        .tag-4 { top: 312px; left: 58px; }
        .tag-5 { top: 56px; right: 36px; }
        .tag-6 { top: 140px; right: 56px; }
        .tag-7 { top: 225px; right: 74px; }
        .tag-8 { top: 312px; right: 44px; }

        .brain-connection {
          position: absolute;
          z-index: 3;
          height: 1px;
          background: linear-gradient(90deg, transparent, rgba(255, 79, 163, 0.75), transparent);
          transform-origin: center;
          opacity: 0.65;
        }

        .left-one { width: 140px; top: 74px; left: 150px; transform: rotate(20deg); }
        .left-two { width: 150px; top: 158px; left: 134px; transform: rotate(7deg); }
        .left-three { width: 146px; top: 243px; left: 144px; transform: rotate(-9deg); }
        .left-four { width: 132px; top: 330px; left: 166px; transform: rotate(-22deg); }
        .right-one { width: 145px; top: 74px; right: 158px; transform: rotate(-20deg); }
        .right-two { width: 132px; top: 158px; right: 155px; transform: rotate(-7deg); }
        .right-three { width: 132px; top: 243px; right: 160px; transform: rotate(7deg); }
        .right-four { width: 146px; top: 330px; right: 152px; transform: rotate(18deg); }

        .ranking-row {
          display: grid;
          grid-template-columns: 22px 24px 1fr 82px 44px;
          align-items: center;
          gap: 8px;
          padding: 9px 0;
          border-bottom: 1px solid rgba(255, 255, 255, 0.05);
        }

        .ranking-row:last-child {
          border-bottom: 0;
        }

        .ranking-row strong {
          font-size: 13px;
        }

        .ranking-score {
          border: 1px solid rgba(255, 79, 163, 0.32);
          border-radius: 8px;
          text-align: center;
          color: var(--pink);
          font-size: 12px;
          padding: 4px 0;
          background: rgba(255, 59, 95, 0.06);
        }

        .lower-grid {
          display: grid;
          grid-template-columns: 1fr 1fr 1fr 1.08fr;
          gap: 14px;
          margin-bottom: 14px;
        }

        .perf-chart {
          display: flex;
          align-items: flex-end;
          gap: 16px;
          min-height: 126px;
        }

        .perf-column {
          flex: 1;
          display: flex;
          align-items: center;
          flex-direction: column;
          gap: 8px;
        }

        .perf-column strong {
          font-size: 11px;
          color: var(--muted);
          text-align: center;
        }

        .perf-bars {
          display: flex;
          align-items: flex-end;
          gap: 6px;
          height: 86px;
        }

        .perf-bar-wrap {
          display: flex;
          align-items: center;
          flex-direction: column;
          gap: 3px;
        }

        .perf-bar-wrap span {
          font-size: 9px;
          color: var(--muted);
        }

        .perf-bar {
          width: 18px;
          border-radius: 5px 5px 0 0;
        }

        .perf-bar.latency {
          background: linear-gradient(to top, var(--red), #ff1a40);
          box-shadow: 0 0 12px rgba(255, 59, 95, 0.35);
        }

        .perf-bar.precision {
          background: linear-gradient(to top, var(--mag), #a855f7);
          box-shadow: 0 0 12px rgba(217, 70, 239, 0.35);
        }

        .legend {
          display: flex;
          gap: 12px;
          font-size: 11px;
          color: var(--muted);
          margin-bottom: 10px;
        }

        .prompt-tabs {
          display: flex;
          gap: 6px;
          margin-bottom: 12px;
        }

        .prompt-tabs span {
          padding: 5px 9px;
          border-radius: 9px;
          background: rgba(255, 255, 255, 0.04);
          border: 1px solid rgba(255, 255, 255, 0.05);
          font-size: 11px;
          color: var(--muted);
        }

        .prompt-tabs span.active {
          color: var(--pink);
          background: rgba(255, 59, 95, 0.13);
          border-color: rgba(255, 79, 163, 0.32);
        }

        .neon-btn {
          border: 1px solid rgba(255, 79, 163, 0.34);
          background: linear-gradient(135deg, rgba(255, 59, 95, 0.18), rgba(217, 70, 239, 0.12));
          color: var(--pink);
          border-radius: 10px;
          padding: 7px 12px;
          font-weight: 700;
          font-size: 12px;
          cursor: pointer;
        }

        .prompt-row {
          display: flex;
          align-items: center;
          gap: 10px;
          padding: 10px;
          border-radius: 12px;
          background: rgba(255, 255, 255, 0.025);
          border: 1px solid rgba(255, 255, 255, 0.05);
          margin-bottom: 8px;
        }

        .prompt-row.active {
          border-color: rgba(255, 79, 163, 0.3);
          background: rgba(255, 59, 95, 0.06);
        }

        .prompt-row div {
          flex: 1;
        }

        .prompt-row strong {
          display: block;
          font-size: 12px;
        }

        .prompt-row small {
          color: var(--muted);
          font-size: 11px;
        }

        .prompt-badge {
          font-size: 9px;
          color: var(--red);
          border: 1px solid rgba(255, 59, 95, 0.3);
          padding: 2px 5px;
          border-radius: 7px;
          margin-left: 5px;
        }

        .voice-box {
          padding: 13px;
          border-radius: 14px;
          background: rgba(255, 255, 255, 0.025);
          border: 1px solid rgba(255, 79, 163, 0.12);
          margin-bottom: 12px;
        }

        .voice-head {
          display: flex;
          justify-content: space-between;
          align-items: center;
          margin-bottom: 10px;
        }

        .voice-head strong {
          font-size: 13px;
        }

        .voice-head small {
          color: var(--green);
          font-size: 11px;
          display: flex;
          align-items: center;
          gap: 6px;
        }

        .audio-wave {
          display: flex;
          align-items: center;
          gap: 3px;
          height: 34px;
        }

        .audio-wave span {
          width: 4px;
          border-radius: 999px;
          opacity: 0.86;
          animation: wavePulse 1.25s ease-in-out infinite;
        }

        .voice-tags {
          display: flex;
          gap: 6px;
          margin-top: 10px;
        }

        .voice-tags span {
          font-size: 10px;
          color: var(--muted);
          background: rgba(255, 255, 255, 0.06);
          border-radius: 8px;
          padding: 4px 7px;
        }

        .logs-list {
          display: flex;
          flex-direction: column;
          gap: 8px;
        }

        .log-row {
          display: grid;
          grid-template-columns: 12px 1fr 58px;
          gap: 9px;
          align-items: center;
          padding: 7px 0;
          border-bottom: 1px solid rgba(255, 255, 255, 0.045);
        }

        .log-row:last-child {
          border-bottom: 0;
        }

        .log-row strong {
          font-size: 11px;
          font-weight: 500;
          overflow: hidden;
          white-space: nowrap;
          text-overflow: ellipsis;
        }

        .log-row small {
          color: var(--muted);
          font-size: 10px;
        }

        .bottom-grid {
          display: grid;
          grid-template-columns: 380px 1fr;
          gap: 14px;
        }

        .skill-row {
          margin-bottom: 12px;
        }

        .skill-head {
          display: flex;
          justify-content: space-between;
          font-size: 12px;
          margin-bottom: 6px;
        }

        .progress-track {
          height: 7px;
          border-radius: 99px;
          background: rgba(255, 255, 255, 0.06);
          overflow: hidden;
        }

        .progress-fill {
          height: 100%;
          border-radius: 99px;
          background: linear-gradient(90deg, var(--red), var(--pink));
          box-shadow: 0 0 14px rgba(255, 59, 95, 0.45);
        }

        .system-grid {
          display: grid;
          grid-template-columns: repeat(6, 1fr);
          gap: 12px;
        }

        .system-box {
          text-align: center;
          padding: 14px 10px;
          border-radius: 14px;
          background: rgba(255, 255, 255, 0.025);
          border: 1px solid rgba(255, 255, 255, 0.05);
        }

        .system-box strong {
          display: block;
          font-size: 22px;
          margin-bottom: 5px;
        }

        .system-box span {
          color: var(--muted);
          font-size: 11px;
        }

        .footer {
          height: 44px;
          min-height: 44px;
          border-top: 1px solid var(--line);
          background: rgba(4, 5, 10, 0.98);
          display: flex;
          align-items: center;
          gap: 24px;
          padding: 0 26px;
          font-size: 11px;
          color: var(--muted);
        }

        .footer strong {
          color: white;
        }

        .footer .right {
          margin-left: auto;
        }

        .scrollbar::-webkit-scrollbar {
          width: 6px;
          height: 6px;
        }

        .scrollbar::-webkit-scrollbar-track {
          background: transparent;
        }

        .scrollbar::-webkit-scrollbar-thumb {
          background: rgba(255, 79, 163, 0.25);
          border-radius: 999px;
        }

        @keyframes pulseDot {
          0%, 100% { opacity: 1; transform: scale(1); }
          50% { opacity: 0.45; transform: scale(0.82); }
        }

        @keyframes wavePulse {
          0%, 100% { transform: scaleY(0.75); }
          50% { transform: scaleY(1.35); }
        }

        @keyframes brainAura {
          0%, 100% { opacity: 0.7; transform: translate(-50%, -50%) scale(1); }
          50% { opacity: 1; transform: translate(-50%, -50%) scale(1.08); }
        }

        @media (max-width: 1280px) {
          .main-grid {
            grid-template-columns: 1fr;
          }

          .lower-grid {
            grid-template-columns: repeat(2, 1fr);
          }

          .grid-metrics {
            grid-template-columns: repeat(2, 1fr);
          }

          .brain-panel {
            min-height: 430px;
          }
        }

        @media (max-width: 900px) {
          .sidebar {
            display: none;
          }

          .header {
            padding: 0 16px;
          }

          .search,
          .profile {
            display: none;
          }

          .content {
            padding: 14px;
          }

          .grid-metrics,
          .lower-grid,
          .bottom-grid,
          .system-grid {
            grid-template-columns: 1fr;
          }

          .brain-tag,
          .brain-connection {
            display: none;
          }
        }
      `}</style>

      <div className="mia-page">
        <aside className={`sidebar ${collapsed ? "collapsed" : ""}`}>
          <div className="sidebar-head">
            <button className="logo-mark" type="button" onClick={() => setCollapsed(false)}>
              🧠
            </button>

            <div className="sidebar-title">
              <h2>Mia Brain</h2>
              <p>Estúdio / Studio Sualuma</p>
            </div>

            <button className="collapse-btn" type="button" onClick={() => setCollapsed(true)}>
              ‹
            </button>
          </div>

          <nav className="nav scrollbar">
            {NAV_ITEMS.map((item) => (
              <button
                key={item.id}
                type="button"
                className={activeNav === item.id ? "active" : ""}
                onClick={() => setActiveNav(item.id)}
                title={item.label}
              >
                <span className="nav-icon">{item.icon}</span>
                <span className="nav-label">{item.label}</span>
              </button>
            ))}
          </nav>

          <div className="studio-card">
            <div className="studio-card-top">
              <div className="studio-avatar">S</div>
              <div>
                <strong>Studio Sualuma</strong>
                <p style={{ margin: "2px 0 0", color: "var(--muted)", fontSize: 11 }}>Ambiente</p>
              </div>
              <span className="pro-badge">PRO</span>
            </div>

            <div style={{ display: "flex", alignItems: "center", gap: 8, marginTop: 12 }}>
              <StatusDot />
              <span style={{ color: "var(--green)", fontSize: 12 }}>Produção</span>
            </div>
          </div>
        </aside>

        <section className="main">
          <header className="header">
            <div className="header-title">
              <h1>
                <span>Mia</span> Brain
              </h1>
              <p>Centro de inteligência e orquestração</p>
            </div>

            <div className="search">
              <span>🔍</span>
              <span>Buscar...</span>
              <kbd>Ctrl K</kbd>
            </div>

            <div className="header-icon">🔔</div>

            <div className="profile">
              <div className="profile-avatar">S</div>
              <div>
                <strong>Studio Sualuma</strong>
                <span>Administrador</span>
              </div>
              <span>⌄</span>
            </div>
          </header>

          <main className="content scrollbar">
            <div className="grid-metrics">
              {metricCards.map((card) => (
                <div key={card.label} className="glass metric-card">
                  <div className="metric-icon">{card.icon}</div>
                  <div className="metric-content">
                    <span>{card.label}</span>
                    <strong>{card.value}</strong>
                    <small className={card.tone === "red" ? "red" : ""}>{card.sub}</small>
                  </div>
                </div>
              ))}
            </div>

            <div className="main-grid">
              <div className="glass card">
                <div className="card-head">
                  <h3>APIs Conectadas</h3>
                  <button type="button">Ver todas</button>
                </div>

                {APIS.map((api) => (
                  <div className="api-row" key={api.name}>
                    <span style={{ color: api.color }}>{api.icon}</span>
                    <strong>{api.name}</strong>
                    <StatusDot />
                    <small>{api.status}</small>
                  </div>
                ))}
              </div>

              <div className="glass brain-panel">
                <HolographicBrain />
              </div>

              <div className="glass card">
                <div className="card-head">
                  <h3>Melhor desempenho</h3>
                  <span style={{ color: "var(--pink)" }}>⌁</span>
                </div>

                {RANKINGS.map((item, index) => (
                  <div className="ranking-row" key={item.name}>
                    <span style={{ color: "var(--muted)", fontSize: 12 }}>{index + 1}</span>
                    <span style={{ color: item.color, fontSize: 18 }}>{item.icon}</span>
                    <strong>{item.name}</strong>
                    <Sparkline color={item.color} />
                    <span className="ranking-score mono">{item.score}</span>
                  </div>
                ))}

                <div style={{ marginTop: 16, textAlign: "center" }}>
                  <button className="soft-link" type="button">Ver ranking completo →</button>
                </div>
              </div>
            </div>

            <div className="lower-grid">
              <div className="glass card">
                <div className="card-head">
                  <h3>Performance dos Modelos</h3>
                  <button type="button">Últimas 24h⌄</button>
                </div>

                <div className="legend">
                  <span style={{ color: "var(--red)" }}>■ Latência</span>
                  <span style={{ color: "var(--mag)" }}>■ Precisão</span>
                </div>

                <PerformanceChart data={PERF_DATA} />
              </div>

              <div className="glass card">
                <div className="card-head">
                  <h3>⌥ Prompt Studio</h3>
                  <button className="neon-btn" type="button">Novo Prompt</button>
                </div>

                <div className="prompt-tabs">
                  <span className="active">Meus Prompts</span>
                  <span>Biblioteca</span>
                  <span>Templates</span>
                </div>

                {PROMPTS.map((prompt, index) => (
                  <div className={`prompt-row ${index === 0 ? "active" : ""}`} key={prompt.name}>
                    <span>⌥</span>
                    <div>
                      <strong>
                        {prompt.name}
                        {prompt.tag ? <span className="prompt-badge">{prompt.tag}</span> : null}
                      </strong>
                      <small>{prompt.type} • Atualizado {prompt.updated}</small>
                    </div>
                    <small className="mono">{prompt.version}</small>
                  </div>
                ))}

                <div style={{ marginTop: 14, textAlign: "center" }}>
                  <button className="soft-link" type="button">Ver todos os prompts →</button>
                </div>
              </div>

              <div className="glass card">
                <div className="card-head">
                  <h3>◎ Transcrição & Voz</h3>
                </div>

                <div className="voice-box">
                  <div className="voice-head">
                    <strong>Whisper Local</strong>
                    <small><StatusDot /> Ativo</small>
                  </div>
                  <AudioWave />
                  <div className="voice-tags">
                    <span>large-v3</span>
                    <span>PT-BR</span>
                  </div>
                </div>

                <div className="voice-box">
                  <div className="voice-head">
                    <strong>Piper / Edge TTS</strong>
                    <small><StatusDot /> Ativo</small>
                  </div>
                  <AudioWave color1="#d946ef" color2="#ff4fa3" />
                  <div className="voice-tags">
                    <span>pt-BR</span>
                    <span>Feminina</span>
                  </div>
                </div>

                <div style={{ textAlign: "center" }}>
                  <button className="soft-link" type="button">Gerenciar vozes →</button>
                </div>
              </div>

              <div className="glass card">
                <div className="card-head">
                  <h3>≡ Logs Recentes</h3>
                  <button type="button">Ver todos</button>
                </div>

                <div className="logs-list">
                  {LOGS.map((log) => (
                    <div className="log-row" key={`${log.msg}-${log.time}`}>
                      <StatusDot status={log.status} />
                      <strong>{log.msg}</strong>
                      <small className="mono">{log.time}</small>
                    </div>
                  ))}
                </div>

                <div style={{ marginTop: 14, textAlign: "center" }}>
                  <button className="soft-link" type="button">Ver histórico completo →</button>
                </div>
              </div>
            </div>

            <div className="bottom-grid">
              <div className="glass card">
                <div className="card-head">
                  <h3>▲ Uso por Skill</h3>
                  <button type="button">24h⌄</button>
                </div>

                {SKILLS.map((skill) => (
                  <div className="skill-row" key={skill.name}>
                    <div className="skill-head">
                      <span>{skill.name}</span>
                      <span className="mono" style={{ color: "var(--pink)" }}>{skill.pct}%</span>
                    </div>
                    <div className="progress-track">
                      <div className="progress-fill" style={{ width: `${skill.pct}%` }} />
                    </div>
                  </div>
                ))}
              </div>

              <div className="glass card">
                <div className="card-head">
                  <h3>◈ Visão do Sistema</h3>
                </div>

                <div className="system-grid">
                  {SYSTEM_METRICS.map((metric) => (
                    <div className="system-box" key={metric.label}>
                      <strong className="mono" style={{ color: metric.color }}>{metric.value}</strong>
                      <span>{metric.label}</span>
                    </div>
                  ))}
                </div>
              </div>
            </div>
          </main>

          <footer className="footer">
            <span style={{ display: "flex", alignItems: "center", gap: 8 }}>
              <StatusDot /> Sistema Operacional: <strong>Online</strong>
            </span>
            <span>CPU: <strong>23%</strong></span>
            <span>Memória: <strong>41%</strong></span>
            <span>Fila: <strong>7</strong></span>
            <span>Requests/min: <strong>124</strong></span>
            <span style={{ display: "flex", alignItems: "center", gap: 8 }}>
              <StatusDot /> Todos operacionais
            </span>
            <span className="right">Estúdio / Studio Sualuma © 2026</span>
          </footer>
        </section>
      </div>
    </>
  );
}
