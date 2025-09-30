// memória simples em RAM
const conversas = {};

export function getHistorico(user) {
  if (!conversas[user]) {
    conversas[user] = [];
  }
  return conversas[user];
}

export function adicionarMensagem(user, role, content) {
  if (!conversas[user]) {
    conversas[user] = [];
  }
  conversas[user].push({ role, content });

  // limita histórico a 10 interações
  if (conversas[user].length > 10) {
    conversas[user].shift();
  }
}
