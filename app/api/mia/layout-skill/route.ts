import { NextRequest, NextResponse } from "next/server";
import path from "node:path";
import crypto from "node:crypto";
import { existsSync } from "node:fs";
import fs from "node:fs/promises";
import { execFile } from "node:child_process";
import { promisify } from "node:util";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

const execFileAsync = promisify(execFile);
const PROJECT_ROOT = process.cwd();
const DATA_DIR = path.join(PROJECT_ROOT, "data", "mia-layout-skill");
const PROPOSALS_DIR = path.join(DATA_DIR, "proposals");
const BACKUPS_DIR = path.join(DATA_DIR, "backups");

const ALLOWED_PREFIXES = ["app/", "components/", "styles/", "public/"];
const ALLOWED_EXTENSIONS = [
  ".tsx",
  ".ts",
  ".jsx",
  ".js",
  ".css",
  ".scss",
  ".json",
  ".md",
  ".mdx",
];

const FORBIDDEN_PARTS = [
  ".env",
  ".next",
  "node_modules",
  "package.json",
  "package-lock.json",
  "pnpm-lock.yaml",
  "yarn.lock",
  "next.config",
  "middleware.ts",
  "nginx",
  "ecosystem.config",
];

type SkillAction =
  | "create_proposal"
  | "list_proposals"
  | "read_proposal"
  | "apply_approved";

type ProposedFile = {
  path: string;
  content: string;
  reason?: string;
};

type Proposal = {
  id: string;
  title: string;
  status: "draft" | "applied" | "failed";
  createdAt: string;
  appliedAt?: string;
  notes?: string;
  files: ProposedFile[];
  buildLog?: string;
  gitCommit?: string;
  error?: string;
};

function json(data: unknown, status = 200) {
  return NextResponse.json(data, { status });
}

function getSkillKey(request: NextRequest) {
  return (
    request.headers.get("x-sualuma-skill-key") ||
    request.headers.get("authorization")?.replace(/^Bearer\s+/i, "") ||
    ""
  );
}

function requireAuth(request: NextRequest) {
  const provided = getSkillKey(request);
  const expected = process.env.MIA_LAYOUT_SKILL_KEY || process.env.BRAIN_API_KEY;

  if (!expected) {
    throw new Error("MIA_LAYOUT_SKILL_KEY não configurada no servidor.");
  }

  if (provided !== expected) {
    throw new Error("Acesso negado para a skill de layout.");
  }
}

function safeId() {
  return `mia-layout-${Date.now()}-${crypto.randomBytes(4).toString("hex")}`;
}

function hashContent(content: string) {
  return crypto.createHash("sha256").update(content).digest("hex").slice(0, 12);
}

function normalizeTargetPath(input: string) {
  if (!input || typeof input !== "string") {
    throw new Error("Caminho do arquivo inválido.");
  }

  const relative = input.replace(/\\/g, "/").replace(/^\/+/, "");

  if (
    relative.includes("..") ||
    path.isAbsolute(relative) ||
    relative.startsWith(".")
  ) {
    throw new Error(`Caminho bloqueado: ${input}`);
  }

  if (relative.startsWith("app/api/")) {
    throw new Error("Por segurança, esta skill não altera APIs nesta versão.");
  }

  if (!ALLOWED_PREFIXES.some((prefix) => relative.startsWith(prefix))) {
    throw new Error(`Arquivo fora das pastas permitidas: ${relative}`);
  }

  if (FORBIDDEN_PARTS.some((part) => relative.includes(part))) {
    throw new Error(`Arquivo protegido/bloqueado: ${relative}`);
  }

  const ext = path.extname(relative);
  if (!ALLOWED_EXTENSIONS.includes(ext)) {
    throw new Error(`Extensão não permitida: ${ext || "sem extensão"}`);
  }

  const absolute = path.resolve(PROJECT_ROOT, relative);

  if (!absolute.startsWith(PROJECT_ROOT + path.sep)) {
    throw new Error("Tentativa de sair da pasta do projeto bloqueada.");
  }

  return { relative, absolute };
}

