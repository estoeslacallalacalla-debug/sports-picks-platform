import { supabase } from "../../lib/supabase";
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

    const bankroll = 100;

    const response =
      await fetch(
        `https://api.the-odds-api.com/v4/sports/soccer/odds/?regions=eu&markets=h2h&oddsFormat=decimal&apiKey=${apiKey}`
      );

    const data =
      await response.json();

    const surebets = [];

    const { data, error } =
  await supabase
    .from("apuestas_seguras")
    .insert([
      {
        partido: "PRUEBA",
        beneficio: "1%",
        ganancia: "1€",
        fecha: new Date()
          .toISOString()
          .split("T")[0],
        estado: "test",
        casa_local: "test",
        casa_empate: "test",
        casa_visitante: "test"
      }
    ])
    .select();

console.log(
  "SUPABASE TEST",
  data,
  error
);

console.log(
  "SUPABASE ERROR:",
  pruebaError
);
    
    for (const match of data) {

      if (
        !match.bookmakers ||
        match.bookmakers.length < 2
      ) continue;

      let bestHome = {
        price: 0,
        bookie: ""
      };

      let bestDraw = {
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

          else if (
            outcome.name === "Draw"
          ) {

            if (
              outcome.price >
              bestDraw.price
            ) {

              bestDraw = {
                price:
                  outcome.price,

                bookie:
                  bookmaker.title
              };
            }
          }

          else if (
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
        bestDraw.price > 0 &&
        bestAway.price > 0
      ) {

        const total =
          (
            1 / bestHome.price
          ) +
          (
            1 / bestDraw.price
          ) +
          (
            1 / bestAway.price
          );

          if (
            total < 2
            ) {
           
          const beneficio =
            (
              (
                1 - total
              ) * 100
            ).toFixed(2);

          const apuestaHome =
            (
              bankroll /
              bestHome.price /
              total
            ).toFixed(2);

          const apuestaDraw =
            (
              bankroll /
              bestDraw.price /
              total
            ).toFixed(2);

          const apuestaAway =
            (
              bankroll /
              bestAway.price /
              total
            ).toFixed(2);

          const ganancia =
            (
              (
                bankroll / total
              ) - bankroll
            ).toFixed(2);

          const surebet = {

            partido:
              `${match.home_team} vs ${match.away_team}`,

            beneficio:
              `${beneficio}%`,

            ganancia:
              `${ganancia}€`
          };

          surebets.push(
            surebet
          );

        const { data: insertData, error: insertError } =
  await supabase
    .from("apuestas_seguras")
    .insert([
      {
        partido: surebet.partido,
        beneficio: surebet.beneficio,
        ganancia: surebet.ganancia,
        fecha: new Date()
          .toISOString()
          .split("T")[0],
        estado: "activa",
        casa_local: bestHome.bookie,
        casa_empate: bestDraw.bookie,
        casa_visitante: bestAway.bookie
      }
    ]);

console.log(
  "SUPABASE INSERT:",
  insertData,
  insertError
);
        
          if (
            parseFloat(
              beneficio
            ) >= 1.5
          ) {

            const mensaje =
`
🔥 TRUE SUREBET DETECTADA

⚽ ${match.home_team} vs ${match.away_team}

━━━━━━━━━━━━

🏠 LOCAL
Cuota:
${bestHome.price}

Casa:
${bestHome.bookie}

💰 Apostar:
${apuestaHome}€

━━━━━━━━━━━━

🤝 EMPATE
Cuota:
${bestDraw.price}

Casa:
${bestDraw.bookie}

💰 Apostar:
${apuestaDraw}€

━━━━━━━━━━━━

✈️ VISITANTE
Cuota:
${bestAway.price}

Casa:
${bestAway.bookie}

💰 Apostar:
${apuestaAway}€

━━━━━━━━━━━━

📈 Beneficio:
${beneficio}%

💵 Ganancia segura:
${ganancia}€
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
