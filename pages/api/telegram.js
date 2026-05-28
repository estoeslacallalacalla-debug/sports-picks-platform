export default function handler(req, res) {
  // Webhook de Telegram (silencioso)
  res.status(200).json({ ok: true });
}
