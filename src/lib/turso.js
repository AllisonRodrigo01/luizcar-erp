import { createClient } from "@libsql/client";

// Substitua estas variáveis pelas credenciais do seu banco de dados Turso
// No futuro, isso deve vir de variáveis de ambiente (.env)
const TURSO_URL = import.meta.env.VITE_TURSO_URL || "libsql://seu-banco-turso.turso.io";
const TURSO_AUTH_TOKEN = import.meta.env.VITE_TURSO_AUTH_TOKEN || "seu_token_aqui";

export const tursoClient = createClient({
  url: TURSO_URL,
  authToken: TURSO_AUTH_TOKEN,
});
