import { sendTelegramMessage } from "../../lib/telegram";

export default async function handler(req, res) {
  if (req.method !== "POST") {
    return res.status(405).json({ error: "Method not allowed" });
  }

  try {
    const { match, confidence } = req.body;

    const msg = `
🔥 PICK DETECTADO

⚽ Partido: ${match}
📊 Confianza: ${confidence}%
`;

    await sendTelegramMessage(msg);

    return res.status(200).json({ ok: true });
  } catch (error) {
    return res.status(500).json({ error: "Error enviando pick" });
  }
}
