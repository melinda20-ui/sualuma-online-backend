"use client";

import { useEffect, useMemo, useRef, useState } from "react";

type AgentStatus = "online" | "busy" | "offline";

type AdminAgent = {
  id: string;
  name: string;
  role: string;
  initials: string;
  color: string;
  bg: string;
  status: AgentStatus;
  unread: number;
  skills: string[];
  systemPrompt: string;
  behaviorRules: string[];
  isAdminAgent: boolean;
  installed: boolean;
  source: "core" | "installed" | "manual";
  route?: string;
};

type Message = {
  from: "user" | "agent";
  text: string;
  time: string;
  provider?: string;
};

function now() {
  const d = new Date();
  return `${String(d.getHours()).padStart(2, "0")}:${String(d.getMinutes()).padStart(2, "0")}`;
}

function escapeHtml(text: string) {
  return text
    .replaceAll("&", "&amp;")
    .replaceAll("<", "&lt;")
    .replaceAll(">", "&gt;");
}

export default function AgentesAdmsClient() {
  const [agents, setAgents] = useState<AdminAgent[]>([]);
  const [activeAgentId, setActiveAgentId] = useState<string | null>(null);
  const [search, setSearch] = useState("");
  const [sidebarOpen, setSidebarOpen] = useState(true);
  const [skillsOpen, setSkillsOpen] = useState(false);
  const [skillInput, setSkillInput] = useState("");
  const [input, setInput] = useState("");
  const [brainDraft, setBrainDraft] = useState("");
  const [rulesDraft, setRulesDraft] = useState("");
  const [loading, setLoading] = useState(false);
  const [savingBrain, setSavingBrain] = useState(false);
  const [conversations, setConversations] = useState<Record<string, Message[]>>({});
  const textareaRef = useRef<HTMLTextAreaElement | null>(null);

  const activeAgent = useMemo(
    () => agents.find((agent) => agent.id === activeAgentId) || null,
    [agents, activeAgentId]
  );

  useEffect(() => {
    async function loadAgents() {
      const response = await fetch("/api/estudio/agentesadms/agents", {
        cache: "no-store",
      });

      const data = await response.json();

      if (Array.isArray(data.agents)) {
        setAgents(data.agents);

        if (!activeAgentId && data.agents.length > 0) {
          setActiveAgentId(data.agents[0].id);
        }
      }
    }

    void loadAgents();
  }, []);

  useEffect(() => {
    const saved = localStorage.getItem("sualuma-agentesadms-conversations-v2");

    if (saved) {
      try {
        setConversations(JSON.parse(saved));
      } catch {}
    }
  }, []);

  useEffect(() => {
    localStorage.setItem("sualuma-agentesadms-conversations-v2", JSON.stringify(conversations));
  }, [conversations]);

  useEffect(() => {
    if (!activeAgent) return;

    setBrainDraft(activeAgent.systemPrompt || "");
    setRulesDraft((activeAgent.behaviorRules || []).join("\n"));
  }, [activeAgent?.id]);

  const filteredAgents = useMemo(() => {
    const term = search.toLowerCase().trim();

    return agents.filter((agent) => {
      if (!agent.isAdminAgent || !agent.installed) return false;
      if (!term) return true;

      return (
        agent.name.toLowerCase().includes(term) ||
        agent.role.toLowerCase().includes(term) ||
        agent.skills.join(" ").toLowerCase().includes(term)
      );
    });
  }, [agents, search]);

  const onlineAgents = filteredAgents.filter((agent) => agent.status !== "offline");
  const offlineAgents = filteredAgents.filter((agent) => agent.status === "offline");

  const activeMessages = activeAgent ? conversations[activeAgent.id] || [] : [];

  async function patchAgent(id: string, patch: Partial<AdminAgent>) {
    const response = await fetch("/api/estudio/agentesadms/agents", {
      method: "PATCH",
      headers: {
        "Content-Type": "application/json",
      },
      body: JSON.stringify({
        id,
        ...patch,
      }),
    });

    const data = await response.json();

    if (!response.ok) {
      throw new Error(data.error || "Erro ao salvar agente.");
    }

    const updated = data.agent as AdminAgent;

    setAgents((current) => current.map((agent) => (agent.id === id ? updated : agent)));

    return updated;
  }

  function openChat(agent: AdminAgent) {
    setActiveAgentId(agent.id);
    setAgents((current) =>
      current.map((item) => (item.id === agent.id ? { ...item, unread: 0 } : item))
    );

    setTimeout(() => {
      textareaRef.current?.focus();
    }, 50);
  }

  async function addSkill() {
    if (!activeAgent) return;

    const value = skillInput.trim();

    if (!value) return;

    const nextSkills = [...(activeAgent.skills || []), value];

    setSkillInput("");
    setAgents((current) =>
      current.map((agent) => (agent.id === activeAgent.id ? { ...agent, skills: nextSkills } : agent))
    );

    await patchAgent(activeAgent.id, {
      skills: nextSkills,
    });
  }

  async function removeSkill(index: number) {
    if (!activeAgent) return;

    const nextSkills = (activeAgent.skills || []).filter((_, i) => i !== index);

    setAgents((current) =>
      current.map((agent) => (agent.id === activeAgent.id ? { ...agent, skills: nextSkills } : agent))
    );

    await patchAgent(activeAgent.id, {
      skills: nextSkills,
    });
  }

  async function saveBrain() {
    if (!activeAgent) return;

    setSavingBrain(true);

    try {
      const rules = rulesDraft
        .split("\n")
        .map((rule) => rule.trim())
        .filter(Boolean);

      await patchAgent(activeAgent.id, {
        systemPrompt: brainDraft.trim(),
        behaviorRules: rules,
      });
    } finally {
      setSavingBrain(false);
    }
  }

  function clearChat() {
    if (!activeAgent) return;

    setConversations((current) => ({
      ...current,
      [activeAgent.id]: [],
    }));
  }

  async function sendMessage() {
    if (!activeAgent || loading) return;

    const text = input.trim();

    if (!text) return;

    const userMessage: Message = {
      from: "user",
      text,
      time: now(),
    };

    const nextHistory = [...activeMessages, userMessage];

    setInput("");
    setLoading(true);

    setConversations((current) => ({
      ...current,
      [activeAgent.id]: nextHistory,
    }));

    try {
      const response = await fetch("/api/estudio/agentesadms/chat", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          agentId: activeAgent.id,
          messages: nextHistory.map((message) => ({
            role: message.from === "user" ? "user" : "assistant",
            content: message.text,
          })),
        }),
      });

      const data = await response.json();

      const reply = typeof data.reply === "string" && data.reply.trim()
        ? data.reply.trim()
        : "Não consegui gerar uma resposta agora.";

      const agentMessage: Message = {
        from: "agent",
        text: reply,
        time: now(),
        provider: typeof data.provider === "string" ? data.provider : undefined,
      };

      setConversations((current) => ({
        ...current,
        [activeAgent.id]: [...(current[activeAgent.id] || []), agentMessage],
      }));
    } catch {
      const errorMessage: Message = {
        from: "agent",
        text: "⚠️ Não consegui falar com o cérebro do Studio agora. Verifique se a API interna está rodando.",
        time: now(),
      };

      setConversations((current) => ({
        ...current,
        [activeAgent.id]: [...(current[activeAgent.id] || []), errorMessage],
      }));
    } finally {
      setLoading(false);
      setTimeout(() => {
        textareaRef.current?.focus();
      }, 50);
    }
  }

  function handleKeyDown(event: React.KeyboardEvent<HTMLTextAreaElement>) {
    if (event.key === "Enter" && !event.shiftKey) {
      event.preventDefault();
      void sendMessage();
    }
  }

  function statusLabel(status: AgentStatus) {
    if (status === "online") return "Online agora";
    if (status === "busy") return "Ocupado";
    return "Offline";
  }

  function renderAgent(agent: AdminAgent) {
    return (
      <button
        key={agent.id}
        className={`agent-item ${activeAgent?.id === agent.id ? "active" : ""}`}
        onClick={() => openChat(agent)}
        type="button"
      >
        <div className={`agent-avatar ${agent.status}`} style={{ background: agent.bg, color: agent.color }}>
          {agent.initials}
        </div>

        <div className="agent-info">
          <div className="agent-name">{agent.name}</div>
          <div className="agent-role">{agent.role}</div>
          <div className="agent-source">{agent.source === "core" ? "core" : agent.source === "installed" ? "instalado" : "manual"}</div>
        </div>

        {agent.unread > 0 && <div className="agent-unread">{agent.unread}</div>}
      </button>
    );
  }

  return (
    <main className="adms-page">
      <div className="topbar">
        <div className="topbar-left">
          <button
            className="toggle-btn"
            onClick={() => setSidebarOpen((value) => !value)}
            title="Recolher / expandir menu"
            type="button"
          >
            ☰
          </button>

          <div className="topbar-logo">
            <div className="logo-dot" />
            Studio Sualuma
          </div>
        </div>

        <div className="topbar-center">Central de Agentes ADMs</div>

        <div className="topbar-right">
          <div className="pill">● {agents.filter((agent) => agent.status !== "offline").length} online</div>
        </div>
      </div>

      <div className="layout">
        <aside className={`sidebar ${sidebarOpen ? "" : "collapsed"}`}>
          <div className="sidebar-header">
            <div className="sidebar-label">Agentes administrativos</div>

            <div className="search-box">
              <span>⌕</span>
              <input
                type="text"
                placeholder="Buscar agente, função ou skill..."
                value={search}
                onChange={(event) => setSearch(event.target.value)}
              />
            </div>
          </div>

          <div className="agents-list">
            {onlineAgents.length > 0 && (
              <>
                <div className="sec-label">● Online / Ativos</div>
                {onlineAgents.map(renderAgent)}
              </>
            )}

            {offlineAgents.length > 0 && (
              <>
                <div className="sec-label">○ Offline</div>
                {offlineAgents.map(renderAgent)}
              </>
            )}
          </div>
        </aside>

        <section className="chat-area">
          {!activeAgent ? (
            <div className="empty">
              <div className="empty-ring">🌸</div>
              <p>Carregando agentes administrativos...</p>
            </div>
          ) : (
            <>
              <div className="chat-header">
                <div className="chat-header-left">
                  <div className="chat-h-avatar" style={{ background: activeAgent.bg, color: activeAgent.color }}>
                    {activeAgent.initials}
                  </div>

                  <div>
                    <div className="chat-h-name">{activeAgent.name}</div>
                    <div className={`chat-h-status ${activeAgent.status === "busy" ? "busy" : ""}`}>
                      {statusLabel(activeAgent.status)} · {activeAgent.role}
                    </div>
                  </div>
                </div>

                <div className="chat-actions">
                  <button
                    className={`ic-btn ${skillsOpen ? "on" : ""}`}
                    onClick={() => setSkillsOpen((value) => !value)}
                    title="Skills e cérebro do agente"
                    type="button"
                  >
                    ★
                  </button>

                  <button className="ic-btn" onClick={clearChat} title="Limpar conversa" type="button">
                    ↺
                  </button>
                </div>
              </div>

              <div className="messages">
                <div className="day-div">Hoje</div>

                {activeMessages.length === 0 && (
                  <div className="agent-intro">
                    <b>{activeAgent.name}</b>
                    <span>{activeAgent.systemPrompt}</span>
                  </div>
                )}

                {activeMessages.map((message, index) => (
                  <div key={`${message.time}-${index}`} className={`msg ${message.from === "user" ? "user" : ""}`}>
                    <div
                      className="m-avatar"
                      style={
                        message.from === "user"
                          ? { background: "rgba(224,64,160,0.16)", color: "#e040a0" }
                          : { background: activeAgent.bg, color: activeAgent.color }
                      }
                    >
                      {message.from === "user" ? "EU" : activeAgent.initials}
                    </div>

                    <div className="m-body">
                      <div className="m-meta">
                        {message.from === "agent" && <span className="m-sender">{activeAgent.name}</span>}
                        <span>{message.time}</span>
                        {message.provider && <span className="provider">via {message.provider}</span>}
                      </div>

                      <div
                        className="m-bubble"
                        dangerouslySetInnerHTML={{
                          __html: escapeHtml(message.text).replaceAll("\n", "<br />"),
                        }}
                      />
                    </div>
                  </div>
                ))}
              </div>

              <div className={`typing-wrap ${loading ? "show" : ""}`}>
                <div className="typing-inner">
                  <div className="m-avatar" style={{ background: activeAgent.bg, color: activeAgent.color }}>
                    {activeAgent.initials}
                  </div>
                  <div className="typing-dots">
                    <span />
                    <span />
                    <span />
                  </div>
                </div>
              </div>

              <div className="input-wrap">
                <div className="input-row">
                  <textarea
                    ref={textareaRef}
                    value={input}
                    placeholder={`Mensagem para ${activeAgent.name}...`}
                    rows={1}
                    onChange={(event) => setInput(event.target.value)}
                    onKeyDown={handleKeyDown}
                  />

                  <button className="send-btn" onClick={() => void sendMessage()} type="button">
                    ➤
                  </button>
                </div>
              </div>
            </>
          )}
        </section>

        <aside className={`skills-panel ${skillsOpen ? "" : "hidden"}`}>
          <div className="skills-header">
            <div className="skills-title">★ Cérebro do agente</div>

            <button className="ic-btn" onClick={() => setSkillsOpen(false)} title="Fechar" type="button">
              ×
            </button>
          </div>

          <div className="skills-agent-name">{activeAgent ? activeAgent.name : "—"}</div>

          <div className="skills-body">
            <div className="panel-block">
              <div className="panel-label">Skills ativas</div>

              {!activeAgent || activeAgent.skills.length === 0 ? (
                <div className="no-skills">Nenhuma skill adicionada ainda.</div>
              ) : (
                activeAgent.skills.map((skill, index) => (
                  <span className="skill-tag" key={`${skill}-${index}`}>
                    {skill}
                    <button className="del-skill" onClick={() => void removeSkill(index)} title="Remover" type="button">
                      ×
                    </button>
                  </span>
                ))
              )}
            </div>

            <div className="panel-block">
              <div className="panel-label">Instrução fixa</div>
              <textarea
                className="brain-textarea"
                value={brainDraft}
                onChange={(event) => setBrainDraft(event.target.value)}
                placeholder="Escreva aqui quem esse agente é, como ele deve pensar e como deve responder..."
              />
            </div>

            <div className="panel-block">
              <div className="panel-label">Regras de comportamento</div>
              <textarea
                className="rules-textarea"
                value={rulesDraft}
                onChange={(event) => setRulesDraft(event.target.value)}
                placeholder={"Uma regra por linha.\nEx: Não transformar conversa simples em relatório."}
              />
            </div>

            <button className="save-brain-btn" onClick={() => void saveBrain()} type="button">
              {savingBrain ? "Salvando..." : "Salvar cérebro"}
            </button>
          </div>

          <div className="add-skill-form">
            <div className="add-skill-label">Adicionar skill</div>

            <div className="add-skill-row">
              <input
                type="text"
                value={skillInput}
                placeholder="Ex: Supabase, CRM, LGPD..."
                maxLength={40}
                onChange={(event) => setSkillInput(event.target.value)}
                onKeyDown={(event) => {
                  if (event.key === "Enter") {
                    event.preventDefault();
                    void addSkill();
                  }
                }}
              />

              <button className="add-skill-btn" onClick={() => void addSkill()} type="button">
                + Add
              </button>
            </div>
          </div>
        </aside>
      </div>

      <div className="status-bar">
        <div className="status-dot" />
        Central ADM conectada · Agentes carregados de data/admin-agents.json
      </div>
    </main>
  );
}
