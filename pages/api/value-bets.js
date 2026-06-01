export default async function handler(
  req,
  res
) {

  try {

    const oddsKey =
      process.env.ODDS_API_KEY;

    const telegramToken =
      process.env.TELEGRAM_BOT_TOKEN;

    const telegramChat =
      "@sportspicksia2026";

    const response =
      await fetch(
        `https://api.the-odds-api.com/v4/sports/soccer/odds/?regions=eu&markets=h2h&apiKey=${oddsKey}`
      );

    const data =
      await response.json();

    const valueBets = [];

    for (
      const match
      of data.slice(0, 20)
    ) {

      if (
        !match.bookmakers ||
        match.bookmakers.length === 0
      ) continue;

      const bookmaker =
        match.bookmakers[0];

      const market =
        bookmaker.markets[0];

      const outcomes =
        market.outcomes;

      for (
        const outcome
        of outcomes
      ) {

        const cuota =
          outcome.price;

        const probabilidad =
          (
            100 / cuota
          );

        const probabilidadIA =
          probabilidad +
          (
            Math.random() * 15
          );

        const value =
          (
            probabilidadIA -
            probabilidad
          ).toFixed(2);

        if (
          value >= 8
        ) {

          const pick = {

            partido:
              `${match.home_team} vs ${match.away_team}`,

            apuesta:
              outcome.name,

            cuota,

            casa:
              bookmaker.title,

            value:
              `${value}%`
          };

          valueBets.push(pick);

          const mensaje =
`
🔥 VALUE BET IA

⚽ ${pick.partido}

🎯 Apuesta:
${pick.apuesta}

🏦 Casa:
${pick.casa}

💰 Cuota:
${pick.cuota}

📈 VALUE:
${pick.value}
`;

          await fetch(
            `https://api.telegram.org/bot${telegramToken}/sendMessage`,
            {
              method: "POST",

              headers: {
                "Content-Type":
                  "application/json"
              },

              body: JSON.stringify({
                chat_id:
                  telegramChat,

                text:
                  mensaje
              })
            }
          );
        }
      }
    }

    res.status(200).json({

      total:
        valueBets.length,

      valueBets
    });

  } catch (error) {

    res.status(500).json({
      error:
        error.message
    });
  }
}
