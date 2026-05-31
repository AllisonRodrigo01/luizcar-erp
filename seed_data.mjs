import { createClient } from "@libsql/client";

const db = createClient({ url: "file:dev.db" });

// Add client
const clientRes = await db.execute({
  sql: "INSERT INTO clientes (nome, cpf_cnpj, telefone, email, ativo, criado_em) VALUES (?, ?, ?, ?, 1, datetime('now', 'localtime'))",
  args: ["João Silva", "123.456.789-00", "(11) 99999-8888", "joao@email.com"],
});
console.log("Cliente criado, id:", clientRes.lastInsertRowid);

// Add vehicle
const veicRes = await db.execute({
  sql: "INSERT INTO veiculos (cliente_id, placa, marca, modelo, ano, cor, combustivel, criado_em) VALUES (?, ?, ?, ?, ?, ?, ?, datetime('now', 'localtime'))",
  args: [clientRes.lastInsertRowid, "ABC-1234", "Volkswagen", "Gol", 2020, "Prata", "Gasolina"],
});
console.log("Veículo criado, id:", veicRes.lastInsertRowid);

// Add OS
const osRes = await db.execute({
  sql: "INSERT INTO ordens_servico (cliente_id, veiculo_id, data_entrada, status, descricao_problema, servicos_executados, mao_de_obra, pecas_custo, total) VALUES (?, ?, date('now', 'localtime'), 'Orçamento', ?, ?, ?, ?, ?)",
  args: [
    clientRes.lastInsertRowid,
    veicRes.lastInsertRowid,
    "Veículo apresentando falha na partida pela manhã. Luz da injeção acesa no painel. Necessário verificar sistema de ignição e sensores.",
    "Realizado teste de compressão dos cilindros. Substituída vela de ignição e bobina do cilindro 3. Feita limpeza dos bicos injetores e recalibração da central.",
    350.00,
    280.50,
    630.50
  ],
});
console.log("OS criada, id:", osRes.lastInsertRowid);

await db.close();
