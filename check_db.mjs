import { createClient } from "@libsql/client";
import crypto from "crypto";

const db = createClient({ url: "file:dev.db" });
const result = await db.execute({ sql: "SELECT id, nome, login, senha_hash, nivel_acesso FROM usuarios" });
console.log("Users:", JSON.stringify(result.rows, null, 2));
if (result.rows.length > 0) {
  const hash = crypto.createHash("sha256").update("admin").digest("hex");
  console.log("Expected hash for 'admin':", hash);
  console.log("Match:", result.rows[0].senha_hash === hash);
} else {
  console.log("No users found - running migration...");
}
await db.close();
