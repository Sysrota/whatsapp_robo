import wppconnect from "@wppconnect-team/wppconnect";
import { gerarResposta } from "./ia.js";

export function startBot() {
  wppconnect
    .create({
      session: "chat-ia",
      catchQR: (base64Qr, asciiQR) => {
        console.log("📲 Escaneie este QR Code no WhatsApp:");
        console.log(asciiQR);
      },
      statusFind: (statusSession) => {
        console.log("Status da sessão:", statusSession);
      },
    })
    .then((client) => listenMessages(client))
    .catch((error) => console.error("Erro ao iniciar:", error));
}

function listenMessages(client) {
  client.onMessage(async (message) => {
    // Ignora mensagens que não são texto
    if (!message.body || typeof message.body !== "string") {
      console.log("Mensagem ignorada (não é texto):", message.type);
      return;
    }

    // Ignora stories, broadcasts, mensagens do próprio bot ou tipos que não são texto
    if (
      message.isStatus || // story/status
      message.isBroadcast || // lista de transmissão
      message.fromMe || // mensagem do bot
      message.type !== "chat" // só texto
    ) {
      return;
    }

    // Evita processar grupos, se quiser só 1:1
    if (!message.isGroupMsg) {
        const nomeContato = message.sender.pushname || ""; // pega o nome do contato
        console.log("📩 Mensagem de", nomeContato, ":", message.body);

      try {
        const respostas = await gerarResposta(message.from, message.body,nomeContato);

        // Envia todas as respostas (pois gerarResposta agora retorna array)
        for (let r of respostas) {
          await client.sendText(message.from, r);
        }
      } catch (err) {
        console.error("Erro ao gerar resposta:", err);
        await client.sendText(
          message.from,
          "⚠️ Ocorreu um erro ao processar sua mensagem. Tente novamente."
        );
      }
    }
  });
}
