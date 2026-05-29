export default async function handler(
  req,
  res
) {
  const apiKey =
    process.env.API_FOOTBALL_KEY;

  const { team } = req.query;

  try {
    // Buscar equipo
    const searchResponse =
      await fetch(
        `https://v3.football.api-sports.io/teams?search=${team}`,
        {
          headers: {
            "x-apisports-key":
              apiKey
          }
        }
      );

    const searchData =
      await searchResponse.json();

    if (
      !searchData.response ||
      searchData.response.length === 0
    ) {
      return res.status(200).json({
        resultados: [],
        promedioGoles: "0.0"
      });
    }

    const teamId =
      searchData.response[0].team.id;

    // Últimos 5 partidos
    const fixturesResponse =
      await fetch(
        `https://v3.football.api-sports.io/fixtures?team=${teamId}&last=5`,
        {
          headers: {
            "x-apisports-key":
              apiKey
          }
        }
      );

    const fixturesData =
      await fixturesResponse.json();

    if (
      !fixturesData.response ||
      fixturesData.response.length === 0
    ) {
      return res.status(200).json({
        resultados: [],
        promedioGoles: "0.0"
      });
    }

    const resultados = [];

    let golesTotales = 0;

    fixturesData.response.forEach(
      (match) => {
        const homeGoals =
          match.goals.home ?? 0;

        const awayGoals =
          match.goals.away ?? 0;

        golesTotales +=
          homeGoals + awayGoals;

        const isHome =
          match.teams.home.id ===
          teamId;

        const golesEquipo =
          isHome
            ? homeGoals
            : awayGoals;

        const golesRival =
          isHome
            ? awayGoals
            : homeGoals;

        if (
          golesEquipo >
          golesRival
        ) {
          resultados.push("✅");
        } else if (
          golesEquipo ===
          golesRival
        ) {
          resultados.push("➖");
        } else {
          resultados.push("❌");
        }
      }
    );

    const promedioGoles =
      (
        golesTotales /
        fixturesData.response.length
      ).toFixed(1);

    res.status(200).json({
      resultados,
      promedioGoles
    });
  } catch (error) {
    res.status(200).json({
      resultados: [],
      promedioGoles: "0.0"
    });
  }
}
