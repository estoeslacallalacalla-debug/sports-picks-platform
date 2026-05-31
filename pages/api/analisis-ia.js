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

    const fecha =
      new Date()
        .toISOString()
        .split("T")[0];

    const fixturesResponse =
      await fetch(
        `https://v3.football.api-sports.io/fixtures?date=${fecha}`,
        {
          headers: {
            "x-apisports-key":
              apiKey
          }
        }
      );

    const fixturesData =
      await fixturesResponse.json();

    const partidos =
      fixturesData.response || [];

    const picks = [];

    for (const partido of partidos.slice(0, 10)) {
      const homeTeam =
        partido.teams.home;

      const awayTeam =
        partido.teams.away;

      const homeStatsResponse =
        await fetch(
          `https://v3.football.api-sports.io/teams/statistics?league=${partido.league.id}&season=2024&team=${homeTeam.id}`,
          {
            headers: {
              "x-apisports-key":
                apiKey
            }
          }
        );

      const awayStatsResponse =
        await fetch(
          `https://v3.football.api-sports.io/teams/statistics?league=${partido.league.id}&season=2024&team=${awayTeam.id}`,
          {
            headers: {
              "x-apisports-key":
                apiKey
            }
          }
        );

      const homeStatsData =
        await homeStatsResponse.json();

      const awayStatsData =
        await awayStatsResponse.json();

      const homeStats =
        homeStatsData.response;

      const awayStats =
        awayStatsData.response;

      if (
        !homeStats ||
        !awayStats
      )
        continue;

      const homeGoals =
        parseFloat(
          homeStats.goals
            ?.for?.total
            ?.total || 0
        );

      const awayGoals =
        parseFloat(
          awayStats.goals
            ?.for?.total
            ?.total || 0
        );

      const homeGames =
        parseFloat(
          homeStats.fixtures
            ?.played?.total || 1
        );

      const awayGames =
        parseFloat(
          awayStats.fixtures
            ?.played?.total || 1
        );

      const promedioHome =
        (
          homeGoals /
          homeGames
        ).toFixed(2);

      const promedioAway =
        (
          awayGoals /
          awayGames
        ).toFixed(2);

      const promedioTotal =
        (
          parseFloat(
            promedioHome
          ) +
          parseFloat(
            promedioAway
          )
        ).toFixed(2);

      let mercado =
        "Ambos marcan";

      let confianza = 75;

      if (
        promedioTotal >= 3
      ) {
        mercado =
          "Over 2.5 goles";
        confianza = 90;
      }

      if (
        promedioTotal >= 4
      ) {
        confianza = 95;
      }

      const pick = {
        liga:
          partido.league.name,
        partido:
          `${homeTeam.name} vs ${awayTeam.name}`,
        mercado,
        confianza,
        promedio:
          promedioTotal
      };

      picks.push(pick);

      if (confianza >= 90) {
        const mensaje =
          `
🔥 PICK IA DETECTADO

🏆 ${pick.liga}

⚽ ${pick.partido}

🎯 Mercado:
${pick.mercado}

📊 Promedio goles:
${pick.promedio}

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
