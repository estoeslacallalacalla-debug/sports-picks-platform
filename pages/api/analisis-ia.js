import { supabase } from "../../lib/supabase";
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

    const ligasPermitidas = [

  "World Cup",
  "FIFA Club World Cup",

  "Friendlies",
  "Friendlies Women",

  "World Cup - Qualification Europe",
  "World Cup - Qualification South America",

  "UEFA Nations League",
  "UEFA Champions League",
  "UEFA Europa League",
  "UEFA Europa Conference League",

  "Serie A",
  "Serie B",

  "LaLiga2",

  "2. Bundesliga",

  "MLS",
  "Liga MX",

  "Primera Nacional",
  "Primera A",
  "Liga 1",

  "Allsvenskan",
  "Eliteserien",
  "Veikkausliiga",

  "J1 League",
  "J2 League",

  "K League 1",

  "Superettan",
  "Ykkosliiga",

  "Copa America",
  "Euro Championship"
];

    const picks = [];

    for (
      const partido
      of partidos
    ) {

      const leagueName =
        partido.league.name;

      if (
        !ligasPermitidas.includes(
          leagueName
        )
      ) continue;

      const home =
        partido.teams.home;

      const away =
        partido.teams.away;

      const leagueId =
        partido.league.id;

      const season = 2026;

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

      if (!hs || !as) {

  picks.push({

  console.log(
  leagueName,
  mercado,
  confianza
);
    liga: leagueName,

    partido:
      `${home.name} vs ${away.name}`,

    mercado: "Sin estadísticas",

    confianza: 70,

    promedio: 0,

    fecha,

    resultado: "pendiente"
  });

  continue;
      }

      const avgHome =
        (
          (
            hs.goals?.for
              ?.total?.total || 0
          ) /

          (
            hs.fixtures
              ?.played?.total || 1
          )
        ).toFixed(2);

      const avgAway =
        (
          (
            as.goals?.for
              ?.total?.total || 0
          ) /

          (
            as.fixtures
              ?.played?.total || 1
          )
        ).toFixed(2);

      const promedio =
        (
          parseFloat(avgHome) +
          parseFloat(avgAway)
        ).toFixed(2);

      let confianza = 60;

      let mercado =
        "Ambos marcan";

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

      const formaHome =
        hs.form || "";

      const formaAway =
        as.form || "";

      if (
        formaHome.includes("W")
      ) confianza += 5;

      if (
        formaAway.includes("W")
      ) confianza += 5;

      confianza += Math.floor(
        Math.random() * 10
      );

       if (
  confianza < 50
) continue;

      picks.push({

  liga:
    leagueName,

  partido:
    `${home.name} vs ${away.name}`,

  mercado,

  confianza,

  promedio:
    parseFloat(promedio),

  fecha,

  resultado:
    "pendiente"
});
    }

    picks.sort(
      (a, b) =>
        b.confianza -
        a.confianza
    );

    const top3 =
  picks.slice(0, 8);
for (const pick of top3) {

  await supabase
    .from("picks")
    .insert([pick]);
}
    if (
      top3.length === 0
    ) {

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
              "📊 Hoy no se detectaron picks fuertes."
          })
        }
      );

    } else {

      for (
        const pick
        of top3
      ) {

        const mensaje =
`
🔥 TOP PICK IA

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
