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

    if (
      !data.response
    ) {
      return res.status(200).json({
        promedioGoles:
          "0.0",
        over25: "0%",
        btts: "0%"
      });
    }

    const stats =
      data.response;

    const golesFavor =
      stats.goals.for.average.total ||
      0;

    const golesContra =
      stats.goals.against.average
        .total || 0;

    const over25 =
      stats.goals.for.average.total >
      1.5
        ? "Alta"
        : "Media";

    const btts =
      stats.clean_sheet.total <
      stats.fixtures.played.total /
        2
        ? "Alta"
        : "Media";

    res.status(200).json({
      promedioGoles:
        golesFavor,
      golesEncajados:
        golesContra,
      over25,
      btts
    });
  } catch (error) {
    res.status(200).json({
      promedioGoles:
        "0.0",
      golesEncajados:
        "0.0",
      over25: "0%",
      btts: "0%"
    });
  }
}
