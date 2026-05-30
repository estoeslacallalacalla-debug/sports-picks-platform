export default async function handler(
  req,
  res
) {
  try {
    const token =
      process.env.TELEGRAM_BOT_TOKEN;

    const url =
      `https://api.telegram.org/bot${token}/sendMessage`;

    const response =
      await fetch(url, {
        method: "POST",
        headers: {
          "Content-Type":
            "application/json"
        },
        body: JSON.stringify({
          chat_id:
            "@sportspicksia2026",
          text:
            "🔥 Sports Picks IA conectado correctamente"
        })
      });

    const data =
      await response.json();

    res.status(200).json(data);
  } catch (error) {
    res.status(500).json({
      ok: false,
      error:
        error.message
    });
  }
}
