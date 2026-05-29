export default async function handler(
  req,
  res
) {
  const apiKey =
    process.env.API_FOOTBALL_KEY;

  const {
    teamId,
    leagueId,
    season
  } = req.query;

  try {
    const response =
      await fetch(
        `https://v3.football.api-sports.io/teams/statistics?league=${leagueId}&season=${season}&team=${teamId}`,
        {
          headers: {
            "x-apisports-key":
              apiKey
          }
        }
      );

    const data =
      await response.json();

    if (!data.response) {
      return res.status(200).json({
        promedioGoles:
          "0.0",
        golesEncajados:
          "0.0",
        over25: "Media",
        btts: "Media"
      });
    }

    const stats =
      data.response;

    const promedioGoles =
      stats.goals?.for?.average
        ?.total || "0.0";

    const golesEncajados =
      stats.goals?.against
        ?.average?.total || "0.0";

    const partidos =
      stats.fixtures?.played
        ?.total || 0;

    const cleanSheets =
      stats.clean_sheet?.total || 0;

    const over25 =
      parseFloat(
        promedioGoles
      ) > 1.5
        ? "Alta"
        : "Media";

    const btts =
      cleanSheets <
      partidos / 2
        ? "Alta"
        : "Media";

    res.status(200).json({
      promedioGoles,
      golesEncajados,
      over25,
      btts
    });
  } catch (error) {
    res.status(200).json({
      promedioGoles:
        "0.0",
      golesEncajados:
        "0.0",
      over25: "Media",
      btts: "Media"
    });
  }
}
