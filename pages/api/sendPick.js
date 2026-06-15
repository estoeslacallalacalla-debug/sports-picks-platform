import { sendTelegramMessage } from "../../biblioteca/telegram";

export default async function handler(req, res) {
  if (req.method !== "POST") {
    return res.status(405).json({ ok: false });
  }

  const { match, confidence } = req.body || {};

  if (
    typeof match !== "string" ||
    typeof confidence !== "number"
  ) {
    return res.status(400).json({ ok: false });
  }

  if (match.trim() === "" || confidence < 0 || confidence > 100) {
    return res.status(400).json({ ok: false });
  }

  const message =
`🔥 SPORTS PICK

⚽ Partido: ${match}
📊 Confianza: ${confidence}%

📡 Sistema automático`;

  try {
    await sendTelegramMessage(message);
    return res.status(200).json({ ok: true });
  } catch (err) {
    return res.status(500).json({ ok: false });
  }
}
