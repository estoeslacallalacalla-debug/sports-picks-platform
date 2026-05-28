import { sendTelegramMessage } from "../../lib/telegram";

export default async function handler(req, res) {
  // ❌ Bloquear métodos que no sean POST
  if (req.method !== "POST") {
    return res.status(405).json({
      ok: false,
      error: "Method not allowed. Use POST.",
    });
  }

  try {
    const { match, confidence } = req.body;

    // ❌ Validación básica
    if (!match || !confidence) {
      return res.status(400).json({
        ok: false,
        error: "Faltan datos (match o confidence)",
      });
    }

    const msg = `
🔥 PICK DETECTADO

⚽ Partido: ${match}
📊 Confianza: ${confidence}%
`;

    await sendTelegramMessage(msg);

    return res.status(200).json({
      ok: true,
      message: "Pick enviado correctamente",
    });

  } catch (error) {
    console.error("Error sendPick:", error);

    return res.status(500).json({
      ok: false,
      error: "Error interno del servidor",
    });
  }
}
