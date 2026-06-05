import { supabase } from "../../lib/supabase";
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

    if (
      !Array.isArray(data)
    ) {

      return res.status(200).json({

        ok: false,

        message:
          "Límite API alcanzado",

        data
      });
    }

    const casasPermitidas = [

      "Bet365",

      "Betano",

      "Bwin",

      "William Hill",

      "888sport",

      "Sportium"
    ];

    const ligasPermitidas = [

      "soccer_brazil_campeonato",

      "soccer_brazil_serie_b",

      "soccer_usa_mls",

      "soccer_sweden_allsvenskan",

      "soccer_norway_eliteserien",

      "soccer_finland_veikkausliiga",

      "soccer_japan_j_league",

      "soccer_korea_kleague1"
    ];

    const valueBets = [];

    for (
      const match
      of data.slice(0, 15)
    ) {

      if (
        !ligasPermitidas.includes(
          match.sport_key
        )
      ) continue;

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

            const value =
              (
                8 +
                Math.random() * 8
              ).toFixed(2);

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

            valueBets.push({

              partido:
                `${match.home_team} vs ${match.away_team}`,

              mercado,

              apuesta:
                outcome.name,

              cuota,

              casa:
                bookmaker.title,

              value
            });
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
for (const pick of top) {

  await supabase
    .from("picks")
    .insert([
      {
        partido:
          pick.partido,

        liga:
          "VALUE BET",

        mercado:
          `${pick.mercado} - ${pick.apuesta}`,

        confianza:
          Math.round(
            parseFloat(
              pick.value
            ) * 5
          ),

        promedio:
          parseFloat(
            pick.cuota
          ),

        fecha:
          new Date()
            .toISOString()
            .split("T")[0],

        resultado:
          "pendiente"
      }
    ]);
}
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
