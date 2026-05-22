import { createClient } from "@libsql/client";

const TURSO_URL = process.env.TURSO_URL;
const TURSO_AUTH_TOKEN = process.env.TURSO_AUTH_TOKEN;

const tursoClient = createClient({
  url: TURSO_URL,
  authToken: TURSO_AUTH_TOKEN,
});

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

    // ===== LOGIN =====
    if (action === "login") {
      const { username, password } = body;
      if (!username || !password) {
        return new Response(JSON.stringify({ error: "Usuário e senha obrigatórios" }), { status: 400, headers });
      }

      const result = await tursoClient.execute({
        sql: "SELECT id, nome, login, nivel_acesso, senha FROM usuarios WHERE login = ? AND ativo = 1",
        args: [username],
      });

      if (result.rows.length === 0) {
        return new Response(JSON.stringify({ error: "Usuário ou senha inválidos" }), { status: 401, headers });
      }

      const user = result.rows[0];
      // Comparação simples - em produção usar bcrypt
      if (user.senha !== password) {
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
