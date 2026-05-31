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

    for (const partido of partidos.slice(0, 15)) {

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
      ) continue;

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

      const homeAgainst =
        parseFloat(
          homeStats.goals
            ?.against?.total
            ?.total || 0
        );

      const awayAgainst =
        parseFloat(
          awayStats.goals
            ?.against?.total
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

      const encajadosHome =
        (
          homeAgainst /
          homeGames
        ).toFixed(2);

      const encajadosAway =
        (
          awayAgainst /
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

      let mercado = "";
      let confianza = 0;

      const diferencia =
        Math.abs(
          parseFloat(
            promedioHome
          ) -
          parseFloat(
            promedioAway
          )
        );

      if (
        promedioTotal >= 4
      ) {
        mercado =
          "Over 3.5 goles";
        confianza = 95;
      }

      else if (
        promedioTotal >= 3
      ) {
        mercado =
          "Over 2.5 goles";
        confianza = 90;
      }

      else if (
        promedioTotal >= 2
      ) {
        mercado =
          "Over 1.5 goles";
        confianza = 82;
      }

      else {
        mercado =
          "Menos de 2.5 goles";
        confianza = 75;
      }

      if (
        diferencia >= 1.5
      ) {

        if (
          parseFloat(
            promedioHome
          ) >
          parseFloat(
            promedioAway
          )
        ) {

          mercado =
            `${homeTeam.name} gana`;

          confianza = 88;

        } else {

          mercado =
            `${awayTeam.name} gana`;

          confianza = 88;
        }
      }

      if (
        parseFloat(
          promedioHome
        ) >= 1.2 &&
        parseFloat(
          promedioAway
        ) >= 1.2
      ) {

        mercado =
          "Ambos marcan";

        confianza = 86;
      }

      if (
        parseFloat(
          encajadosHome
        ) >= 1.5 &&
        parseFloat(
          encajadosAway
        ) >= 1.5
      ) {

        mercado =
          "Over 2.5 goles";

        confianza = 92;
      }

      const pick = {

        liga:
          partido.league.name,

        partido:
          `${homeTeam.name} vs ${awayTeam.name}`,

        mercado,

        confianza,

        promedio:
          promedioTotal,

        golesLocal:
          promedioHome,

        golesVisitante:
          promedioAway,

        encajadosLocal:
          encajadosHome,

        encajadosVisitante:
          encajadosAway
      };

      picks.push(pick);

      if (
        confianza >= 90
      ) {

        const mensaje =
`
🔥 PICK IA DETECTADO

🏆 ${pick.liga}

⚽ ${pick.partido}

🎯 Mercado:
${pick.mercado}

📊 Promedio goles:
${pick.promedio}

⚔️ Ataque local:
${pick.golesLocal}

⚔️ Ataque visitante:
${pick.golesVisitante}

🛡️ Encajados local:
${pick.encajadosLocal}

🛡️ Encajados visitante:
${pick.encajadosVisitante}

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
