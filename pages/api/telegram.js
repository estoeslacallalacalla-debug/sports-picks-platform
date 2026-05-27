export default async function handler(req, res) {
  const TOKEN =
    "8653728311:AAEK-cg-tcNjB1gF3HFA8HLRbOpb35OaF-U";

  const CHAT_ID = "1797474366";

  const mensaje =
    "🔥 PICK TOP DETECTADO\n\n⚽ Partido recomendado\n📊 Confianza alta";

  try {
    await fetch(
      `https://api.telegram.org/bot${TOKEN}/sendMessage`,
      {
        method: "POST",
        headers: {
          "Content-Type":
            "application/json"
        },
        body: JSON.stringify({
          chat_id: CHAT_ID,
          text: mensaje
        })
      }
    );

    res.status(200).json({
      ok: true
    });
  } catch (error) {
    res.status(500).json({
      error: "Error enviando Telegram"
    });
  }
}
