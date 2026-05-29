export default async function handler(
  req,
  res
) {
  const token =
    process.env.TELEGRAM_BOT_TOKEN;

  const chatId =
    process.env.TELEGRAM_CHAT_ID;

  try {
    const prematch =
      await fetch(
        `${process.env.VERCEL_URL}/api/prematch`
      );

    const prematchData =
      await prematch.json();

    if (
      !prematchData.response
    ) {
      return res.status(200).json({
        ok: false
      });
    }

    const topMatch =
      prematchData.response[0];

    const message = `
🔥 PICK TOP IA

🏆 ${topMatch.league.name}

⚽ ${topMatch.teams.home.name} vs ${topMatch.teams.away.name}

🎯 Mercado recomendado:
Más de 2.5 goles

📊 Confianza alta IA

🤖 Sports Picks IA
`;

    const telegramUrl =
      `https://api.telegram.org/bot${token}/sendMessage`;

    await fetch(telegramUrl, {
      method: "POST",
      headers: {
        "Content-Type":
          "application/json"
      },
      body: JSON.stringify({
        chat_id: chatId,
        text: message
      })
    });

    res.status(200).json({
      ok: true
    });
  } catch (error) {
    res.status(200).json({
      ok: false
    });
  }
}
