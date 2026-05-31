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

    for (const partido of partidos.slice(0, 20)) {

      const homeTeam =
        partido.teams.home;

      const awayTeam =
        partido.teams.away;

      const leagueId =
        partido.league.id;

      const season = 2024;

      const homeStatsResponse =
        await fetch(
          `https://v3.football.api-sports.io/teams/statistics?league=${leagueId}&season=${season}&team=${homeTeam.id}`,
          {
            headers: {
              "x-apisports-key":
                apiKey
            }
          }
        );

      const awayStatsResponse =
        await fetch(
          `https://v3.football.api-sports.io/teams/statistics?league=${leagueId}&season=${season}&team=${awayTeam.id}`,
          {
            headers: {
              "x-apisports-key":
                apiKey
            }
          }
        );

      const homeData =
        await homeStatsResponse.json();

      const awayData =
        await awayStatsResponse.json();

      const homeStats =
        homeData.response;

      const awayStats =
        awayData.response;

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

      const formaHome =
        homeStats.form || "";

      const formaAway =
        awayStats.form || "";

      let confianza = 50;

      let mercado =
        "Partido equilibrado";

      let calidad = "Media";

      if (
        promedioTotal >= 3
      ) {

        mercado =
          "Over 2.5 goles";

        confianza += 20;
      }

      if (
        promedioTotal >= 4
      ) {

        mercado =
          "Over 3.5 goles";

        confianza += 10;
      }

      if (
        parseFloat(
          promedioHome
        ) >= 1.5 &&
        parseFloat(
          promedioAway
        ) >= 1.2
      ) {

        mercado =
          "Ambos marcan";

        confianza += 15;
      }

      if (
        parseFloat(
          encajadosHome
        ) >= 1.5 &&
        parseFloat(
          encajadosAway
        ) >= 1.5
      ) {

        confianza += 10;
      }

      if (
        formaHome.includes("W")
      ) {

        confianza += 5;
      }

      if (
        formaAway.includes("W")
      ) {

        confianza += 5;
      }

      if (
        formaHome.includes("L") &&
        formaAway.includes("L")
      ) {

        confianza -= 10;
      }

      if (
        confianza >= 90
      ) {

        calidad = "TOP";
      }

      else if (
        confianza >= 80
      ) {

        calidad = "Alta";
      }

      else if (
        confianza >= 70
      ) {

        calidad = "Buena";
      }

      else {

        calidad = "Media";
      }

      if (
        confianza < 70
      ) continue;

      const pick = {

        liga:
          partido.league.name,

        partido:
          `${homeTeam.name} vs ${awayTeam.name}`,

        mercado,

        confianza,

        calidad,

        promedio:
          promedioTotal,

        formaHome,

        formaAway,

        golesLocal:
          promedioHome,

        golesVisitante:
          promedioAway
      };

      picks.push(pick);

      if (
        confianza >= 85
      ) {

        const mensaje =
`
🔥 PICK IA PRO

🏆 ${pick.liga}

⚽ ${pick.partido}

🎯 Mercado:
${pick.mercado}

📊 Promedio:
${pick.promedio}

📈 Forma local:
${pick.formaHome}

📈 Forma visitante:
${pick.formaAway}

⭐ Calidad:
${pick.calidad}

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

    picks.sort(
      (
        a,
        b
      ) =>
        b.confianza -
        a.confianza
    );

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
