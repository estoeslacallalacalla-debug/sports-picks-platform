import { sendTelegramMessage } from "../../lib/telegram";

export default async function handler(req, res) {
  const { match, confidence } = req.body;

  const msg = `
🔥 PICK DETECTADO

⚽ ${match}
📊 Confianza: ${confidence}%
`;

  await sendTelegramMessage(msg);

  res.status(200).json({ ok: true });
}
