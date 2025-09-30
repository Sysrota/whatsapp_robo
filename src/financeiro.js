import axios from "axios";

const BASE_URL = "https://app2.sysrota.com.br";

// Buscar boletos do cliente
export async function buscarBoletos(clienteId) {
  try {
    const { data } = await axios.get(`${BASE_URL}/api/whatsapp_bot/boleto`, {
      params: { busca: "18707079000150" }
    });

    return data.boletos || [];
  } catch (err) {
    console.error("Erro ao buscar boletos:", err.response?.data || err.message);
    return [];
  }
}

// Buscar PIX do cliente
export async function buscarPix(clienteId) {
  try {
    const { data } = await axios.get(`${BASE_URL}/api/whatsapp_bot/qrcode`, {
      params: { busca: "18707079000150" }
    });

    return data.boletos || [];
  } catch (err) {
    console.error("Erro ao buscar PIX:", err.response?.data || err.message);
    return [];
  }
}
