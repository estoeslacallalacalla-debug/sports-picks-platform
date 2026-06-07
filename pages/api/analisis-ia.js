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

      const season = 2025;

      let confianza = 75;

let mercado = "Over 1.5 goles";

if (
  leagueName.includes("Friendlies")
) {
  confianza = 80;
  mercado = "Ambos marcan";
}

let confianza = 75;

let mercado = "Over 1.5 goles";

if (
  leagueName.includes("Friendlies")
) {
  confianza = 80;
  mercado = "Ambos marcan";
}

picks.push({

  liga: leagueName,

  partido:
    `${home.name} vs ${away.name}`,

  mercado,

  confianza,

  promedio: 2.5,

  fecha,

  resultado: "pendiente"
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
