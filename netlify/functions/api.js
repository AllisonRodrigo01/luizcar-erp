import { createClient } from "@libsql/client";
import crypto from "crypto";

// Corrige serialização de BigInt retornados pelo libSQL/Turso
BigInt.prototype.toJSON = function () { return Number(this); };

function jsonResponse(data, status = 200, headers = {}) {
  const body = JSON.stringify(data);
  return new Response(body, { status, headers: { ...headers, "Content-Type": "application/json" } });
}

const TURSO_URL = process.env.TURSO_URL;
const TURSO_AUTH_TOKEN = process.env.TURSO_AUTH_TOKEN;

if (!TURSO_URL || !TURSO_AUTH_TOKEN) {
  console.error("TURSO_URL e TURSO_AUTH_TOKEN devem estar configurados nas variáveis de ambiente do Netlify");
}

const tursoClient = createClient({
  url: TURSO_URL,
  authToken: TURSO_AUTH_TOKEN,
});

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

CREATE INDEX IF NOT EXISTS idx_clientes_nome ON clientes (nome);
CREATE INDEX IF NOT EXISTS idx_veiculos_placa ON veiculos (placa);
CREATE INDEX IF NOT EXISTS idx_os_status ON ordens_servico (status);
CREATE INDEX IF NOT EXISTS idx_estoque_nome ON estoque (nome);
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

    // ===== MIGRATE (cria tabelas e admin padrão) =====
    if (action === "migrate") {
      for (const stmt of SCHEMA_SQL.split(";").filter(s => s.trim())) {
        try { await tursoClient.execute({ sql: stmt }); } catch (e) { console.warn("Migration stmt:", e.message); }
      }
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
      return new Response(JSON.stringify({ success: true }), { status: 200, headers });
    }

    // ===== LOGIN =====
    if (action === "login") {
      const { username, password } = body;
      if (!username || !password) {
        return new Response(JSON.stringify({ error: "Usuário e senha obrigatórios" }), { status: 400, headers });
      }

      const result = await tursoClient.execute({
        sql: "SELECT id, nome, login, nivel_acesso, senha_hash FROM usuarios WHERE login = ?",
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
          role: user.nivel_acesso === "Admin" ? "admin" : "funcionario",
        },
      }), { status: 200, headers });
    }

    // ===== CRIAR USUÁRIO (server-side hashing) =====
    if (action === "criar_usuario") {
      const { nome, login, senha, nivel_acesso } = body;
      if (!nome || !login || !senha) {
        return new Response(JSON.stringify({ error: "Nome, login e senha obrigatórios" }), { status: 400, headers });
      }
      const senha_hash = crypto.createHash("sha256").update(senha).digest("hex");
      const result = await tursoClient.execute({
        sql: "INSERT INTO usuarios (nome, login, senha_hash, nivel_acesso) VALUES (?, ?, ?, ?)",
        args: [nome, login, senha_hash, nivel_acesso || 'Atendimento'],
      });
      return new Response(JSON.stringify({ success: true, lastInsertRowid: result.lastInsertRowid }), { status: 200, headers });
    }

    // ===== ATUALIZAR USUÁRIO =====
    if (action === "atualizar_usuario") {
      const { id, nome, login, senha, nivel_acesso } = body;
      if (!id || !nome || !login) {
        return new Response(JSON.stringify({ error: "ID, nome e login obrigatórios" }), { status: 400, headers });
      }
      if (senha) {
        const senha_hash = crypto.createHash("sha256").update(senha).digest("hex");
        await tursoClient.execute({
          sql: "UPDATE usuarios SET nome = ?, login = ?, senha_hash = ?, nivel_acesso = ? WHERE id = ?",
          args: [nome, login, senha_hash, nivel_acesso, id],
        });
      } else {
        await tursoClient.execute({
          sql: "UPDATE usuarios SET nome = ?, login = ?, nivel_acesso = ? WHERE id = ?",
          args: [nome, login, nivel_acesso, id],
        });
      }
      return new Response(JSON.stringify({ success: true }), { status: 200, headers });
    }

    // ===== QUERY GENÉRICA =====
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

    // ===== INSERT =====
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

    // ===== UPDATE =====
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

    // ===== DELETE =====
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

    return new Response(JSON.stringify({ error: "Ação desconhecida" }), { status: 400, headers });

  } catch (error) {
    console.error("Erro na API:", error);
    return new Response(JSON.stringify({ error: error.message || "Erro interno do servidor" }), { status: 500, headers });
  }
};