async function ensureDirs() {
  await fs.mkdir(PROPOSALS_DIR, { recursive: true });
  await fs.mkdir(BACKUPS_DIR, { recursive: true });
}

async function readProposal(id: string): Promise<Proposal> {
  const safe = id.replace(/[^a-zA-Z0-9._-]/g, "");
  const file = path.join(PROPOSALS_DIR, `${safe}.json`);
  const raw = await fs.readFile(file, "utf8");
  return JSON.parse(raw);
}

async function writeProposal(proposal: Proposal) {
  await ensureDirs();
  const file = path.join(PROPOSALS_DIR, `${proposal.id}.json`);
  await fs.writeFile(file, JSON.stringify(proposal, null, 2), "utf8");
}

async function runCommand(command: string, args: string[]) {
  const result = await execFileAsync(command, args, {
    cwd: PROJECT_ROOT,
    timeout: 240_000,
    maxBuffer: 1024 * 1024 * 20,
  });

  return `${result.stdout || ""}\n${result.stderr || ""}`.trim();
}

async function createProposal(body: any) {
  await ensureDirs();

  const title = String(body.title || "Alteração de layout pela Mia").slice(0, 120);
  const notes = String(body.notes || "").slice(0, 2000);
  const files = Array.isArray(body.files) ? body.files : [];

  if (!files.length) {
    throw new Error("Nenhum arquivo enviado para proposta.");
  }

  if (files.length > 8) {
    throw new Error("Limite de 8 arquivos por proposta.");
  }

  const normalizedFiles: ProposedFile[] = [];

  for (const file of files) {
    const target = normalizeTargetPath(String(file.path || ""));
    const content = String(file.content ?? "");

    if (!content.trim()) {
      throw new Error(`Conteúdo vazio para ${target.relative}.`);
    }

    if (content.length > 350_000) {
      throw new Error(`Arquivo muito grande para alteração segura: ${target.relative}`);
    }

    normalizedFiles.push({
      path: target.relative,
      content,
      reason: String(file.reason || "").slice(0, 800),
    });
  }

  const proposal: Proposal = {
    id: safeId(),
    title,
    status: "draft",
    createdAt: new Date().toISOString(),
    notes,
    files: normalizedFiles,
  };

  await writeProposal(proposal);

  const preview = await Promise.all(
    normalizedFiles.map(async (file) => {
      const target = normalizeTargetPath(file.path);
      const before = existsSync(target.absolute)
        ? await fs.readFile(target.absolute, "utf8")
        : "";

      return {
        path: file.path,
        exists: existsSync(target.absolute),
        beforeHash: hashContent(before),
        afterHash: hashContent(file.content),
        beforeLines: before ? before.split("\n").length : 0,
        afterLines: file.content.split("\n").length,
        reason: file.reason || "",
      };
    })
  );

  return {
    ok: true,
    proposalId: proposal.id,
    status: proposal.status,
    message:
      "Proposta criada. Nada foi aplicado ainda. Para aplicar, a Luma precisa aprovar explicitamente.",
    requiredApprovalPhrase: "APROVADO PELA LUMA",
    preview,
  };
}

async function listProposals() {
  await ensureDirs();

  const files = await fs.readdir(PROPOSALS_DIR);
  const proposals = [];

  for (const file of files.filter((name) => name.endsWith(".json")).slice(-30)) {
    try {
      const proposal = JSON.parse(
        await fs.readFile(path.join(PROPOSALS_DIR, file), "utf8")
      );

      proposals.push({
        id: proposal.id,
        title: proposal.title,
        status: proposal.status,
        createdAt: proposal.createdAt,
        appliedAt: proposal.appliedAt,
        files: proposal.files?.map((item: ProposedFile) => item.path) || [],
      });
    } catch {}
  }

  return {
    ok: true,
    proposals: proposals.sort((a, b) =>
      String(b.createdAt).localeCompare(String(a.createdAt))
    ),
  };
}

