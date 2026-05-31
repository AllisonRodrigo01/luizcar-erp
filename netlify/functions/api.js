import { createClient } from "@libsql/client";
import crypto from "crypto";

BigInt.prototype.toJSON = function () { return Number(this); };

function jsonResponse(data, status = 200, headers = {}) {
  const body = JSON.stringify(data);
  return new Response(body, { status, headers: { ...headers, "Content-Type": "application/json" } });
}

const TURSO_URL = process.env.TURSO_URL;
const TURSO_AUTH_TOKEN = process.env.TURSO_AUTH_TOKEN;

const tursoClient = createClient(
  TURSO_URL && TURSO_AUTH_TOKEN
    ? { url: TURSO_URL, authToken: TURSO_AUTH_TOKEN }
    : { url: "file:dev.db" }
);

if (!TURSO_URL || !TURSO_AUTH_TOKEN) {
  console.log("🔧 Modo desenvolvimento: usando SQLite local (dev.db)");
}

const SCHEMA_SQL = `
CREATE TABLE IF NOT EXISTS clientes (
  id INTEGER PRIMARY KEY AUTOINCREMENT,
  nome TEXT NOT NULL,
  cpf_cnpj TEXT UNIQUE,
  telefone TEXT,
  email TEXT,
  endereco TEXT,
  ativo INTEGER NOT NULL DEFAULT 1,
  criado_em TEXT,
  atualizado_em TEXT,
  tipo_documento TEXT,
  cep TEXT,
  logradouro TEXT,
  numero TEXT,
  complemento TEXT,
  bairro TEXT,
  cidade TEXT,
  uf TEXT
);

CREATE TABLE IF NOT EXISTS veiculos (
  id INTEGER PRIMARY KEY AUTOINCREMENT,
  cliente_id INTEGER,
  placa TEXT UNIQUE NOT NULL,
  marca TEXT,
  modelo TEXT,
  ano INTEGER,
  cor TEXT,
  combustivel TEXT,
  quilometragem TEXT,
  observacoes TEXT,
  criado_em TEXT,
  FOREIGN KEY (cliente_id) REFERENCES clientes (id)
);

CREATE TABLE IF NOT EXISTS estoque (
  id INTEGER PRIMARY KEY AUTOINCREMENT,
  nome TEXT NOT NULL,
  descricao TEXT,
  quantidade INTEGER DEFAULT 0,
  estoque_minimo INTEGER NOT NULL DEFAULT 5,
  preco_custo REAL,
  preco_venda REAL,
  ativo INTEGER NOT NULL DEFAULT 1,
  criado_em TEXT
);

CREATE TABLE IF NOT EXISTS ordens_servico (
  id INTEGER PRIMARY KEY AUTOINCREMENT,
  cliente_id INTEGER,
  veiculo_id INTEGER,
  data_entrada TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  data_saida TIMESTAMP,
  status TEXT DEFAULT 'Aberta',
  descricao_problema TEXT,
  servicos_executados TEXT,
  mao_de_obra REAL DEFAULT 0,
  pecas_custo REAL DEFAULT 0,
  total REAL DEFAULT 0,
  criado_em TEXT,
  desconto REAL NOT NULL DEFAULT 0,
  observacoes TEXT,
  mecanico_id INTEGER,
  comissao_percentual REAL DEFAULT 0.0,
  FOREIGN KEY (cliente_id) REFERENCES clientes (id),
  FOREIGN KEY (veiculo_id) REFERENCES veiculos (id)
);

CREATE TABLE IF NOT EXISTS usuarios (
  id INTEGER PRIMARY KEY AUTOINCREMENT,
  nome TEXT NOT NULL,
  login TEXT UNIQUE NOT NULL,
  senha_hash TEXT NOT NULL,
  nivel_acesso TEXT NOT NULL DEFAULT 'Mecanico',
  criado_em TEXT NOT NULL DEFAULT (datetime('now', 'localtime'))
);

CREATE TABLE IF NOT EXISTS configuracoes (
  chave TEXT PRIMARY KEY,
  valor TEXT NOT NULL
);

CREATE TABLE IF NOT EXISTS historico_os (
  id INTEGER PRIMARY KEY AUTOINCREMENT,
  os_id INTEGER NOT NULL,
  tipo TEXT NOT NULL,
  titulo TEXT NOT NULL,
  detalhe TEXT,
  criado_em TEXT NOT NULL DEFAULT (datetime('now', 'localtime')),
  FOREIGN KEY (os_id) REFERENCES ordens_servico (id) ON DELETE CASCADE
);

CREATE TABLE IF NOT EXISTS fluxo_caixa (
  id INTEGER PRIMARY KEY AUTOINCREMENT,
  tipo TEXT NOT NULL,
  categoria TEXT NOT NULL,
  valor REAL NOT NULL,
  data_transacao TEXT NOT NULL DEFAULT (date('now', 'localtime')),
  descricao TEXT,
  criado_em TEXT NOT NULL DEFAULT (datetime('now', 'localtime'))
);

CREATE TABLE IF NOT EXISTS reset_tokens (
  id INTEGER PRIMARY KEY AUTOINCREMENT,
  usuario_id INTEGER NOT NULL,
  token TEXT NOT NULL UNIQUE,
  expira_em TEXT NOT NULL,
  usado INTEGER NOT NULL DEFAULT 0,
  criado_em TEXT NOT NULL DEFAULT (datetime('now', 'localtime')),
  FOREIGN KEY (usuario_id) REFERENCES usuarios (id) ON DELETE CASCADE
);

CREATE TABLE IF NOT EXISTS agendamentos (
  id INTEGER PRIMARY KEY AUTOINCREMENT,
  cliente_id INTEGER NOT NULL,
  veiculo_id INTEGER,
  data DATE NOT NULL,
  hora TIME NOT NULL,
  servico TEXT NOT NULL,
  descricao TEXT,
  status TEXT NOT NULL DEFAULT 'Agendado',
  criado_em TEXT NOT NULL DEFAULT (datetime('now', 'localtime')),
  FOREIGN KEY (cliente_id) REFERENCES clientes (id),
  FOREIGN KEY (veiculo_id) REFERENCES veiculos (id)
);

CREATE TABLE IF NOT EXISTS notificacoes (
  id INTEGER PRIMARY KEY AUTOINCREMENT,
  cliente_id INTEGER NOT NULL,
  os_id INTEGER,
  tipo TEXT NOT NULL,
  mensagem TEXT NOT NULL,
  lida INTEGER NOT NULL DEFAULT 0,
  criado_em TEXT NOT NULL DEFAULT (datetime('now', 'localtime')),
  FOREIGN KEY (cliente_id) REFERENCES clientes (id)
);

CREATE INDEX IF NOT EXISTS idx_clientes_nome ON clientes (nome);
CREATE INDEX IF NOT EXISTS idx_veiculos_placa ON veiculos (placa);
CREATE INDEX IF NOT EXISTS idx_os_status ON ordens_servico (status);
CREATE INDEX IF NOT EXISTS idx_estoque_nome ON estoque (nome);
CREATE INDEX IF NOT EXISTS idx_agendamentos_data ON agendamentos (data);
CREATE INDEX IF NOT EXISTS idx_notificacoes_lida ON notificacoes (lida);
`;

