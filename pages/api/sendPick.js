import { sendTelegramMessage } from "../../lib/telegram";

export default async function handler(req, res) {
  // 🔒 Solo POST
  if (req.method !== "POST") {
    return res.status(405).json({
      ok: false,
      error: "Method not allowed. Use POST",
    });
  }

  try {
    const body = req.body;

    // 🔍 Validación segura
    if (!body || typeof body !== "object") {
      return res.status(400).json({
        ok: false,
        error: "Body inválido",
      });
    }

    const { match, confidence } = body;

    if (!match || typeof match !== "string" || match.trim().length < 3) {
      return res.status(400).json({
        ok: false,
        error: "match inválido",
      });
    }

    if (
      confidence === undefined ||
      typeof confidence !== "number" ||
      Number.isNaN(confidence) ||
      confidence < 0 ||
      confidence > 100
    ) {
      return res.status(400).json({
        ok: false,
        error: "confidence inválida (0-100)",
      });
    }

    // 🧠 Formato mejorado del mensaje
    const message =
      `🔥 <b>SPORTS PICK DETECTADO</b>\n\n` +
      `⚽ <b>Partido:</b> ${match}\n` +
      `📊 <b>Confianza:</b> ${confidence}%\n\n` +
      `📡 <i>Generado automáticamente por el sistema</i>`;

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
