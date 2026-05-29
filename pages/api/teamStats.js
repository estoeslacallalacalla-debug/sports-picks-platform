export default async function handler(
  req,
  res
) {
  const apiKey =
    process.env.API_FOOTBALL_KEY;

  const { teamId } = req.query;

  try {
    const response =
      await fetch(
        `https://v3.football.api-sports.io/fixtures?team=${teamId}&last=10`,
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
      !data.response ||
      data.response.length === 0
    ) {
      return res.status(200).json({
        promedioGoles:
          "0.0",
        golesEncajados:
          "0.0",
        over25: "Media",
        btts: "Media"
      });
    }

    let golesFavor = 0;
    let golesContra = 0;
    let partidosOver25 = 0;
    let partidosBTTS = 0;

    data.response.forEach(
      (match) => {
        const isHome =
          match.teams.home.id ==
          teamId;

        const golesEquipo =
          isHome
            ? match.goals.home
            : match.goals.away;

        const golesRival =
          isHome
            ? match.goals.away
            : match.goals.home;

        golesFavor +=
          golesEquipo;

        golesContra +=
          golesRival;

        if (
          golesEquipo +
            golesRival >=
          3
        ) {
          partidosOver25++;
        }

        if (
          golesEquipo >= 1 &&
          golesRival >= 1
        ) {
          partidosBTTS++;
        }
      }
    );

    const totalPartidos =
      data.response.length;

    const promedioGoles =
      (
        golesFavor /
        totalPartidos
      ).toFixed(1);

    const promedioEncajados =
      (
        golesContra /
        totalPartidos
      ).toFixed(1);

    const over25Porcentaje =
      (
        (partidosOver25 /
          totalPartidos) *
        100
      ).toFixed(0);

    const bttsPorcentaje =
      (
        (partidosBTTS /
          totalPartidos) *
        100
      ).toFixed(0);

    res.status(200).json({
      promedioGoles,
      golesEncajados:
        promedioEncajados,
      over25:
        over25Porcentaje + "%",
      btts:
        bttsPorcentaje + "%"
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