export default async (req) => {
  const headers = {
    "Access-Control-Allow-Origin": "*",
    "Access-Control-Allow-Methods": "POST, OPTIONS",
    "Access-Control-Allow-Headers": "Content-Type",
    "Content-Type": "application/json",
  };

  if (req.method === "OPTIONS") {
    return new Response(null, { status: 204, headers });
  }

  if (req.method !== "POST") {
    return new Response(JSON.stringify({ error: "Método não permitido" }), { status: 405, headers });
  }

  try {
    const body = await req.json();
    const { action } = body;

    if (!action) {
      return new Response(JSON.stringify({ error: "Ação não especificada" }), { status: 400, headers });
    }

    async function ensureColumn(table, column, colDef) {
      try {
        const info = await tursoClient.execute({ sql: `PRAGMA table_info(${table})` });
        const has = info.rows.some(r => r.name === column);
        if (!has) {
          await tursoClient.execute({ sql: `ALTER TABLE ${table} ADD COLUMN ${column} ${colDef}` });
        }
      } catch (e) { console.warn(`ensureColumn ${table}.${column}:`, e.message); }
    }

    if (action === "migrate") {
      for (const stmt of SCHEMA_SQL.split(";").filter(s => s.trim())) {
        try { await tursoClient.execute({ sql: stmt }); } catch (e) { console.warn("Migration stmt:", e.message); }
      }
      await ensureColumn("usuarios", "email", "TEXT");
      await ensureColumn("veiculos", "combustivel", "TEXT");
      await ensureColumn("veiculos", "quilometragem", "TEXT");
      await ensureColumn("veiculos", "observacoes", "TEXT");
      await ensureColumn("ordens_servico", "observacao", "TEXT");
      await ensureColumn("ordens_servico", "servicos_executados", "TEXT");
      await ensureColumn("ordens_servico", "pecas_custo", "REAL DEFAULT 0");
      await ensureColumn("ordens_servico", "mecanico_id", "INTEGER");
      await ensureColumn("ordens_servico", "comissao_percentual", "REAL DEFAULT 0.0");
      await ensureColumn("ordens_servico", "desconto", "REAL NOT NULL DEFAULT 0");
      await ensureColumn("clientes", "observacao", "TEXT");
      await ensureColumn("clientes", "tipo_documento", "TEXT");
      await ensureColumn("clientes", "cep", "TEXT");
      await ensureColumn("clientes", "logradouro", "TEXT");
      await ensureColumn("clientes", "numero", "TEXT");
      await ensureColumn("clientes", "complemento", "TEXT");
      await ensureColumn("clientes", "bairro", "TEXT");
      await ensureColumn("clientes", "cidade", "TEXT");
      await ensureColumn("clientes", "uf", "TEXT");
      try {
        const adminCheck = await tursoClient.execute({ sql: "SELECT COUNT(*) as cnt FROM usuarios" });
        if (Number(adminCheck.rows[0]?.cnt || 0) === 0) {
          const adminHash = crypto.createHash("sha256").update("admin").digest("hex");
          await tursoClient.execute({
            sql: "INSERT INTO usuarios (nome, login, senha_hash, nivel_acesso) VALUES (?, ?, ?, ?)",
            args: ["Administrador", "admin", adminHash, "Admin"],
          });
        }
      } catch (e) { console.warn("Seed admin error:", e.message); }
      try {
        await tursoClient.execute({ sql: "INSERT OR IGNORE INTO configuracoes (chave, valor) VALUES ('razao_social', 'Luiz Car Oficina Automotiva')" });
        await tursoClient.execute({ sql: "INSERT OR IGNORE INTO configuracoes (chave, valor) VALUES ('nome_fantasia', 'LuizCar')" });
        await tursoClient.execute({ sql: "INSERT OR IGNORE INTO configuracoes (chave, valor) VALUES ('cnpj', '00.000.000/0001-00')" });
        await tursoClient.execute({ sql: "INSERT OR IGNORE INTO configuracoes (chave, valor) VALUES ('telefone', '(11) 99999-9999')" });
        await tursoClient.execute({ sql: "INSERT OR IGNORE INTO configuracoes (chave, valor) VALUES ('email', 'contato@luizcar.com.br')" });
        await tursoClient.execute({ sql: "INSERT OR IGNORE INTO configuracoes (chave, valor) VALUES ('logradouro', 'Rua Exemplo')" });
        await tursoClient.execute({ sql: "INSERT OR IGNORE INTO configuracoes (chave, valor) VALUES ('numero', '123')" });
        await tursoClient.execute({ sql: "INSERT OR IGNORE INTO configuracoes (chave, valor) VALUES ('bairro', 'Centro')" });
        await tursoClient.execute({ sql: "INSERT OR IGNORE INTO configuracoes (chave, valor) VALUES ('cidade', 'São Paulo')" });
        await tursoClient.execute({ sql: "INSERT OR IGNORE INTO configuracoes (chave, valor) VALUES ('uf', 'SP')" });
      } catch (e) { console.warn("Seed config error:", e.message); }
      return new Response(JSON.stringify({ success: true }), { status: 200, headers });
    }

    if (action === "login") {
      const { username, password } = body;
      if (!username || !password) {
        return new Response(JSON.stringify({ error: "Usuário e senha obrigatórios" }), { status: 400, headers });
      }

      const result = await tursoClient.execute({
        sql: "SELECT id, nome, login, email, nivel_acesso, senha_hash FROM usuarios WHERE login = ?",
        args: [username],
      });

      if (result.rows.length === 0) {
        return new Response(JSON.stringify({ error: "Usuário ou senha inválidos" }), { status: 401, headers });
      }

      const user = result.rows[0];
      const hashedPassword = crypto.createHash("sha256").update(password).digest("hex");
      if (user.senha_hash !== hashedPassword) {
        return new Response(JSON.stringify({ error: "Usuário ou senha inválidos" }), { status: 401, headers });
      }

      return new Response(JSON.stringify({
        success: true,
        user: {
          id: user.id,
          name: user.nome,
          login: user.login,
          email: user.email || '',
          role: user.nivel_acesso === "Admin" ? "admin" : "funcionario",
        },
      }), { status: 200, headers });
    }

    if (action === "criar_usuario") {
      const { nome, login, senha, nivel_acesso, email } = body;
      if (!nome || !login || !senha) {
        return new Response(JSON.stringify({ error: "Nome, login e senha obrigatórios" }), { status: 400, headers });
      }
      const senha_hash = crypto.createHash("sha256").update(senha).digest("hex");
      const result = await tursoClient.execute({
        sql: "INSERT INTO usuarios (nome, login, senha_hash, nivel_acesso, email) VALUES (?, ?, ?, ?, ?)",
        args: [nome, login, senha_hash, nivel_acesso || 'Atendimento', email || null],
      });
      return new Response(JSON.stringify({ success: true, lastInsertRowid: result.lastInsertRowid }), { status: 200, headers });
    }

    if (action === "atualizar_usuario") {
      const { id, nome, login, senha, nivel_acesso, email } = body;
      if (!id || !nome || !login) {
        return new Response(JSON.stringify({ error: "ID, nome e login obrigatórios" }), { status: 400, headers });
      }
      if (senha) {
        const senha_hash = crypto.createHash("sha256").update(senha).digest("hex");
        await tursoClient.execute({
          sql: "UPDATE usuarios SET nome = ?, login = ?, senha_hash = ?, nivel_acesso = ?, email = ? WHERE id = ?",
          args: [nome, login, senha_hash, nivel_acesso, email || null, id],
        });
      } else {
        await tursoClient.execute({
          sql: "UPDATE usuarios SET nome = ?, login = ?, nivel_acesso = ?, email = ? WHERE id = ?",
          args: [nome, login, nivel_acesso, email || null, id],
        });
      }
      return new Response(JSON.stringify({ success: true }), { status: 200, headers });
    }

    if (action === "query") {
      const { sql, args = [] } = body;
      if (!sql) {
        return new Response(JSON.stringify({ error: "SQL não fornecido" }), { status: 400, headers });
      }

      const result = await tursoClient.execute({ sql, args });
      return new Response(JSON.stringify({
        success: true,
        rows: result.rows || [],
        columns: result.columns || [],
      }), { status: 200, headers });
    }

    if (action === "insert") {
      const { table, data } = body;
      if (!table || !data) {
        return new Response(JSON.stringify({ error: "Tabela e dados obrigatórios" }), { status: 400, headers });
      }

      const columns = Object.keys(data);
      const values = Object.values(data);
      const placeholders = columns.map(() => "?").join(", ");

      const sql = `INSERT INTO ${table} (${columns.join(", ")}) VALUES (${placeholders})`;
      const result = await tursoClient.execute({ sql, args: values });

      return new Response(JSON.stringify({
        success: true,
        lastInsertRowid: result.lastInsertRowid,
      }), { status: 200, headers });
    }

    if (action === "update") {
      const { table, data, where, whereArgs = [] } = body;
      if (!table || !data || !where) {
        return new Response(JSON.stringify({ error: "Tabela, dados e condição obrigatórios" }), { status: 400, headers });
      }

      const columns = Object.keys(data);
      const values = Object.values(data);
      const setClause = columns.map((col) => `${col} = ?`).join(", ");

      const sql = `UPDATE ${table} SET ${setClause} WHERE ${where}`;
      const result = await tursoClient.execute({ sql, args: [...values, ...whereArgs] });

      return new Response(JSON.stringify({
        success: true,
        rowsAffected: result.rowsAffected,
      }), { status: 200, headers });
    }

    if (action === "verifyUser") {
      const { userId } = body;
      const result = await tursoClient.execute({
        sql: "SELECT id FROM usuarios WHERE id = ?",
        args: [userId],
      });
      return jsonResponse({ exists: result.rows.length > 0 });
    }

    if (action === "sendRecuperarSenha") {
      const { login } = body;
      if (!login) {
        return jsonResponse({ error: "Informe o login ou e-mail cadastrado" }, 400);
      }
      const userResult = await tursoClient.execute({
        sql: "SELECT id, nome, login, email FROM usuarios WHERE login = ? OR email = ?",
        args: [login, login],
      });
      if (userResult.rows.length === 0) {
        return jsonResponse({ error: "Usuário não encontrado" }, 404);
      }
      const user = userResult.rows[0];
      const token = crypto.randomUUID();
      const expira = new Date(Date.now() + 60 * 60 * 1000).toISOString();
      await tursoClient.execute({
        sql: "INSERT INTO reset_tokens (usuario_id, token, expira_em) VALUES (?, ?, ?)",
        args: [user.id, token, expira],
      });
      const origin = req.headers.get('origin') || req.headers.get('host') || 'luizcar.netlify.app';
      const baseUrl = origin.startsWith('http') ? origin : `https://${origin}`;
      const resetLink = `${baseUrl}/recuperar-senha/${token}`;
      const destEmail = user.email || user.login;
      let emailSent = false;
      const RESEND_KEY = process.env.RESEND_API_KEY;
      if (RESEND_KEY && destEmail.includes('@')) {
        try {
          const emailRes = await fetch("https://api.resend.com/emails", {
            method: "POST",
            headers: { "Authorization": `Bearer ${RESEND_KEY}`, "Content-Type": "application/json" },
            body: JSON.stringify({
              from: "LuizCar <onboarding@resend.dev>",
              to: [destEmail],
              subject: "Recuperação de Senha - LuizCar",
              html: `<p>Olá <strong>${user.nome}</strong>,</p>
<p>Você solicitou a recuperação de senha do sistema LuizCar.</p>
<p>Clique no link abaixo para redefinir sua senha (válido por 1 hora):</p>
<p><a href="${resetLink}" style="display:inline-block;padding:12px 24px;background:#1d4ed8;color:#fff;text-decoration:none;border-radius:6px;font-weight:600">Redefinir Senha</a></p>
<p>Se você não solicitou essa recuperação, ignore este e-mail.</p>
<p>Atenciosamente,<br>Equipe LuizCar</p>`,
            }),
          });
          if (emailRes.ok) {
            emailSent = true;
          } else {
            const errData = await emailRes.json().catch(() => ({}));
            console.error("Resend API error:", errData);
          }
        } catch (e) {
          console.error("Resend fetch error:", e);
        }
      }
      return jsonResponse({ success: true, message: emailSent ? "E-mail enviado com sucesso" : "Link gerado (e-mail não configurado para este usuário)", resetLink: emailSent ? null : resetLink });
    }

    if (action === "resetarSenha") {
      const { token, novaSenha } = body;
      if (!token || !novaSenha) {
        return jsonResponse({ error: "Token e nova senha obrigatórios" }, 400);
      }
      const tokenResult = await tursoClient.execute({
        sql: "SELECT id, usuario_id, expira_em, usado FROM reset_tokens WHERE token = ?",
        args: [token],
      });
      if (tokenResult.rows.length === 0) {
        return jsonResponse({ error: "Token inválido" }, 400);
      }
      const tk = tokenResult.rows[0];
      if (tk.usado) {
        return jsonResponse({ error: "Token já utilizado" }, 400);
      }
      if (new Date(tk.expira_em) < new Date()) {
        return jsonResponse({ error: "Token expirado" }, 400);
      }
      const senha_hash = crypto.createHash("sha256").update(novaSenha).digest("hex");
      await tursoClient.execute({
        sql: "UPDATE usuarios SET senha_hash = ? WHERE id = ?",
        args: [senha_hash, tk.usuario_id],
      });
      await tursoClient.execute({
        sql: "UPDATE reset_tokens SET usado = 1 WHERE id = ?",
        args: [tk.id],
      });
      return jsonResponse({ success: true, message: "Senha redefinida com sucesso" });
    }

    if (action === "delete") {
      const { table, where, whereArgs = [] } = body;
      if (!table || !where) {
        return new Response(JSON.stringify({ error: "Tabela e condição obrigatórios" }), { status: 400, headers });
      }

      const sql = `DELETE FROM ${table} WHERE ${where}`;
      const result = await tursoClient.execute({ sql, args: whereArgs });

      return new Response(JSON.stringify({
        success: true,
        rowsAffected: result.rowsAffected,
      }), { status: 200, headers });
    }

    if (action === "import_backup") {
      const { backup } = body;
      if (!backup) {
        return new Response(JSON.stringify({ error: "Dados de backup obrigatórios" }), { status: 400, headers });
      }

      const tables = ['notificacoes', 'agendamentos', 'historico_os', 'fluxo_caixa', 'ordens_servico', 'veiculos', 'clientes', 'estoque', 'configuracoes', 'usuarios'];
      for (const table of tables) {
        try {
          await tursoClient.execute({ sql: `DELETE FROM ${table}` });
        } catch (e) { console.warn(`Import clear ${table}:`, e.message); }
      }

      for (const table of tables) {
        const rows = backup[table];
        if (!rows || !rows.length) continue;
        for (const row of rows) {
          try {
            const cleaned = {};
            for (const [key, val] of Object.entries(row)) {
              if (val !== null && val !== undefined) cleaned[key] = val;
            }
            const columns = Object.keys(cleaned);
            const values = Object.values(cleaned);
            const placeholders = columns.map(() => "?").join(", ");
            await tursoClient.execute({
              sql: `INSERT INTO ${table} (${columns.join(", ")}) VALUES (${placeholders})`,
              args: values,
            });
          } catch (e) { console.warn(`Import row ${table}:`, e.message); }
        }
      }

      return new Response(JSON.stringify({ success: true }), { status: 200, headers });
    }

    return new Response(JSON.stringify({ error: "Ação desconhecida" }), { status: 400, headers });

  } catch (error) {
    console.error("Erro na API:", error);
    return new Response(JSON.stringify({ error: error.message || "Erro interno do servidor" }), { status: 500, headers });
  }
};