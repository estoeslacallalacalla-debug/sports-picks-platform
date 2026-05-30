export default async function handler(
  req,
  res
) {
  try {
    const apiKey =
      process.env.ODDS_API_KEY;

    const telegramToken =
      process.env.TELEGRAM_BOT_TOKEN;

    const telegramChat =
      "@sportspicksia2026";

    const response =
      await fetch(
        `https://api.the-odds-api.com/v4/sports/soccer/odds/?regions=eu&markets=h2h&oddsFormat=decimal&apiKey=${apiKey}`
      );

    const data =
      await response.json();

    const surebets = [];

    for (const match of data) {
      if (
        !match.bookmakers ||
        match.bookmakers.length < 2
      )
        continue;

      let bestHome = {
        price: 0,
        bookie: ""
      };

      let bestAway = {
        price: 0,
        bookie: ""
      };

      for (const bookmaker of match.bookmakers) {
        const market =
          bookmaker.markets?.find(
            (m) =>
              m.key === "h2h"
          );

        if (!market) continue;

        for (const outcome of market.outcomes) {
          if (
            outcome.name ===
            match.home_team
          ) {
            if (
              outcome.price >
              bestHome.price
            ) {
              bestHome = {
                price:
                  outcome.price,
                bookie:
                  bookmaker.title
              };
            }
          }

          if (
            outcome.name ===
            match.away_team
          ) {
            if (
              outcome.price >
              bestAway.price
            ) {
              bestAway = {
                price:
                  outcome.price,
                bookie:
                  bookmaker.title
              };
            }
          }
        }
      }

      if (
        bestHome.price > 0 &&
        bestAway.price > 0
      ) {
        const total =
          1 / bestHome.price +
          1 / bestAway.price;

        if (total < 1) {
          const beneficio =
            (
              (1 - total) *
              100
            ).toFixed(2);

          const surebet = {
            partido:
              `${match.home_team} vs ${match.away_team}`,
            local:
              bestHome,
            visitante:
              bestAway,
            beneficio:
              `${beneficio}%`
          };

          surebets.push(
            surebet
          );

          if (
            parseFloat(
              beneficio
            ) >= 2
          ) {
            const mensaje =
              `
🔥 SUREBET DETECTADA

⚽ ${surebet.partido}

🏠 Local:
${bestHome.price} (${bestHome.bookie})

✈️ Visitante:
${bestAway.price} (${bestAway.bookie})

💰 Beneficio:
${beneficio}%
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
    }

    res.status(200).json({
      total:
        surebets.length,
      surebets
    });
  } catch (error) {
    res.status(500).json({
      error:
        error.message
    });
  }
}