async function applyApproved(body: any) {
  await ensureDirs();

  const proposalId = String(body.proposalId || "");
  const approvalPhrase = String(body.approvalPhrase || "");

  if (approvalPhrase !== "APROVADO PELA LUMA") {
    throw new Error(
      "A alteração não foi aplicada. Falta aprovação explícita: APROVADO PELA LUMA"
    );
  }

  const proposal = await readProposal(proposalId);

  if (proposal.status === "applied") {
    return {
      ok: true,
      message: "Essa proposta já foi aplicada antes.",
      proposal,
    };
  }

  const backupDir = path.join(BACKUPS_DIR, proposal.id);
  await fs.mkdir(backupDir, { recursive: true });

  const touchedFiles: string[] = [];

  try {
    for (const file of proposal.files) {
      const target = normalizeTargetPath(file.path);
      touchedFiles.push(target.relative);

      const backupPath = path.join(
        backupDir,
        target.relative.replace(/[\/\\]/g, "__")
      );

      if (existsSync(target.absolute)) {
        const current = await fs.readFile(target.absolute, "utf8");
        await fs.writeFile(backupPath, current, "utf8");
      } else {
        await fs.writeFile(`${backupPath}.NEW_FILE`, "created", "utf8");
      }

      await fs.mkdir(path.dirname(target.absolute), { recursive: true });
      await fs.writeFile(target.absolute, file.content, "utf8");
    }

    const buildLog = await runCommand("npm", ["run", "build"]);

    await runCommand("git", ["add", "--", ...touchedFiles]);

    let commitLog = "";
    try {
      await runCommand("git", ["diff", "--cached", "--quiet"]);
      commitLog = "Nenhuma mudança nova para commit.";
    } catch {
      commitLog = await runCommand("git", [
        "commit",
        "-m",
        `Mia: ${proposal.title}`,
      ]);
    }

    proposal.status = "applied";
    proposal.appliedAt = new Date().toISOString();
    proposal.buildLog = buildLog.slice(-6000);
    proposal.gitCommit = commitLog.slice(-2000);
    await writeProposal(proposal);

    return {
      ok: true,
      message:
        "Alteração aplicada, build aprovado e commit salvo no Git. Reinicie o PM2 para publicar a versão compilada.",
      proposalId: proposal.id,
      files: touchedFiles,
      git: proposal.gitCommit,
    };
  } catch (error: any) {
    for (const file of proposal.files) {
      const target = normalizeTargetPath(file.path);
      const backupPath = path.join(
        backupDir,
        target.relative.replace(/[\/\\]/g, "__")
      );

      if (existsSync(backupPath)) {
        const backup = await fs.readFile(backupPath, "utf8");
        await fs.writeFile(target.absolute, backup, "utf8");
      } else if (existsSync(`${backupPath}.NEW_FILE`)) {
        await fs.rm(target.absolute, { force: true });
      }
    }

    proposal.status = "failed";
    proposal.error = String(error?.message || error).slice(0, 6000);
    await writeProposal(proposal);

    throw new Error(
      `Build/aplicação falhou. Arquivos restaurados automaticamente. Erro: ${
        error?.message || error
      }`
    );
  }
}

export async function POST(request: NextRequest) {
  try {
    requireAuth(request);

    const body = await request.json();
    const action = String(body.action || "") as SkillAction;

    if (action === "create_proposal") {
      return json(await createProposal(body));
    }

    if (action === "list_proposals") {
      return json(await listProposals());
    }

    if (action === "read_proposal") {
      return json({
        ok: true,
        proposal: await readProposal(String(body.proposalId || "")),
      });
    }

    if (action === "apply_approved") {
      return json(await applyApproved(body));
    }

    return json(
      {
        ok: false,
        error:
          "Ação inválida. Use create_proposal, list_proposals, read_proposal ou apply_approved.",
      },
      400
    );
  } catch (error: any) {
    return json(
      {
        ok: false,
        error: error?.message || "Erro interno na skill de layout.",
      },
      500
    );
  }
}
