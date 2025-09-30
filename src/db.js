import Database from "better-sqlite3";

const db = new Database("conversas.db");

// cria tabela se não existir
db.prepare(`
  CREATE TABLE IF NOT EXISTS mensagens (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    user TEXT,
    role TEXT,
    content TEXT,
    timestamp DATETIME DEFAULT CURRENT_TIMESTAMP
  )
`).run();

// salvar mensagem
export function salvarMensagem(user, role, content) {
  const stmt = db.prepare("INSERT INTO mensagens (user, role, content) VALUES (?, ?, ?)");
  stmt.run(user, role, content);
}

// buscar histórico
export function buscarHistorico(user, limite = 10) {
  const stmt = db.prepare("SELECT role, content FROM mensagens WHERE user = ? ORDER BY id DESC LIMIT ?");
  const rows = stmt.all(user, limite);
  return rows.reverse(); // mantém ordem cronológica
}
