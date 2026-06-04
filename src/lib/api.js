const isElectron = typeof window !== 'undefined' && window.electronAPI;

export const API_URL = import.meta.env.VITE_API_URL || "/.netlify/functions/api";

export async function migrateDatabase() {
  if (isElectron) {
    try {
      await window.electronAPI.migrate();
      return true;
    } catch (e) {
      console.warn("Migration call failed:", e);
      return false;
    }
  }
  try {
    const res = await fetch(API_URL, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ action: "migrate" }),
    });
    return res.ok;
  } catch (e) {
    console.warn("Migration call failed:", e);
    return false;
  }
}

export async function apiCall(payload) {
  const { action, ...params } = payload;

  if (isElectron) {
    switch (action) {
      case "query":
      case "execute_query":
        return await window.electronAPI.execute({ sql: params.sql, args: params.args || [] });
      case "insert":
        return await window.electronAPI.insert(params.table, params.data);
      case "update":
        return await window.electronAPI.update({
          table: params.table,
          data: params.data,
          whereClause: params.where,
          whereArgs: params.whereArgs || [],
        });
      case "delete":
        return await window.electronAPI.delete({
          table: params.table,
          whereClause: params.where,
          whereArgs: params.whereArgs || [],
        });
      case "login":
        return await window.electronAPI.login(params.username, params.password);
      case "verifyUser":
        return await window.electronAPI.verifyUser(params.userId);
      case "sendRecuperarSenha":
        return await window.electronAPI.sendRecuperarSenha(params.login);
      case "resetarSenha":
        return await window.electronAPI.resetarSenha(params.token, params.novaSenha);
      case "import_backup":
        return await window.electronAPI.importBackup(params.backup);
      case "criar_usuario":
        return await window.electronAPI.createUser({
          nome: params.nome,
          login: params.login,
          senha: params.senha,
          nivel_acesso: params.nivel_acesso,
          email: params.email,
        });
      case "atualizar_usuario":
        return await window.electronAPI.updateUser({
          id: params.id,
          nome: params.nome,
          login: params.login,
          senha: params.senha,
          nivel_acesso: params.nivel_acesso,
          email: params.email,
        });
      default:
        throw new Error(`Ação desconhecida: ${action}`);
    }
  }

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
  execute: async ({ sql, args = [] }) => {
    const data = await apiCall({ action: "query", sql, args });
    return { rows: data.rows || [], columns: data.columns || [] };
  },

  query: async (sql, args = []) => {
    const data = await apiCall({ action: "query", sql, args });
    return { rows: data.rows || [], columns: data.columns || [] };
  },

  sendRecuperarSenha: async (login) => {
    return apiCall({ action: "sendRecuperarSenha", login });
  },
  resetarSenha: async (token, novaSenha) => {
    return apiCall({ action: "resetarSenha", token, novaSenha });
  },

  verifyUser: async (userId) => {
    const data = await apiCall({ action: "verifyUser", userId });
    return data.exists;
  },

  login: async (username, password) => {
    const data = await apiCall({ action: "login", username, password });
    return data.user;
  },

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

export function openExternal(url) {
  if (isElectron) {
    window.electronAPI.openExternal(url);
  } else {
    window.open(url, '_blank');
  }
}

export function hojeLocal() {
  const d = new Date();
  const pad = n => String(n).padStart(2, '0');
  return `${d.getFullYear()}-${pad(d.getMonth() + 1)}-${pad(d.getDate())}`;
}

export function formatDataLocal(dataStr) {
  if (!dataStr) return '';
  const [y, m, d] = dataStr.split('T')[0].split('-');
  return `${d}/${m}/${y}`;
}

export default api;
