import { sendTelegramMessage } from "../../lib/telegram";

export default async function handler(req, res) {
  // 🔒 Solo POST permitido
  if (req.method !== "POST") {
    return res.status(405).json({
      ok: false,
      error: "Method not allowed. Use POST",
    });
  }

  try {
    const { match, confidence } = req.body || {};

    // 🔍 Validación fuerte de datos
    if (typeof match !== "string" || match.trim() === "") {
      return res.status(400).json({
        ok: false,
        error: "match es obligatorio y debe ser texto",
      });
    }

    if (
      typeof confidence !== "number" ||
      confidence < 0 ||
      confidence > 100
    ) {
      return res.status(400).json({
        ok: false,
        error: "confidence debe ser un número entre 0 y 100",
      });
    }

    const message = `
🔥 <b>PICK DETECTADO</b>

⚽ Partido: ${match}
📊 Confianza: ${confidence}%
`;

    await sendTelegramMessage(message);

    return res.status(200).json({
      ok: true,
      message: "Pick enviado correctamente",
    });

  } catch (error) {
    console.error("sendPick error:", error);

    return res.status(500).json({
      ok: false,
      error: "Error interno del servidor",
    });
  }
}
