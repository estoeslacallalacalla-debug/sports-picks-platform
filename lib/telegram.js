export async function sendTelegramMessage(text) {
  // Unificado: usa TELEGRAM_BOT_TOKEN igual que el resto del proyecto
  const token   = process.env.TELEGRAM_BOT_TOKEN || process.env.TELEGRAM_TOKEN;
  const chat_id = process.env.TELEGRAM_CHAT_ID;

  if (!token || !chat_id) {
    console.error("Telegram: faltan TELEGRAM_BOT_TOKEN o TELEGRAM_CHAT_ID");
    return;
  }

  const res = await fetch(
    `https://api.telegram.org/bot${token}/sendMessage`,
    {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ chat_id, text, parse_mode: "HTML" }),
    }
  );

  const data = await res.json();
  if (!data.ok) {
    console.error("Telegram error:", data.description);
  }
}
