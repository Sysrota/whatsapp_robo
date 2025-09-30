import OpenAI from "openai";
import dotenv from "dotenv";
import { salvarMensagem, buscarHistorico } from "./db.js";
import { buscarBoletos, buscarPix } from "./financeiro.js";

dotenv.config();

const client = new OpenAI({ apiKey: process.env.OPENAI_API_KEY });

export async function gerarResposta(user, mensagem, nomeContato = "") {
  try {
    salvarMensagem(user, "user", mensagem);

    // 1️⃣ Classifica a intenção do usuário
    const intentCheck = await client.chat.completions.create({
      model: "gpt-5-mini",
      messages: [
        {
          role: "system",
          content: `
Você é um assistente educado e simpático da Sysrota. Classifique a intenção do usuário em:
- 'boleto' → se quer ver boletos da Sysrota
- 'pix' → se quer ver PIX da Sysrota
- 'cumprimento' → apenas cumprimentando ou falando algo casual
- 'agradecimento' → está agradecendo
- 'outro' → qualquer outro assunto
Responda apenas com uma dessas palavras.
          `
        },
        { role: "user", content: mensagem }
      ],
    });

    const intencao = intentCheck.choices[0].message.content.toLowerCase().trim();
    let respostas = [];

    // 2️⃣ Boletos
    if (intencao === "boleto") {
      const inicioBoleto = await client.chat.completions.create({
        model: "gpt-5-mini",
        messages: [
          {
            role: "system",
            content: `
Você é um assistente educado, simpático e profissional da Sysrota.
O usuário ${nomeContato ? `chama-se ${nomeContato}` : ''} quer ver seus boletos em aberto.
Responda de forma cordial, usando o nome dele se disponível (${nomeContato}), apenas informando que você vai buscar os boletos.
Não ofereça opções ou instruções adicionais.
          `
          },
          { role: "user", content: mensagem }
        ],
      });

      respostas.push(inicioBoleto.choices[0].message.content);

      const boletos = await buscarBoletos(user);
      if (boletos && boletos.length > 0) {
        boletos.reverse().forEach((b, index) => {
          respostas.push(
            `📄 Boleto em aberto:\n🔹 Vencimento: ${b.vencimento}\n💰 Valor: R$ ${b.valor}\n🔗 Link: ${b.link}`
          );
          respostas.push(`🏦 Código de Barras:\n${b.codigo_barras}`);
          if (index < boletos.length - 1) respostas.push("----------------------------");
        });
      } else {
        respostas.push(`✅ ${nomeContato ? `${nomeContato}, ` : ''}não há boletos em aberto no momento. 😄`);
      }

    // 3️⃣ PIX
    } else if (intencao === "pix") {
      const inicioPix = await client.chat.completions.create({
        model: "gpt-5-mini",
        messages: [
          {
            role: "system",
            content: `
Você é um assistente educado, simpático e profissional da Sysrota.
O usuário ${nomeContato ? `chama-se ${nomeContato}` : ''} quer ver seus PIX.
Responda de forma cordial, usando o nome dele se disponível (${nomeContato}), apenas informando que você vai buscar os PIX.
Não ofereça opções, instruções ou geração de QR Code.
          `
          },
          { role: "user", content: mensagem }
        ],
      });

      respostas.push(inicioPix.choices[0].message.content);

      const pixList = await buscarPix(user);
      if (pixList && pixList.length > 0) {
        pixList.reverse().forEach((p, index) => {
          respostas.push(
            `💸 PIX disponível:\n💰 Valor: R$ ${p.valor}\n📅 Vencimento: ${p.data_vencimento}\n🔑 Copia e Cola:👇`
          );
          respostas.push(`${p.qrcode}`);
          if (index < pixList.length - 1) respostas.push("----------------------------");
        });
      } else {
        respostas.push(`❌ ${nomeContato ? `${nomeContato}, ` : ''}não encontrei PIX em aberto no momento. 😅`);
      }

    // 4️⃣ Cumprimentos
    } else if (intencao === "cumprimento") {
      const completion = await client.chat.completions.create({
        model: "gpt-5-mini",
        messages: [
          {
            role: "system",
            content: `
Você é um assistente educado, simpático e cordial da Sysrota.
O usuário apenas cumprimentou. Responda de forma acolhedora e natural, usando o nome dele (${nomeContato}) no início.
Mantenha sempre o contexto financeiro (boletos ou PIX) e não ofereça outros serviços.
Exemplo de tom: "Olá, ${nomeContato}! 😄 Que bom falar com você! Posso ajudá-lo com seus boletos ou PIX da Sysrota hoje?"
          `
          },
          { role: "user", content: mensagem }
        ],
      });

      respostas.push(completion.choices[0].message.content);

    // 5️⃣ Agradecimentos
    } else if (intencao === "agradecimento") {
      const despedida = await client.chat.completions.create({
        model: "gpt-5-mini",
        messages: [
          {
            role: "system",
            content: `
Você é um assistente educado da Sysrota.
O usuário agradeceu. Responda de forma simpática, usando o nome dele (${nomeContato}) se disponível, e se despeça.
Não ofereça mais boletos ou PIX.
          `
          },
          { role: "user", content: mensagem }
        ],
      });

      respostas.push(despedida.choices[0].message.content);

    // 6️⃣ Outros assuntos
    } else {
      const respostaOutro = await client.chat.completions.create({
        model: "gpt-5-mini",
        messages: [
          {
            role: "system",
            content: `
Você é um assistente educado, simpático e profissional da Sysrota.
O usuário falou sobre um assunto que não é financeiro.
Responda de forma cordial, usando o nome dele (${nomeContato}) se disponível,
e informe que ele deve contatar o Isac no número (62) 99345-3838.
          `
          },
          { role: "user", content: mensagem }
        ],
      });

      respostas.push(respostaOutro.choices[0].message.content);
    }

    // Salvar respostas
    respostas.forEach(r => salvarMensagem(user, "assistant", r));
    return respostas;

  } catch (err) {
    console.error("Erro na IA:", err);
    return ["⚠️ Desculpe, não consegui responder agora."];
  }
}
