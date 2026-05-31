import fs from "fs";
import path from "path";

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

      const home =
        partido.teams.home;

      const away =
        partido.teams.away;

      const leagueId =
        partido.league.id;

      const season = 2024;

      const homeStatsResponse =
        await fetch(
          `https://v3.football.api-sports.io/teams/statistics?league=${leagueId}&season=${season}&team=${home.id}`,
          {
            headers: {
              "x-apisports-key":
                apiKey
            }
          }
        );

      const awayStatsResponse =
        await fetch(
          `https://v3.football.api-sports.io/teams/statistics?league=${leagueId}&season=${season}&team=${away.id}`,
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

      const hs =
        homeData.response;

      const as =
        awayData.response;

      if (!hs || !as)
        continue;

      const homeGoals =
        hs.goals?.for
          ?.total?.total || 0;

      const awayGoals =
        as.goals?.for
          ?.total?.total || 0;

      const homeGames =
        hs.fixtures
          ?.played?.total || 1;

      const awayGames =
        as.fixtures
          ?.played?.total || 1;

      const avgHome =
        (
          homeGoals /
          homeGames
        ).toFixed(2);

      const avgAway =
        (
          awayGoals /
          awayGames
        ).toFixed(2);

      const promedio =
        (
          parseFloat(avgHome) +
          parseFloat(avgAway)
        ).toFixed(2);

      let mercado =
        "Ambos marcan";

      let confianza = 75;

      if (
        promedio >= 3
      ) {

        mercado =
          "Over 2.5 goles";

        confianza += 10;
      }

      if (
        promedio >= 4
      ) {

        mercado =
          "Over 3.5 goles";

        confianza += 10;
      }

      if (
        parseFloat(avgHome)
          >= 1.5 &&
        parseFloat(avgAway)
          >= 1.2
      ) {

        confianza += 10;
      }

      if (
        confianza < 80
      ) continue;

      const pick = {

        fecha,

        liga:
          partido.league.name,

        partido:
          `${home.name} vs ${away.name}`,

        mercado,

        confianza,

        promedio
      };

      picks.push(pick);

      const historialPath =
        path.join(
          process.cwd(),
          "data",
          "historial.json"
        );

      let historial = [];

      if (
        fs.existsSync(
          historialPath
        )
      ) {

        historial =
          JSON.parse(
            fs.readFileSync(
              historialPath,
              "utf8"
            )
          );
      }

      const existe =
        historial.find(
          h =>
            h.partido ===
              pick.partido &&
            h.fecha ===
              pick.fecha
        );

      if (!existe) {

        historial.push({
          ...pick,
          resultado:
            "pendiente"
        });

        fs.writeFileSync(
          historialPath,
          JSON.stringify(
            historial,
            null,
            2
          )
        );
      }

      if (
        confianza >= 90
      ) {

        const mensaje =
`
🔥 PICK IA PRO

⚽ ${pick.partido}

🏆 ${pick.liga}

🎯 ${pick.mercado}

📊 Promedio:
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
