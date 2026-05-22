const API_URL = import.meta.env.VITE_API_URL || "/.netlify/functions/api";

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
};

export default api;
