export const API_URL = import.meta.env.VITE_API_URL || "/.netlify/functions/api";

export async function migrateDatabase() {
  try {
    const res = await fetch(API_URL, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ action: "migrate" }),
    });
    return res.ok;
  } catch (e) {
    console.warn("Migration call failed (maybe already migrated):", e);
    return false;
  }
}

async function apiCall(payload) {
  const res = await fetch(API_URL, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify(payload),
  });

  const data = await res.json();

  if (!res.ok) {
    throw new Error(data.error || `Erro ${res.status}`);
  }

  return data;
}

export const api = {
  // Executa query SQL genérica
  execute: async ({ sql, args = [] }) => {
    const data = await apiCall({ action: "query", sql, args });
    return { rows: data.rows || [], columns: data.columns || [] };
  },

  // Executa SQL simples (string)
  query: async (sql, args = []) => {
    const data = await apiCall({ action: "query", sql, args });
    return { rows: data.rows || [], columns: data.columns || [] };
  },

  // Recuperacao de senha
  sendRecuperarSenha: async (login) => {
    return apiCall({ action: "sendRecuperarSenha", login });
  },
  resetarSenha: async (token, novaSenha) => {
    return apiCall({ action: "resetarSenha", token, novaSenha });
  },

  // Verifica se usuario ainda existe no banco
  verifyUser: async (userId) => {
    const data = await apiCall({ action: "verifyUser", userId });
    return data.exists;
  },

  // Login real
  login: async (username, password) => {
    const data = await apiCall({ action: "login", username, password });
    return data.user;
  },

  // CRUD helpers
  insert: async (table, data) => {
    return apiCall({ action: "insert", table, data });
  },

  update: async (table, data, where, whereArgs = []) => {
    return apiCall({ action: "update", table, data, where, whereArgs });
  },

  delete: async (table, where, whereArgs = []) => {
    return apiCall({ action: "delete", table, where, whereArgs });
  },

  importBackup: async (backup) => {
    return apiCall({ action: "import_backup", backup });
  },
};

export default api;
