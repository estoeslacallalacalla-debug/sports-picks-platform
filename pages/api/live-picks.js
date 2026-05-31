export default async function handler(
  req,
  res
) {
  try {

    const apiKey =
      process.env.API_FOOTBALL_KEY;

    const telegramToken =
      process.env.TELEGRAM_BOT_TOKEN;

    const telegramChat =
      "@sportspicksia2026";

    const response =
      await fetch(
        `https://v3.football.api-sports.io/fixtures?live=all`,
        {
          headers: {
            "x-apisports-key":
              apiKey
          }
        }
      );

    const data =
      await response.json();

    const partidos =
      data.response || [];

    const picks = [];

    for (const partido of partidos) {

      const home =
        partido.teams.home.name;

      const away =
        partido.teams.away.name;

      const golesHome =
        partido.goals.home || 0;

      const golesAway =
        partido.goals.away || 0;

      const minuto =
        partido.fixture.status.elapsed || 0;

      const tirosHome =
        partido.statistics?.[0]
          ?.statistics?.find(
            s =>
              s.type ===
              "Total Shots"
          )?.value || 0;

      const tirosAway =
        partido.statistics?.[1]
          ?.statistics?.find(
            s =>
              s.type ===
              "Total Shots"
          )?.value || 0;

      const totalGoles =
        golesHome + golesAway;

      let mercado = "";
      let confianza = 0;

      if (
        minuto >= 60 &&
        totalGoles <= 1 &&
        (
          tirosHome +
          tirosAway
        ) >= 20
      ) {

        mercado =
          "Gol en los próximos minutos";

        confianza = 90;
      }

      if (
        minuto >= 70 &&
        totalGoles >= 2
      ) {

        mercado =
          "Over 3.5 live";

        confianza = 88;
      }

      if (
        golesHome >= 1 &&
        golesAway >= 1
      ) {

        mercado =
          "Ambos marcan LIVE";

        confianza = 86;
      }

      if (
        confianza >= 85
      ) {

        const pick = {

          partido:
            `${home} vs ${away}`,

          minuto,

          mercado,

          confianza
        };

        picks.push(pick);

        const mensaje =
`
🔥 LIVE PICK IA

⚽ ${pick.partido}

⏱️ Minuto:
${pick.minuto}

🎯 Mercado:
${pick.mercado}

🚀 Confianza:
${pick.confianza}%
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

    res.status(200).json({

      total:
        picks.length,

      picks
    });

  } catch (error) {

    res.status(500).json({
      error:
        error.message
    });
  }
}
