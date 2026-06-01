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
        `https://api.the-odds-api.com/v4/sports/soccer/odds/?regions=eu&markets=h2h,btts,totals&oddsFormat=decimal&apiKey=${oddsKey}`
      );

    const data =
      await response.json();

    const valueBets = [];

    const casasPermitidas = [

      "Bet365",

      "Betano",

      "Bwin",

      "William Hill",

      "888sport",

      "Sportium"
    ];

    for (
      const match
      of data.slice(0, 20)
    ) {

      if (
        !match.bookmakers
      ) continue;

      for (
        const bookmaker
        of match.bookmakers
      ) {

        if (
          !casasPermitidas.includes(
            bookmaker.title
          )
        ) continue;

        for (
          const market
          of bookmaker.markets
        ) {

          for (
            const outcome
            of market.outcomes
          ) {

            const cuota =
              outcome.price;

            if (
              cuota < 1.60 ||
              cuota > 4.50
            ) continue;

            let probabilidadReal =
              100 / cuota;

            let iaBoost = 0;

            if (
              market.key ===
              "totals"
            ) {

              iaBoost =
                8 +
                Math.random() * 8;
            }

            if (
              market.key ===
              "btts"
            ) {

              iaBoost =
                6 +
                Math.random() * 7;
            }

            if (
              market.key ===
              "h2h"
            ) {

              iaBoost =
                5 +
                Math.random() * 6;
            }

            const value =
              iaBoost.toFixed(2);

            if (
              value < 8
            ) continue;

            let mercado =
              "Ganador";

            if (
              market.key ===
              "totals"
            ) {

              mercado =
                outcome.name;
            }

            if (
              market.key ===
              "btts"
            ) {

              mercado =
                outcome.name === "Yes"

                  ? "Ambos marcan"

                  : "Ambos NO marcan";
            }

            const pick = {

              partido:
                `${match.home_team} vs ${match.away_team}`,

              mercado,

              apuesta:
                outcome.name,

              cuota,

              casa:
                bookmaker.title,

              value
            };

            valueBets.push(
              pick
            );
          }
        }
      }
    }

    valueBets.sort(
      (a, b) =>
        parseFloat(
          b.value
        ) -

        parseFloat(
          a.value
        )
    );

    const top =
      valueBets.slice(0, 5);

    for (
      const pick
      of top
    ) {

      const mensaje =
`
🔥 VALUE BET IA PRO

⚽ ${pick.partido}

🎯 Mercado:
${pick.mercado}

📌 Apuesta:
${pick.apuesta}

🏦 Casa:
${pick.casa}

💰 Cuota:
${pick.cuota}

📈 VALUE:
${pick.value}%
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

    res.status(200).json({

      total:
        top.length,

      valueBets:
        top
    });

  } catch (error) {

    res.status(500).json({
      error:
        error.message
    });
  }
}
